class ChatService:
    def __init__(self, db):
        self.db = db

    async def create_session(self, pet_id: str):
        return {}

    async def send_message(self, session_id: str, content: str):
        return {}

    async def get_messages(self, session_id: str):
        return []
