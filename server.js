var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var Game = require('./farkle').game;
var Player = require('./farkle').player;
var DiceSet = require('./farkle').diceSet;
var gm;
var diceSet;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));

// Let's start managing connections...
io.on('connection', function(socket){

    	// Handle 'message' messages
        socket.on('message', function (message) {
                io.emit('message', message);
        });

        socket.on('roll', function (room) {
                var score_object = gm.calculate_score(gm.current_player, diceSet);
                resetPlayer();
                io.sockets.in(room).emit('round score', gm.current_player.potential_score);
                gm.current_player.remaining_dice = gm.remaining_dice(score_object.scoring_dice, gm.current_player.remaining_dice);

                diceSet = new DiceSet(gm.current_player.remaining_dice);

                if (!gm.possible_score(diceSet.values)) {
                    io.sockets.in(room).emit('farkle', diceSet.values, gm.players);
                    resetPlayer();
                    gm.current_player.potential_score = 0;
                    gm.next_player();
                } 
                else {
                    io.sockets.in(room).emit('rolled', diceSet.values, gm.players);
                }
        });

        socket.on('sendDie', function (value, room) {
                if (gm.current_player.chosen_dice.indexOf(value) == -1)
                    gm.current_player.chosen_dice.push(value);
                var potential_score = gm.calculate_score(gm.current_player, diceSet);
                gm.current_player.round_score = potential_score.total;
                io.sockets.in(room).emit('throw score', gm.current_player.round_score);
        });

        socket.on('bank', function(room) {
                if (gm.current_player.round_score > 0) {
                    resetPlayer();
                    gm.bank();
                    gm.current_player.potential_score = 0;
                    if (gm.current_player.banked_score >= 5000) {
                        io.sockets.in(room).emit('game won', gm.current_player);
                    }
                    else {
                        gm.next_player();
                        io.sockets.in(room).emit('banked', gm.players);
                    }
                }
        });

        // Handle 'create or join' messages
        socket.on('create or join', function (room) {
                var clients = io.sockets.adapter.rooms[room];
                var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;

                log('S --> Room ' + room + ' has ' + numClients + ' client(s)');
                log('S --> Request to create or join room', room);

                // First client joining...
                if (numClients == 0){
                        socket.join(room);
                        gm = new Game();
                        diceSet = gm.diceSet;
                        gm.addPlayer(new Player("Player 1", true));
                        socket.emit('created', room);
                } else if (numClients == 1) {
                // Second client joining...                	
                        io.sockets.in(room).emit('join', room);
                        gm.addPlayer(new Player("Player 2", false));
                        socket.join(room);
                        socket.emit('joined', room);
                } else { // max two clients
                        socket.emit('full', room);
                }
        });       
        
        function log(){
                var array = [">>> "];
                for (var i = 0; i < arguments.length; i++) {
                	array.push(arguments[i]);
                }
                socket.emit('log', array);
        }

        function resetPlayer() {
                gm.current_player.potential_score += gm.current_player.round_score;
                gm.current_player.round_score = 0;
                gm.current_player.chosen_dice = [];             
        }

        function disconnect() {
                log("disconnecting");
                socket.disconnect();
        }
        
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});
