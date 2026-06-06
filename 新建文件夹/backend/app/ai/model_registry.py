class ModelRegistry:
    def __init__(self):
        self._models = {}

    def register(self, provider: str, model: str, config: dict):
        key = f"{provider}/{model}"
        self._models[key] = config

    def get(self, provider: str, model: str):
        return self._models.get(f"{provider}/{model}")

model_registry = ModelRegistry()
