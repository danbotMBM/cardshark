import random
import json
import asyncio
import collections
from websockets.server import serve

players = {}
connections = {}

class player():
    
    def __init__(self, name):
        self.deck = collections.deque()
        self.name = name
    def draw_card(self):
        try: 
            return self.deck.popleft()
        except IndexError:
            return None
    def __json__(self):
        return {"num_cards": len(self.deck), "name":self.name}

def public_encoder(o):
    return o.__json__()

cards = [x for x in range(2,15) for _ in range(4)]
def deal(cards):
    random.shuffle(cards)
    while cards:
        for _, p in players.items():
            p.deck.append(cards.pop())
            if not cards:
                break

async def join(connection_id, p):
    if len(players.keys()) >= 2:
        return
    players[connection_id] = player(p["name"])
    print(connections)
    if len(players.keys()) == 2:
        deal(cards)
    await broadcast(json.dumps({"msg_type":"state","payload": {"players": players}}, default=public_encoder))

async def play_card(connection_id, p):
    try:
        card = players[connection_id].draw_card()
        if card:
            await broadcast(json.dumps({"msg_type":"draw_card","payload": {"card":card, "player":connection_id}}))
        else:
            del players[connection_id]
            await broadcast(json.dumps({"msg_type":"lost", "payload": {"player":connection_id}}))
    except Exception:
        await broadcast(json.dumps({"msg_type":"lost", "payload": {"player":connection_id}}))
function_map = {
    'join': join,
    'play_card': play_card
}

async def broadcast(msg):
    for connection_id, w in connections.items():
        await connections[connection_id].send(msg)


async def handle_connection(websocket, path):
    # Generate a unique ID for the connection
    connection_id = hash(websocket)
    
    # Store the connection in the dictionary
    connections[connection_id] = websocket

    try:
        async for message in websocket:
            print(message)
            jm = json.loads(message)
            await function_map[jm['msg_type']](connection_id, jm.get("payload",{}))
    finally:
        # Connection closed, remove it from the dictionary
        del connections[connection_id]
        if connection_id in players.keys():
            del players[connection_id]  
        await broadcast(json.dumps({"msg_type":"state","payload": {"players": players}}, default=public_encoder))      

async def play_round(players, connections):
    pass
start_server = serve(handle_connection, "0.0.0.0", 8080)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()