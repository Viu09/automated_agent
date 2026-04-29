from app.agents.weather.agent import WeatherAgent


def test_weather_agent_returns_recommendation() -> None:
    result = WeatherAgent().execute({"latitude": 48.8566, "longitude": 2.3522})
    assert result.summary
    assert "recommendation" in result.content
    assert "conditions" in result.content
