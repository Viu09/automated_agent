class NewsClient:
    def fetch_headlines(self, topic: str) -> list[dict]:
        try:
            import httpx

            response = httpx.get(
                "https://hn.algolia.com/api/v1/search",
                params={"query": topic, "tags": "story"},
                timeout=10.0,
            )
            response.raise_for_status()
            payload = response.json()
            return [
                {
                    "title": hit.get("title") or "Untitled story",
                    "url": hit.get("url") or hit.get("story_url") or f"https://news.ycombinator.com/item?id={hit.get('objectID')}",
                    "source": "Hacker News",
                }
                for hit in payload.get("hits", [])[:5]
            ]
        except Exception:
            return [
                {"title": f"{topic.title()} market continues to evolve", "url": None, "source": "fallback"},
                {"title": f"New tooling trends in {topic}", "url": None, "source": "fallback"},
                {"title": f"Teams refine their {topic} workflows", "url": None, "source": "fallback"},
            ]
