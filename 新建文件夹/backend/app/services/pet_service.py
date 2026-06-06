class PetService:
    def __init__(self, db):
        self.db = db

    async def list_pets(self, user_id: str):
        return []

    async def get_pet(self, pet_id: str):
        return None

    async def create_pet(self, user_id: str, data: dict):
        return {}

    async def update_pet(self, pet_id: str, data: dict):
        return {}

    async def delete_pet(self, pet_id: str):
        pass
