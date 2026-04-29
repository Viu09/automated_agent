from app.agents.base import AgentDefinitionData, AgentExecutionResult, BaseAgent
from app.agents.productivity.github_client import GitHubClient
from app.core.config import settings


class ProductivityAgent(BaseAgent):
    definition = AgentDefinitionData(
        key="productivity",
        name="Productivity Agent",
        description="Tracks GitHub development activity and extracts focus items.",
        schedule="0 9,14,18 * * 1-5",
        default_config={"owner": settings.github_default_owner, "repo": settings.github_default_repo},
    )

    def __init__(self) -> None:
        self.client = GitHubClient()

    def collect_inputs(self, payload: dict) -> dict:
        owner = payload.get("owner", settings.github_default_owner)
        repo = payload.get("repo", settings.github_default_repo)
        if not owner or not repo:
            raise ValueError("Configure a GitHub owner and repository before running the productivity agent.")
        return {"owner": owner, "repo": repo, "repo_data": self.client.fetch_repository(owner, repo)}

    def process(self, inputs: dict) -> dict:
        repo_data = inputs["repo_data"]
        open_issues = repo_data.get("open_issues_count", 0)
        stars = repo_data.get("stargazers_count", 0)
        return {
            "owner": inputs["owner"],
            "repo": inputs["repo"],
            "open_issues": open_issues,
            "stars": stars,
            "health": "needs_attention" if open_issues > 10 else "steady",
        }

    def decide(self, processed: dict) -> dict:
        focus = "Triage open issues." if processed["health"] == "needs_attention" else "Continue planned delivery."
        return {**processed, "focus": focus}

    def act(self, decision: dict) -> AgentExecutionResult:
        return AgentExecutionResult(
            summary=f"GitHub repo {decision['owner']}/{decision['repo']} reviewed.",
            content=decision,
        )
