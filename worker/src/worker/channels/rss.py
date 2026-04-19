"""RSS feed channel adapter for external signal discovery."""

import structlog
import xml.etree.ElementTree as ET

import httpx

from .base import BaseChannel, DiscoveryItem

logger = structlog.get_logger(__name__)

RSS_NS = {"rss": "http://purl.org/rss/1.0/"}
ATOM_NS = {"atom": "http://www.w3.org/2005/Atom"}


class RSSChannel(BaseChannel):
    """Scans RSS 2.0 and Atom feeds for items matching a query keyword."""

    async def scan(self, config: dict, query: str) -> list[DiscoveryItem]:
        feed_url = config.get("feed_url", "")
        if not feed_url:
            logger.warning("rss_scan_missing_feed_url")
            return []

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(feed_url)
                resp.raise_for_status()
        except httpx.HTTPError as exc:
            logger.warning("rss_scan_http_error", feed_url=feed_url, error=str(exc))
            return []

        try:
            root = ET.fromstring(resp.text)
        except ET.ParseError as exc:
            logger.warning("rss_scan_parse_error", feed_url=feed_url, error=str(exc))
            return []

        items: list[DiscoveryItem] = []
        query_lower = query.lower()

        # Detect feed format by root tag
        root_tag = root.tag.split("}")[-1] if "}" in root.tag else root.tag

        if root_tag == "rss":
            # RSS 2.0: <rss><channel><item>
            for item in root.iter("item"):
                title = _get_text(item, "title") or ""
                link = _get_text(item, "link") or ""
                description = _get_text(item, "description") or ""
                pub_date = _get_text(item, "pubDate")

                if not link:
                    continue
                if query_lower and query_lower not in title.lower() and query_lower not in description.lower():
                    continue

                items.append(DiscoveryItem(
                    source_uri=link,
                    title=title,
                    summary=description[:500] if description else None,
                    published_at=pub_date,
                ))

        elif root_tag == "feed":
            # Atom: <feed><entry>
            for entry in root.iter("entry"):
                # Handle namespace-prefixed tags
                title_el = entry.find("atom:title", ATOM_NS) or entry.find("title")
                title = (title_el.text or "").strip() if title_el is not None and title_el.text else ""

                # Atom <link> uses href attribute
                link = ""
                for link_el in entry.findall("atom:link", ATOM_NS) or entry.findall("link"):
                    href = link_el.get("href", "")
                    rel = link_el.get("rel", "alternate")
                    if rel == "alternate" and href:
                        link = href
                        break
                    elif href and not link:
                        link = href

                summary_el = entry.find("atom:summary", ATOM_NS) or entry.find("summary") or entry.find("atom:content", ATOM_NS) or entry.find("content")
                summary = (summary_el.text or "").strip() if summary_el is not None and summary_el.text else ""

                published_el = entry.find("atom:published", ATOM_NS) or entry.find("published") or entry.find("atom:updated", ATOM_NS) or entry.find("updated")
                published_at = published_el.text.strip() if published_el is not None and published_el.text else None

                if not link:
                    continue
                if query_lower and query_lower not in title.lower() and query_lower not in summary.lower():
                    continue

                items.append(DiscoveryItem(
                    source_uri=link,
                    title=title,
                    summary=summary[:500] if summary else None,
                    published_at=published_at,
                ))

        return items


def _get_text(element: ET.Element, tag: str) -> str | None:
    """Get text content of a direct child element."""
    child = element.find(tag)
    if child is not None and child.text:
        return child.text.strip()
    return None