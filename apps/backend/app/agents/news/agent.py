from app.agents.base import AgentDefinitionData, AgentExecutionResult, BaseAgent
from app.agents.news.client import NewsClient
from app.core.config import settings


class NewsAgent(BaseAgent):
    definition = AgentDefinitionData(
        key="news",
        name="News Agent",
        description="Fetches domain news and produces a concise summary.",
        schedule="0 7 * * *",
        default_config={"topic": settings.news_agent_default_topic},
    )

    def __init__(self) -> None:
        self.client = NewsClient()

    def collect_inputs(self, payload: dict) -> dict:
        topic = payload.get("topic", settings.news_agent_default_topic)
        return {"topic": topic, "headlines": self.client.fetch_headlines(topic=topic)}

    def process(self, inputs: dict) -> dict:
        return {
            "topic": inputs["topic"],
            "headlines": inputs["headlines"],
            "headline_count": len(inputs["headlines"]),
        }

    def decide(self, processed: dict) -> dict:
        headlines = processed["headlines"][:3]
        summary = " | ".join(item["title"] for item in headlines) if headlines else "No headline available."
        return {
            "topic": processed["topic"],
            "summary": summary,
            "headline_count": len(headlines),
            "headlines": headlines,
        }

    def act(self, decision: dict) -> AgentExecutionResult:
        return AgentExecutionResult(
            summary=f"Top {decision['topic']} news ready.",
            content=decision,
        )
