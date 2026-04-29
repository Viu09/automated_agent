from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AgentExecutionResult:
    summary: str
    content: dict[str, Any]
    result_type: str = "snapshot"
    emitted_events: list[str] = field(default_factory=list)


@dataclass
class AgentDefinitionData:
    key: str
    name: str
    description: str
    schedule: str | None = None
    default_config: dict[str, Any] = field(default_factory=dict)


class BaseAgent(ABC):
    definition: AgentDefinitionData

    def execute(self, payload: dict[str, Any]) -> AgentExecutionResult:
        inputs = self.collect_inputs(payload)
        processed = self.process(inputs)
        decision = self.decide(processed)
        return self.act(decision)

    @abstractmethod
    def collect_inputs(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def process(self, inputs: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def decide(self, processed: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def act(self, decision: dict[str, Any]) -> AgentExecutionResult:
        raise NotImplementedError
