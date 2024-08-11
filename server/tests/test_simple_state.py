import unittest
import json
from simple_state import inc_turn, deal_cards, next_player, play_card, simple_state, NUM_CARDS


class TestSimpleState(unittest.TestCase):
    def test_inc_turn(self):
        self.assertEqual(inc_turn(0, 2), 1)
        self.assertEqual(inc_turn(1, 2), 0)
        self.assertEqual(inc_turn(0, 3), 1)
        self.assertEqual(inc_turn(1, 3), 2)
    
    def test_next_player(self):
        self.assertEqual(next_player((1,2,3), 0, {1:[1], 2:[], 3:[1]}), 2)
        self.assertEqual(next_player((1,2,3), 0, {1:[1], 2:[], 3:[]}), 0)
        self.assertEqual(next_player((1,2,3), 0, {1:[], 2:[], 3:[]}), 0)
    
    def test_play_card(self):
        self.assertEqual(play_card(1, {1:[1], 2:[], 3:[1]}, []), (1,{1:[], 2:[], 3:[1]} ,[1]))
        self.assertEqual(play_card(2, {1:[], 2:[1], 3:[]}, []), (1,{1:[], 2:[], 3:[]} ,[1]))
    
    def test_simple_state_two_players(self):
        demo_state = simple_state()
        #connect the first player
        demo_state.connect(1)
        self.assertEqual(demo_state.order, (1,))
        #test if the game start is correctly not started when only one player is present
        self.assertEqual(demo_state.handle(1, '{"cmd":"start"}'), ([(1, 'state is not correct for {"cmd":"start"}')], None))
        #connect the second player
        demo_state.connect(2)
        self.assertEqual(set(demo_state.order), set((1, 2)))
        #test if start return the proper message
        self.assertEqual(demo_state.handle(1, '{"cmd":"start"}'), ([(1, str(52//2)), (2, str(52//2))], '{"cmd":"start"}'))
        #ensure that all cards have been dealt
        num_cards = len(sum(demo_state.stacks.values(), []))
        self.assertEqual(num_cards, NUM_CARDS)
        self.assertEqual(demo_state.state, "round")
    
        #run the game to completion
        for i in range(NUM_CARDS):
            player = i%2+1
            player_stack_count = len(demo_state.stacks[player])
            messages, broadcast_msg = demo_state.handle(player, '{"cmd":"play"}')
            #check that the pot increases by one and the stacks decrease by one
            self.assertEqual(len(demo_state.pot), i+1)
            num_cards = len(sum(demo_state.stacks.values(), []))
            self.assertEqual(num_cards, NUM_CARDS - i - 1)
            #check that the specific player's stack length decreased by one
            self.assertEqual(len(demo_state.stacks[player]) + 1, player_stack_count)
            #check the return message contents
            self.assertEqual(messages, [])
            broadcast_json = json.loads(broadcast_msg)
            if i < NUM_CARDS-1:
                self.assertEqual(broadcast_json["actor"],player)
            else:
                self.assertEqual(broadcast_json["winner"],player)
        self.assertEqual(demo_state.state, "win") 

    def test_deal_cards(self):
        for i in range(2, 11):
            stacks = deal_cards(tuple(range(i)))
            self.assertEqual(tuple(range(i)), tuple(stacks.keys()))
            number_of_cards = NUM_CARDS//i
            missmatch = NUM_CARDS%i 
            self.assertTrue(len([x for x in stacks.values() if len(x) == number_of_cards]) == i-missmatch, f"{i-missmatch} of {i} players should have {number_of_cards}; {[len(x) for x in stacks.values()]}")
            self.assertTrue(len([x for x in stacks.values() if len(x) == number_of_cards +1]) == missmatch, f"{missmatch} of {i} players should have {number_of_cards+1}; {stacks}" )
