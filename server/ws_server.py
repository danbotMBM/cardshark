import simple_state
import asyncio
from websockets.server import serve

async def broadcast(socks, msg):
    for w in socks:
        await w.send(msg)

connections = set()
state = simple_state.simple_state()
async def handle_connection(websocket, path):
    connections.add(websocket)
    state.connect(websocket)
    await websocket.send("Joined " + str(websocket) + "\n Group is :" + str(connections))
    try:
        async for message in websocket:
            print(message)
            message_list, broadcast_msg = state.handle(websocket, message)
            for m in message_list:
                await m[0].send(m[1])
            if broadcast_msg:
                await broadcast(connections, broadcast_msg)
            print(state)
    finally:
        print(str(websocket) + " connection terminated")
        state.disconnect(websocket)
        connections.remove(websocket)

server = serve(handle_connection, "0.0.0.0", 8080)
asyncio.get_event_loop().run_until_complete(server)
asyncio.get_event_loop().run_forever()