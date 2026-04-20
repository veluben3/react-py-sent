from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = (
        "postgresql+psycopg2://postgres:postgres@localhost:5432/reactpy"
    )
    cors_origins: str = "http://localhost:5173"

    azure_openai_endpoint: str = "https://ix-hrtest-2402.cognitiveservices.azure.com/"
    azure_openai_api_key: str = ""
    azure_openai_deployment: str = "gpt-4o-mini"
    azure_openai_api_version: str = "2024-08-01-preview"

    max_response_words: int = 250

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def azure_openai_configured(self) -> bool:
        return bool(
            self.azure_openai_endpoint
            and self.azure_openai_api_key
            and self.azure_openai_deployment
        )


settings = Settings()
