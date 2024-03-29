import random
import json
import collections
import roomserver

#TODO consider changing broadcast to be a cardshark specific operation so that it can access the player data accordingly
#TODO disconnects during game break everything

def cycle(dq):
    p = dq.popleft()
    dq.append(p)
    return p

class player:
    def __init__(self, connection):
        self.connection = connection
        self.stack = collections.deque()
        self.bet_count = 0
        self.hand = None
        self.fold = False
        self.name = "no name"

    def can_bet(self):
        return self.hand and not self.fold and len(self.stack) > 0

    #serializes player to a level that is visible to all players in the game
    def __json__(self):
        return {"can_bet": self.can_bet(), "fold": self.fold, "num_cards": len(self.stack), "name":self.connection.name}

    async def draw_card(self):
        if len(self.stack) > 0:
            self.hand = self.stack.popleft()
        else:
            self.hand = None
        await roomserver.send(self.connection.connection_id, {"msg":"hand", "payload": {"hand":self.hand}})
        return self.hand

    def bet_cards(self, num_cards):
        if len(self.stack) >= num_cards:
            cards = [self.stack.popleft() for _ in range(num_cards)]
            self.bet_count += num_cards
        else:
            cards = self.bet_cards(len(self.stack))
        return cards

    def clean(self):
        self.bet_count = 0
        self.hand = None
        self.fold = False

class table:
    
    def __init__(self, players):
        self.stack = collections.deque()
        self.ante = 1
        self.current_bet = self.ante
        self.players = {p.connection: p for p in players}
        #TODO randomize
        
        self.dealer_queue = collections.deque(self.players.values())
        self.turn_queue = collections.deque(self.dealer_queue)
        cycle(self.turn_queue)
        self.player_turn = self.turn_queue[0]
        self.round_end_player = None
    
    # a level that is visible to all players in the game
    def __json__(self):
        #TODO optimize stack send
        return {"ante": self.ante, "dealer":self.dealer_queue[0], "stack": str(list(self.stack)), "player_turn": self.turn_queue[0]}
    
    def place_cards(self, cards):
        self.stack.append(cards)
        return cards
    
    def next_player(self):
        if p == self.round_end_player:
            return self.end_round()
        p = cycle(self.turn_queue)
        while not p.can_bet():
            if p == self.round_end_player:
                return self.end_round()
            p = cycle(self.turn_queue)
        return None

    def end_round(self):
        #TODO 
        # calculate the winner
        # break any tie
        # distribute out the cards
        return self.dealer_queue[0], [[p,p.hand]for p in self.players.values()]

    async def start_round(self):
        for p in self.players.values():
            p.clean()
        cycle(self.dealer_queue)
        self.turn_queue = collections.deque(self.dealer_queue)
        self.player_turn = cycle(self.turn_queue)
        self.current_bet = self.ante
        for p in self.players.values():
            await p.draw_card()
        #if this is the first player of the rount aka the ante
        if self.round_end_player == None:
            self.round_end_player = self.turn_queue[0]

class cardshark:
    card_set = range(2,15)
    
    def __init__(self, room):
        self.room = room
        self.game_table = table([player(i.name) for i in self.room.connections])
        self.recent_operation={}

    def deal_cards(self):
        cards = [x for x in cardshark.card_set for _ in range(4)]
        random.shuffle(cards)
        while cards:
            for p in self.game_table.players:
                p.deck.append(cards.pop())
                if not cards:
                    break
            
    def start(self):
        self.deal_cards(self.deck, self.game_table)

    def disconnect(self, connection):
        #TODO
        pass

    def player_turn(self):
        return self.game_table.turn_queue[0]
    
    def find_player_hand(self, connection_id):
        return self.game_table.players.get(connection_id, player()).hand
    
    # actions
    # raise #
    # call #
    # check
    # fold
    # slap
    # illegal slap
    # win

    
    def place_bet(self, payload, connection_id):
        if self.player_turn().connection.connection_id == connection_id:
            if payload["num_cards"] == 0 and payload["num_cards"] + self.player_turn().bet_count == self.game_table.current_bet:
                #check
                self.recent_operation = {"player":self.player_turn(), "action": {"type": "check"}}
                return True, self.recent_operation["action"]
            elif payload["num_cards"] + self.player_turn().bet_count == self.game_table.current_bet:
                #call
                num_betting = payload["num_cards"]
                cards = self.player_turn().bet_cards(num_betting)
                self.game_table.place_cards(cards)
                self.recent_operation = {"player":self.player_turn(), "action": {"type": "call", "num": len(cards), "cards": cards}}
                return True, self.recent_operation["action"]
            elif payload["num_cards"] + self.player_turn().bet_count > self.game_table.current_bet:
                #raise
                num_betting = payload["num_cards"]
                cards = self.player_turn().bet_cards(num_betting)
                self.game_table.place_cards(cards)
                self.game_table.current_bet = self.player_turn().bet_count
                self.round_end_player = self.player_turn()
                self.recent_operation = {"player":self.player_turn(), "action": {"type": "raise", "num": len(cards), "cards": cards}}
                return True, self.recent_operation["action"]
            else:
                #insufficient bet amount
                return False, "insufficient bet amount"
        else:
            #not your turn
            return False, "not your turn"
            
    def slap(self, payload, connection_id):
        pass
    def fold(self, payload, connection_id):
        pass

    def get_state(self, payload, connection_id):
        roomserver.send(connection_id, {"msg": "state&hand", "payload":{"state":self, "hand": self.find_player_hand(connection_id)}})

    def __json__(self):
        return {"room": self.room, "game_table": self.game_table, "recent_operation": self.recent_operation}

    function_map = {
        "place_bet": place_bet,
        "slap": slap,
        "fold": fold
    }
    async def handle(self, msg, payload, connection_id):
        if msg in cardshark.function_map.keys():
            result, action= cardshark.function_map[msg](self, payload, connection_id)
            if result:
                if action["type"] in ["raise", "call", "check", "fold"]:
                    winner, players_cards = self.game_table.next_player()
                    await self.room.broadcast({"msg": "state", "payload": self})
                    if result:
                        self.recent_operation = {"player":winner, "action": {"type": "win", "cards": players_cards}}
                        await self.room.broadcast({"msg": "state", "payload": self})
                
            else:
                await roomserver.send(connection_id, {"msg": "error"}, {"payload": {"text": action}})
