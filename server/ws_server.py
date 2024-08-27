import simple_state
import asyncio
from websockets.server import serve
import ssl

async def broadcast(socks, msg):
    for w in socks:
        await w.send(msg)

connections = set()
state = simple_state.simple_state()
async def handle_connection(websocket, path):
    connections.add(websocket)
    join_msg = state.connect(websocket)
    await websocket.send(join_msg)
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
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain(certfile="/etc/cardshark_server/cert/fullchain.pem", keyfile="/etc/cardshark_server/cert/privkey.pem")
server = serve(handle_connection, "0.0.0.0", 8081, ssl=ssl_context)
asyncio.get_event_loop().run_until_complete(server)
asyncio.get_event_loop().run_forever()