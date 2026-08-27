"""
WebSocket Connection Manager
Manages real-time WebSocket client connections and broadcasts 
live emergency events (such as new citizen reports) to all connected clients.
"""

import json
from typing import List, Dict, Any
from fastapi import WebSocket

class WebSocketConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WebSocket] Client connected. Total active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WebSocket] Client disconnected. Remaining active connections: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcasts a dictionary payload as JSON to all active WebSocket clients."""
        if not self.active_connections:
            return

        disconnected_clients = []
        payload_str = json.dumps(message)

        for connection in self.active_connections:
            try:
                await connection.send_text(payload_str)
            except Exception as e:
                print(f"[WebSocket Error] Failed to send message to client: {e}")
                disconnected_clients.append(connection)

        for client in disconnected_clients:
            self.disconnect(client)

# Global singleton WebSocket connection manager instance
ws_manager = WebSocketConnectionManager()
