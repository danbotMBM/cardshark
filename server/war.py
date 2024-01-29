import random
import json
import asyncio
import collections
import time
from websockets.server import serve
from enum import Enum

players = {}
connections = {}

class State(Enum):
    waiting = 0
    round = 1
    game_end = 2

game_state = State.waiting

class Player():
    
    def __init__(self, name):
        self.deck = collections.deque()
        self.name = name
        self.hand = None
            
    def draw_card(self):
        try: 
            self.hand = self.deck.popleft()
            return self.hand
        except IndexError:
            return None
    def __json__(self):
        return {"num_cards": len(self.deck), "name":self.name, "hand":str(self.hand)}
    def __str__(self):
        return json.dumps(self, default=public_encoder)
    
def public_encoder(o):
    return o.__json__()


def deal():
    cards = [x for x in range(2,15) for _ in range(4)]
    random.shuffle(cards)
    while cards:
        for _, p in players.items():
            p.deck.append(cards.pop())
            if not cards:
                break

async def join(connection_id, p):
    global game_state
    if not game_state == State.waiting:
        return
    players[connection_id] = Player(p["name"])
    print(connections)
    if len(players.keys()) == 2:
        game_state = State.round
        deal()
    await broadcast(json.dumps({"msg_type":"state","payload": {"players": players}}, default=public_encoder))

def calc_round_winner():
    time.sleep(2)
    hands = ((v.hand,k) for k,v in players.items())
    hands = sorted(hands, key=lambda x: x[0], reverse=True)
    #TODO tiebreak
    for _ , v in players.items():
        v.hand = None
    winner = hands[0][1]
    for x in hands:
        players[winner].deck.append(x[0])
    return winner

async def play_card(connection_id, p):
    global game_state
    print(players[connection_id], game_state)
    # do not allow play card if player has hand or diff game state
    if not game_state == State.round or players[connection_id].hand:
        return
    try:
        card = players[connection_id].draw_card()
        print(players[connection_id])
        if card:
            await broadcast(json.dumps({"msg_type":"draw_card","payload": {"card":card, "player":connection_id}}))
            cards = (v.hand for k ,v in players.items())
            if not None in cards:
                winner = calc_round_winner()
                
                await broadcast(json.dumps({"msg_type":"round_win","payload": {"player": winner}}))
                await broadcast(json.dumps({"msg_type":"state","payload": {"players": players}}, default=public_encoder))
        else:
            del players[connection_id]
            await broadcast(json.dumps({"msg_type":"lost", "payload": {"player":connection_id}}))
    #TODO bad try catch
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
        global game_state
        game_state = State.game_end
        time.sleep(3)
        if len(players.keys()) < 2:
            for k,v in players.items():
                v.hand = None
                v.deck = collections.deque()
            game_state = State.waiting

async def play_round(players, connections):
    pass
start_server = serve(handle_connection, "0.0.0.0", 8080)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()