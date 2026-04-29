from app.core.config import settings


class GitHubClient:
    def fetch_repository(self, owner: str, repo: str) -> dict:
        headers = {"Accept": "application/vnd.github+json"}
        if settings.github_token:
            headers["Authorization"] = f"Bearer {settings.github_token}"

        try:
            import httpx

            response = httpx.get(
                f"https://api.github.com/repos/{owner}/{repo}",
                headers=headers,
                timeout=10.0,
            )
            response.raise_for_status()
            return response.json()
        except Exception:
            return {
                "full_name": f"{owner}/{repo}",
                "open_issues_count": 0,
                "stargazers_count": 0,
                "source": "fallback",
            }
