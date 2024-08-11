import random
import json

CARD_VALS = range(1,14)
CARD_SUITS = range(4)
NUM_CARDS = len(CARD_VALS)*len(CARD_SUITS)
CARD_SET = [x for x in CARD_VALS for _ in CARD_SUITS]
    
def deal_cards(order):
    print("dealing")
    cards = list(CARD_SET)
    random.shuffle(cards)
    stacks = {x : [] for x in order} 
    while cards:
        for p in order:
            stacks[p].append(cards.pop())
            if not cards:
                break
    return stacks 

def inc_turn(turn, num_players):
    nturn = turn + 1
    if nturn == num_players:
        nturn = 0
    return nturn

def next_player(order, turn, stacks):
    num_players = len(order)
    next_turn = inc_turn(turn, num_players)
    while len(stacks.get(order[next_turn], [])) == 0 and not turn == next_turn:
        next_turn = inc_turn(next_turn, num_players)
    return next_turn

def play_card(websocket, stacks, pot):
    assert len(stacks[websocket]) > 0
    card = stacks[websocket].pop()
    pot.append(card)
    return card, stacks, pot

def check_valid_message(msg):
    try:
        parsed = json.loads(msg)
        if parsed.get("cmd", None) == None:
            return None
        return parsed
    except:
        return None

def is_valid_slap(pot):
    if len(pot) >=1 and pot[-1] == 13:
        return True
    if len(pot) >= 2 and pot[-1] == pot[-2]:
        return True
    if len(pot) >= 3 and pot[-1] == pot[-3]:
        return True
    return False

class simple_state():
    def __init__(self):
        self.order = ()
        self.names = dict()
        self.stacks = dict()
        self.state = "setup"
        self.pot = []
        self.turn = 0
    
    def __str__(self):
        top_pot = ""
        if len(self.pot) > 0:
           top_pot = self.pot[-1] 
        return str([self.stacks, top_pot, self.state])

    def connect(self, websocket):
        print("adding player: " + str(websocket))
        self.order = self.order + (websocket,)
        print(self.order)

    def start(self):
        self.stacks = deal_cards(self.order)
    
    def disconnect(self, websocket):
        print(["removing player:", websocket])
        if not self.stacks.get(websocket, []) == []:
            self.pot = self.pot + self.stacks[websocket]
        if websocket in self.stacks.keys():
            del self.stacks[websocket] 

    def handle(self, websocket, message):
        parsed = check_valid_message(message)
        if not parsed:
            return (websocket, f"Invalid request rejected by server; {message}"), None
        if parsed["cmd"] == "name":
            pass
        if parsed["cmd"] == "start" and self.state == "setup" and len(self.order) > 1:
            self.start()
            self.state = "round"
            return [(p, str(len(self.stacks[p]))) for p in self.order], '{"cmd":"start"}'
        if parsed["cmd"] == "play" and self.state == "round" and self.order[self.turn] == websocket:
            card, self.stacks, self.pot = play_card(websocket, self.stacks, self.pot)
            next_turn = next_player(self.order, self.turn, self.stacks)
            broadcast_msg = json.dumps({"actor":hash(websocket), "plays":card})
            if next_turn == self.turn:
                self.state = "win"
                #todo check for slap
                broadcast_msg = json.dumps({"winner":hash(websocket)})
                return [], broadcast_msg
            self.turn = next_turn
            return [], broadcast_msg    
        if parsed["cmd"] == "slap" and self.state == "round" and is_valid_slap(self.pot):
            topcard = self.pot[-1]
            pot = list(self.pot)
            pot.reverse()
            # add pot to player
            self.stacks[websocket] = pot + self.stacks[websocket]
            self.pot = []
            self.turn = self.order.index(websocket)
            #todo check if win
            broadcast_msg = json.dumps({"actor":hash(websocket), "wins_pot":"slap"})
            return [], broadcast_msg
        if parsed["cmd"] == "reset" and self.state == "win":
            temp = list(self.order)
            random.shuffle(temp)
            self.order = tuple(temp)
            self.pot = []
            self.turn = 0
            self.stacks = {}
            self.state = "setup"
            return [], json.dumps({"reset": order})
        return [(websocket, f"state is not correct for {message}")], None 

