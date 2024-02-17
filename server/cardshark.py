import random
import json
import collections

class player:
    def __init__(self, connection):
        self.connection = connection
        self.stack = collections.deque()
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

    def play_cards(self, num_cards):
        cards = [self.stack.popleft() for _ in range(num_cards)]
        return cards

class table:
    
    def __init__(self, players):
        self.stack = collections.deque()
        self.ante = 1
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
        for p in self.players:
            p.draw_card()
        

    def play(self, msg):
        #TODO handle message to place a bet
        pass

class cardshark:

    def __init__(self, room):
        self.room = room
        cards = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']
        self.deck = [i for i in cards for _ in range(4)]
        random.shuffle(self.deck)
        self.game_table = table()
        self.game_table.players = [player(i.name) for i in self.room.connections]
    
    def public_encoder(o):
        return o.__json__()

    def deal_cards(deck, game_table):
        index = 0
        while deck:
            p = game_table.players[index]
            game_table.players[index].stack.append(deck.pop())
            
    def play_round(game_table):
        for p in game_table.players:
            p.draw_card()
        #send
        ante_player = game_table.player_turn
        last_betted = None
        
        play_more = True
        while play_more:
            p = game_table.players[game_table.player_turn]
            #wait for bet

            

            #round end cases

    def start(self):
        self.deal_cards(self.deck, self.game_table)

    def disconnect(self, connection):
        #TODO
        pass

    
