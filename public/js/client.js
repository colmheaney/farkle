'use strict';

// Clean-up function:
// collect garbage before unloading browser's window
window.onbeforeunload = function(e){
	hangup();
}

var rollButton = document.getElementById("rollButton");
var bankButton = document.getElementById("bankButton");
var diceList   = document.getElementById('diceList');
var isActive  = false;
var gameReady = false;

// Handler associated with 'Send' button
rollButton.onclick = roll;
bankButton.onclick = bank;

rollButton.disabled = true;
bankButton.disabled = true;

// Let's get started: prompt user for input (room name)
// var room = prompt('Enter room name:');
var room = "foo";

// Connect to signalling server
// var socket = io.connect("http://localhost:8181");
var socket = io();

// Send 'Create or join' message to singnalling server
if (room !== '') {
  console.log('Create or join room', room);
  socket.emit('create or join', room);
}


// Handle 'created' message coming back from server:
// this peer is the initiator
socket.on('created', function (room){
  console.log('Created room ' + room);
});

// Handle 'full' message coming back from server:
// this peer arrived too late :-(
socket.on('full', function (room){
  console.log('Room ' + room + ' is full');
});

// Handle 'join' message coming back from server:
// another peer is joining the channel
socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  gameReady = true;
  isActive  = true;
  enableButtons();
});

// Handle 'joined' message coming back from server:
// this is the second peer joining the channel
socket.on('joined', function (room){
  console.log('This peer has joined room ' + room);
  isActive = false;
  gameReady = true;
  enableButtons();
});

// Server-sent log message...
socket.on('log', function (array){
  console.log.apply(console, array);
});

// Receive message from the other peer via the signalling server 
socket.on('message', function (message){
  console.log('Received message:', message);
  if (message === 'bye') {
    handleRemoteHangup();
  }
});

socket.on('rolled', function (dice, players) {
  display_dice(dice);
});

socket.on('score', function(potential_score, current_player) {

});

socket.on('farkle', function(dice, players) {
  console.log('You farkled! Unlucky....');
  display_dice(dice);
  setTimeout(function() {
    changePlayer();
  }, 2000);
});

socket.on('banked', function(players) {
  changePlayer();
  console.log("Current Player 1 banked_score: ", players[0].banked_score);
  console.log("Current Player 2 banked_score: ", players[1].banked_score);
});

socket.on('game won', function(player) {
  console.log(player.name, "wins!");
  rollButton.disabled = true;
  bankButton.disabled = true;  
});

function display_dice(dice) {
  var ul = $("#diceList");
  $("#diceList li").remove();
  $.each(dice, function(index, value) {
    ul.append("<li class='die' value=" + index +">" + value + "</li>");
  });
}

$('#diceList').on('click', '.die', function() {
    sendDie($(this).attr("value"));
})

// 2. Client-->Server
////////////////////////////////////////////////
// Send message to the other peer via the signalling server
function sendMessage(message){
  socket.emit('message', message);
}
///////////////////////////////////////////////////

function sendDie(value) {
  if (isActive)
    socket.emit('sendDie', value);
}

// Data channel management
function roll() {
  socket.emit('roll', room);
}

function bank() {
  socket.emit('bank', room);
}

function enableButtons() {
  if (gameReady && isActive)
    toggleButtons();
}

function toggleButtons() {
  rollButton.disabled = !rollButton.disabled;
  bankButton.disabled = !bankButton.disabled;
}

function disableButtons() {
  rollButton.disabled = true;
  bankButton.disabled = true;  
}

function changePlayer() {
 isActive = !isActive;
 toggleButtons();
 $('#diceList li').remove(); 
}

/////////////////////////////////////////////////////////
// Clean-up functions...

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  sendButton.disabled=true;
}

///////////////////////////////////////////