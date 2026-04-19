"""GitHub Releases channel adapter for external signal discovery."""

import structlog

import httpx

from .base import BaseChannel, DiscoveryItem

logger = structlog.get_logger(__name__)


class GitHubReleasesChannel(BaseChannel):
    """Scans GitHub releases for a repository, filtering by query keyword."""

    async def scan(self, config: dict, query: str) -> list[DiscoveryItem]:
        owner = config.get("owner", "")
        repo = config.get("repo", "")
        if not owner or not repo:
            logger.warning("github_scan_missing_config", owner=owner, repo=repo)
            return []

        url = f"https://api.github.com/repos/{owner}/{repo}/releases"
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(
                    url,
                    headers={"User-Agent": "MemexFlow-Worker/1.0", "Accept": "application/vnd.github+json"},
                )
                resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            logger.warning("github_scan_http_error", url=url, status=exc.response.status_code)
            return []
        except httpx.HTTPError as exc:
            logger.warning("github_scan_request_error", url=url, error=str(exc))
            return []

        try:
            releases = resp.json()
        except (ValueError, TypeError) as exc:
            logger.warning("github_scan_parse_error", url=url, error=str(exc))
            return []

        if not isinstance(releases, list):
            logger.warning("github_scan_unexpected_response", url=url)
            return []

        query_lower = query.lower()
        items: list[DiscoveryItem] = []

        for release in releases[:30]:  # limit to recent 30 releases
            name = release.get("name", "") or release.get("tag_name", "")
            tag = release.get("tag_name", "")
            body = release.get("body", "") or ""
            html_url = release.get("html_url", "")
            published_at = release.get("published_at")

            if not html_url:
                continue

            # Filter by query keyword
            searchable = f"{name} {tag} {body}".lower()
            if query_lower and query_lower not in searchable:
                continue

            items.append(DiscoveryItem(
                source_uri=html_url,
                title=name or tag,
                summary=body[:500] if body else None,
                published_at=published_at,
            ))

        return items