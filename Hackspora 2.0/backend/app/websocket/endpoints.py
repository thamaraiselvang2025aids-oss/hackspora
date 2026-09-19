from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.manager import ws_manager

router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/emergency/{user_id}")
async def emergency_websocket_endpoint(websocket: WebSocket, user_id: str):
    await ws_manager.connect_emergency(websocket, user_id)
    try:
        while True:
            # Keep connection alive and receive client signals if any
            data = await websocket.receive_text()
            # Echo or process incoming ping
            await websocket.send_text('{"event": "PONG"}')
    except WebSocketDisconnect:
        ws_manager.disconnect_emergency(websocket, user_id)
    except Exception as e:
        ws_manager.disconnect_emergency(websocket, user_id)

@router.websocket("/ws/world-state/{user_id}")
async def world_state_websocket_endpoint(websocket: WebSocket, user_id: str):
    await ws_manager.connect_world(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text('{"event": "WORLD_STATE_SYNC"}')
    except WebSocketDisconnect:
        ws_manager.disconnect_world(websocket, user_id)
    except Exception as e:
        ws_manager.disconnect_world(websocket, user_id)
