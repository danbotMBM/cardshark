import random
import json
import collections
import roomserver

class player:
    def __init__(self, connection):
        self.connection = connection
        self.stack = collections.deque()
        self.bet_count = 0
        self.hand = None
        self.fold = False
        self.name = "no name"

    def can_bet(self):
        return self.hand and not self.fold

    #serializes player to a level that is visible to all players in the game
    def __json__(self):
        return {"can_bet": self.can_bet(), "fold": self.fold, "num_cards": len(self.stack), "name":self.connection.name}

    def draw_card(self):
        if len(self.stack) > 0:
            self.hand = self.stack.popleft()
        else:
            self.hand = None
        return self.hand

    def bet_cards(self, num_cards):
        cards = [self.stack.popleft() for _ in range(num_cards)]
        self.bet_count += num_cards
        return cards

class table:
    
    def __init__(self, players):
        self.stack = collections.deque()
        self.ante = 1
        self.current_bet = self.ante
        self.players = players
        #TODO randomize
        
        self.dealer_queue = collections.deque(self.players)
        self.turn_queue = collections.deque(self.dealer_queue)
        table.next_player(self.turn_queue)
        self.round_end_player = None
    
    # a level that is visible to all players in the game
    def __json__(self):
        #TODO optimize stack send
        return {"ante": self.ante, "dealer":self.dealer_queue[0], "stack": str(list(self.stack)), "turn_order": str(list(self.turn_queue))}
    
    def place_cards(self, cards):
        self.stack.append(cards)
        return {"played": cards}
    
    def next_player(dq):
        p = dq.popleft()
        dq.append(p)

    def next_round(self):
        table.next_player(self.dealer_queue)
        self.turn_queue = collections.deque(self.dealer_queue)
        table.next_player(self.turn_queue)
        self.current_bet = self.ante
        for p in self.players:
            p.draw_card()
        

    def play(self, msg):
        #TODO handle message to place a bet
        pass

class cardshark:
    card_set = range(2,15)
    def __init__(self, room):
        self.room = room
        self.game_table = table([player(i.name) for i in self.room.connections])
    
    def public_encoder(o):
        return o.__json__()

    def deal_cards(self):
        cards = [x for x in cardshark.card_set for _ in range(4)]
        random.shuffle(cards)
        while cards:
            for p in self.game_table.players:
                p.deck.append(cards.pop())
                if not cards:
                    break
            
    def play_round(game_table):
        pass

    def start(self):
        self.deal_cards(self.deck, self.game_table)

    def disconnect(self, connection):
        #TODO
        pass

    def player_turn(self):
        return self.game_table.turn_queue[0]
    
    def place_bet(self, payload, connection_id):
        if self.player_turn().connection.connection_id == connection_id:
            if payload["num_cards"] == 0 and payload["num_cards"] + self.player_turn().bet_count() == self.game_table.current_bet:
                #check
                pass
            elif payload["num_cards"] + self.player_turn().bet_count() == self.game_table.current_bet:
                #call
                payload["num_cards"] + self.player_turn().bet_count() == self.game_table.current_bet
            elif payload["num_cards"] + self.player_turn().bet_count() > self.game_table.current_bet:
                #raise
                payload["num_cards"] + self.player_turn().bet_count() == self.game_table.current_bet
            else:
                #insufficient bet amount
                pass
        else:
            #not your turn
            
            self.player_turn().bet_cards(payload["num_cards"])
    def slap(self, payload, connection_id):
        pass
    def fold(self, payload, connection_id):
        pass

    function_map = {
        "place_bet": place_bet,
        "slap": slap,
        "fold": fold
    }
    def handle(self, msg, payload, connection_id):
        if msg in cardshark.function_map.keys():
            cardshark.function_map[msg](self, payload, connection_id)
