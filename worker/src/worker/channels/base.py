"""Base class for signal channel adapters."""

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class DiscoveryItem:
    """A single item discovered from an external source."""

    source_uri: str
    title: str
    summary: str | None
    published_at: str | None


class BaseChannel(ABC):
    """Abstract base for external signal channel adapters."""

    @abstractmethod
    async def scan(self, config: dict, query: str) -> list[DiscoveryItem]:
        """Scan the external source and return matching items.

        Args:
            config: Channel-specific config (e.g. {"feed_url": "..."}, {"owner": "...", "repo": "..."}).
            query: The rule's query string to filter results by keyword match.
        """
        ...