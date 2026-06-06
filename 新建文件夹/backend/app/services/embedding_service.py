class EmbeddingService:
    def __init__(self):
        self.model_name = "text-embedding-3-small"
        self.dimension = 1536

    async def embed(self, text: str):
        return []

    async def cosine_similarity(self, a: list, b: list):
        return 0.0
