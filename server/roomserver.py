import random
import json
import asyncio
import collections
import time
from websockets.server import serve
from enum import Enum

def public_encoder(o):
    return o.__json__()

class cnc:
    def __init__(self, websocket):
        self.websocket = websocket
        self.name = None
        self.room = None

#room ids to rooms
roommap = {}
class room:
    def __init__(self, id, owner_id):
        global roommap
        self.id = id
        self.owner_id = owner_id
        self.owner_name = connections[owner_id].name
        self.connections = [owner_id]
        self.state = None
        self.started = False
        roommap[id] = self

    def join(self, connection_id):
        if False:
            return None
        self.connections.append(connection_id)
        return self

    async def broadcast(self, d):
        for connection_id in self.connections.values():
            await send(connection_id, d)

    def start(self):
        self.started == True
        return self.state.start()

    def disconnect(self, connection_id):
        global roommap
        self.connections.remove(connection_id)
        if len(self.connections) <= 0:
            del roommap[self.id]

    def __json__(self):
        return {"id": str(self.id), "owner": str(self.owner_name), "connections": len(self.connections), "started": self.started}

async def send(connection_id, d):
    assert type(d) == dict
    assert connection_id in connections.keys()
    await connections[connection_id].websocket.send(json.dumps(d, default=public_encoder))

async def join_room(msg, connection_id):
    room_id = str(msg["room_id"])
    if room_id in roommap.keys() and not roommap[room_id].started:
        r = roommap[room_id]
        if r.join(connection_id):
            await r.broadcast({"msg": "player_join", "payload": r})
    else:
        await send(connection_id, {"msg": "error"}, {"payload": {"text": "unable to join room" + r.id}})

async def list_rooms(msg, connection_id):
    await send(connection_id, {"msg": "rooms", "payload": list(roommap.values())})

async def start_game(msg, connection_id):
    room_id = str(msg["room_id"])
    if room_id in roommap.keys() and not roommap[room_id].started and connection_id == roommap[room_id].owner:
        if room_id.start():
            return
    await send(connection_id, {"msg": "error"}, {"payload": {"text": "unable to start room" + room_id}})


async def create_room(msg, connection_id):
    room_id = str(msg["room_id"])
    if not room_id in roommap.keys():
        r = room(room_id, connection_id)
        roommap[room_id] = r
        connections[connection_id].room = r
        await send(connection_id, {"msg": "room_made", "payload": r})
    else:
        await send(connection_id, {"msg": "error", "payload": {"text": "unable to make room" + room_id}})


function_map = {
    'join_room': join_room,
    'list_rooms': list_rooms,
    'start_game': start_game,
    'create_room': create_room
}


#connections to cnc class which includes websocket && roomid
connections = {}
async def handle_connection(websocket, path):
    # Generate a unique ID for the connection
    connection_id = hash(websocket)
    # Store the connection in the dictionary
    connections[connection_id] = cnc(websocket)
    #TODO test if this accidentally resets the whole thing lol^
    try:
        async for message in websocket:
            print(message)
            jm = json.loads(message)
            await function_map[jm['msg']](jm.get("payload",{}), connection_id)
    finally:
        # Connection closed, remove it from the dictionary
        print("CONNECTION CLOSED", roommap, connections)
        c = connections[connection_id]
        if c.room:
            roommap[c.room.id].disconnect(connection_id)
        del connections[connection_id]

start_server = serve(handle_connection, "0.0.0.0", 8080)

asyncio.get_event_loop().run_until_complete(start_server)

asyncio.get_event_loop().run_forever()