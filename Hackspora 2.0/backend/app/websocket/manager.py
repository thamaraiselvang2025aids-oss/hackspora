import json
from typing import Dict, List, Set
from fastapi import WebSocket

class WebSocketConnectionManager:
    """
    Manages real-time WebSocket client connections for:
    1. World state synchronization (/ws/world-state/{user_id})
    2. Emergency & Receiver alerts (/ws/emergency/{user_id})
    """
    def __init__(self):
        self.emergency_connections: Dict[str, Set[WebSocket]] = {}
        self.world_connections: Dict[str, Set[WebSocket]] = {}
        self.global_listeners: Set[WebSocket] = set()

    async def connect_emergency(self, websocket: WebSocket, user_id: str = "default-user"):
        await websocket.accept()
        if user_id not in self.emergency_connections:
            self.emergency_connections[user_id] = set()
        self.emergency_connections[user_id].add(websocket)
        self.global_listeners.add(websocket)
        print(f"[WS] Emergency connection registered for user: {user_id}")

    def disconnect_emergency(self, websocket: WebSocket, user_id: str = "default-user"):
        if user_id in self.emergency_connections:
            self.emergency_connections[user_id].discard(websocket)
        self.global_listeners.discard(websocket)
        print(f"[WS] Emergency connection closed for user: {user_id}")

    async def connect_world(self, websocket: WebSocket, user_id: str = "default-user"):
        await websocket.accept()
        if user_id not in self.world_connections:
            self.world_connections[user_id] = set()
        self.world_connections[user_id].add(websocket)

    def disconnect_world(self, websocket: WebSocket, user_id: str = "default-user"):
        if user_id in self.world_connections:
            self.world_connections[user_id].discard(websocket)

    async def broadcast_emergency_update(self, payload: dict, user_id: str = "default-user"):
        message = json.dumps(payload)
        targets = set()
        if user_id in self.emergency_connections:
            targets.update(self.emergency_connections[user_id])
        targets.update(self.global_listeners)

        dead_connections = set()
        for ws in targets:
            try:
                await ws.send_text(message)
            except Exception as e:
                dead_connections.add(ws)

        for ws in dead_connections:
            self.global_listeners.discard(ws)
            if user_id in self.emergency_connections:
                self.emergency_connections[user_id].discard(ws)

ws_manager = WebSocketConnectionManager()
