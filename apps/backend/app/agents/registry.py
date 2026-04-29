from collections.abc import Iterable

from app.agents.base import AgentDefinitionData, BaseAgent
from app.agents.news.agent import NewsAgent
from app.agents.productivity.agent import ProductivityAgent
from app.agents.weather.agent import WeatherAgent


class AgentRegistry:
    def __init__(self) -> None:
        self._agents: dict[str, type[BaseAgent]] = {}

    def register(self, agent_cls: type[BaseAgent]) -> None:
        self._agents[agent_cls.definition.key] = agent_cls

    def create(self, key: str) -> BaseAgent:
        try:
            return self._agents[key]()
        except KeyError as exc:
            raise KeyError(f"Agent '{key}' is not registered.") from exc

    def definitions(self) -> Iterable[AgentDefinitionData]:
        return [agent_cls.definition for agent_cls in self._agents.values()]


registry = AgentRegistry()
registry.register(WeatherAgent)
registry.register(NewsAgent)
registry.register(ProductivityAgent)

