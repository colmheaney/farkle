"use strict";

exports.game = Game;
exports.player = Player;
exports.diceSet = DiceSet;

function Game() {
  this.diceSet = new DiceSet(6);
  this.players = [];
  this.current_player;
};

Object.defineProperty(Game.prototype, "current_player", {
  get: function() { 
    var players = this.players.filter(function(player) {
      return player.active;
    });
    return players[0];
  }
});

Game.prototype.calculate_score = function(player, diceSet) {
  return score(groupBy(chosen_dice(diceSet.values, player.chosen_dice)));
};

Game.prototype.remaining_dice = function (scoring_dice, remaining_dice) {
  remaining_dice = remaining_dice - scoring_dice;
  if (remaining_dice == 0) remaining_dice = 6;
  return remaining_dice;
};

function score(dice) {
  var ob = { total: 0, scoring_dice: 0 };
  for (var die in dice) {
    if (dice[die].length >= 3) {
      switch (die) {
        case '1':
          ob.total += 1000; 
          dice[die] = dice[die].slice(3); break;
        case '2':
          ob.total += 200; break;
        case '3':
          ob.total += 300; break;
        case '4':
          ob.total += 400; break;
        case '5':
          ob.total += 500;
          dice[die] = dice[die].slice(3); break;
        case '6':
          ob.total += 600; break;
      }
    ob.scoring_dice += 3;
    } 
    // TODO handle 6 1's or 6 2's
    if (die == '1') {
      ob.total += dice[die].length * 100; 
      ob.scoring_dice += dice[die].length;
    }
    if (die == '5') {
      ob.total += dice[die].length * 50;
      ob.scoring_dice += dice[die].length;
    }
  }
  return ob;
}

Game.prototype.possible_score = function(dice) {
  var dice = groupBy(dice);

  if ('1' in dice || '5' in dice) return true;

  for (var die in dice)
    if (dice[die].length >= 3) return true

  return false;
}

function chosen_dice(dice, indices) {
  return indices.map(function(index) {
    return dice[index];
  });
}

function groupBy(array) {
  var grouped = {};
  array.forEach(function(element, index) {
    if (element in grouped)
      grouped[element].push(index);
    else
      grouped[element] = [index];
  });
  return grouped;
}

Game.prototype.next_player = function() {
  var current_player_index = this.players.indexOf(this.current_player);
  var next_player = this.players[(current_player_index + 1) % this.players.length]
  this.current_player.remaining_dice = 6;
  this.current_player.active = false;
  next_player.active = true;
}

Game.prototype.addPlayer = function(player) {
  this.players.push(player);
};

Game.prototype.bank = function() {
  this.current_player.banked_score += this.current_player.potential_score;
};

function Player(name, active) {
  this.active = active;
  this.name = name;
  this.banked_score = 0;
  this.potential_score = 0;
  this.round_score = 0;
  this.chosen_dice = [];
  this.remaining_dice = 6;
};

function DiceSet(num_dice) {
  this.values = roll(num_dice);
};

function roll(num_dice) {
  var result = [];
  for (var i = 0; i < num_dice; i++) {
    result.push(Math.ceil(Math.random() * 10) % 6 + 1);
  };
  return result;
}
