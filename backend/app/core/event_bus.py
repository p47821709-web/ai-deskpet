import asyncio

class EventBus:
    def __init__(self):
        self._listeners = {}

    def on(self, event: str, callback):
        if event not in self._listeners:
            self._listeners[event] = []
        self._listeners[event].append(callback)

    async def emit(self, event: str, **data):
        for cb in self._listeners.get(event, []):
            await cb(data)

event_bus = EventBus()
