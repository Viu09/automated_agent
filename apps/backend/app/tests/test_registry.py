from app.agents.registry import registry


def test_registry_exposes_expected_agents() -> None:
    keys = {definition.key for definition in registry.definitions()}
    assert {"weather", "news", "productivity"} <= keys

