from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from langchain_openai import OpenAIEmbeddings
from typing import List, Dict, Any, Optional
from config import settings
import uuid
import asyncio

class RAGSystem:
    def __init__(self):
        self.client = QdrantClient(url=settings.qdrant_url)
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=settings.openai_api_key
        )
        self.collection_name = settings.qdrant_collection
        self._ensure_collection()
    
    def _ensure_collection(self):
        """Create collection if it doesn't exist"""
        collections = self.client.get_collections().collections
        if not any(c.name == self.collection_name for c in collections):
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=1536,  # OpenAI embedding dimension
                    distance=Distance.COSINE
                )
            )

    async def add_incident(self, incident_id: str, error_message: str, root_cause: str, fix: str, metadata: Dict[str, Any]):
        """Add resolved incident to knowledge base"""
        try:
            # combine text for better semantic search
            text = f"""
            Error: {error_message}
            Root Cause: {root_cause}
            Fix: {fix}
            Service: {metadata.get('service', 'unknown')}
            """

            # Generate Embedding
            embedding = await self.embeddings.aembed_query(text)
            # Store in Qdrant
            point = PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={
                    "incident_id": incident_id,
                    "error_message": error_message,
                    "root_cause": root_cause,
                    "fix": fix,
                    "metadata": metadata
                }
            )

            # Actually upsert the point into the collection
            self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )
        except Exception as e:
            print(f"[RAG] Error adding incident: {e}")
            raise

    async def search_similar_incidents(
        self,
        error_message: str,
        limit: int = 3,
        score_threshold: float = 0.75
    ) -> List[Dict[str, Any]]:
        """Search for similar past incidents"""
        try:
            # Generate query embedding
            query_embedding = await self.embeddings.aembed_query(error_message)

            # Search in Qdrant
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                limit=limit,
                score_threshold=score_threshold
            )

            return [
                {
                    "incident_id": hit.payload["incident_id"],
                    "error_message": hit.payload["error_message"],
                    "root_cause": hit.payload["root_cause"],
                    "fix": hit.payload["fix"],
                    "score": hit.score,
                    "metadata": hit.payload["metadata"]
                }
                for hit in results
            ]
        except Exception as e:
            print(f"[RAG] Error searching incidents: {e}")
            # Return empty list if search fails
            return []