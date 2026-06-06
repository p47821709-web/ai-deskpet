class GenerationService:
    def __init__(self, db):
        self.db = db

    async def create_job(self, user_id: str, file_url: str):
        return {}

    async def get_job(self, job_id: str):
        return {}

    async def process_job(self, job_id: str):
        pass
