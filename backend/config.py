from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    openai_api_key: str
    sentry_auth_token: str
    sentry_org: str
    sentry_project: str
    
    # Database
    database_url: str
    
    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "incidents"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # App Config
    environment: str = "development"
    log_level: str = "INFO"

    # MCP Configuration
    use_real_mcp: bool = False  # Set to True to use real MCP server-client communication
    
    class Config:
        env_file = ".env"

settings = Settings()