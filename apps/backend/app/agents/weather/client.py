class WeatherClient:
    def fetch_weather(self, latitude: float, longitude: float) -> dict:
        try:
            import httpx

            response = httpx.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "current": "temperature_2m,apparent_temperature,precipitation,weather_code",
                },
                timeout=10.0,
            )
            response.raise_for_status()
            current = response.json()["current"]
            return {
                "temperature_c": current["temperature_2m"],
                "feels_like_c": current["apparent_temperature"],
                "precipitation_mm": current["precipitation"],
                "weather_code": current["weather_code"],
                "source": "open-meteo",
            }
        except Exception:
            return {
                "temperature_c": 21,
                "feels_like_c": 21,
                "precipitation_mm": 0,
                "weather_code": 0,
                "source": "fallback",
            }
