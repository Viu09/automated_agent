from app.agents.base import AgentDefinitionData, AgentExecutionResult, BaseAgent
from app.agents.weather.client import WeatherClient
from app.core.config import settings


class WeatherAgent(BaseAgent):
    definition = AgentDefinitionData(
        key="weather",
        name="Weather Agent",
        description="Fetches weather conditions and returns actionable recommendations.",
        schedule="0 * * * *",
        default_config={
            "latitude": settings.weather_agent_default_latitude,
            "longitude": settings.weather_agent_default_longitude,
            "location_label": settings.weather_agent_default_label,
        },
    )

    def __init__(self) -> None:
        self.client = WeatherClient()

    def collect_inputs(self, payload: dict) -> dict:
        latitude = float(payload.get("latitude", settings.weather_agent_default_latitude))
        longitude = float(payload.get("longitude", settings.weather_agent_default_longitude))
        location_label = payload.get("location_label") or settings.weather_agent_default_label
        weather = self.client.fetch_weather(latitude=latitude, longitude=longitude)
        return {
            "latitude": latitude,
            "longitude": longitude,
            "location_label": location_label,
            "weather": weather,
        }

    def process(self, inputs: dict) -> dict:
        weather = inputs["weather"]
        temperature = weather["temperature_c"]
        if temperature < 10:
            recommendation = "Wear a warm layer before going outside."
        elif temperature > 26:
            recommendation = "Hydrate well and avoid intense activity during the hottest hours."
        else:
            recommendation = "Conditions look comfortable for focused work and a short walk."

        return {
            "location": {
                "label": inputs["location_label"],
                "latitude": inputs["latitude"],
                "longitude": inputs["longitude"],
            },
            "conditions": weather,
            "recommendation": recommendation,
        }

    def decide(self, processed: dict) -> dict:
        return processed

    def act(self, decision: dict) -> AgentExecutionResult:
        return AgentExecutionResult(
            summary="Weather snapshot generated successfully.",
            content=decision,
        )
