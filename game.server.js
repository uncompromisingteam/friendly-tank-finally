var io;
var gameSocket;
var players = [];
//var bullets = [null, null, null, null];
//var bullets = [ [null, null], [null, null], [null, null], [null, null] ];
var gameStatus = false;
var positions = [
    { posX: 40, posY: 40, course: 'right'},
    { posX: 1040, posY: 40, course: 'left'},
    { posX: 40, posY: 640, course: 'right'},
    { posX: 1040, posY: 640, course: 'left'}
];

var player = require('./models/player');
var bullet = require('./models/bullet');

exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" , gameStatus: gameStatus});

    //host events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);

    //player events
    gameSocket.on('playerJoinGame', playerJoinGame);

    gameSocket.on('playerRun', playerRun);
    gameSocket.on('playerStop', playerStop);
    gameSocket.on('playerFire', playerFire);

    gameSocket.on('bulletRemove', bulletRemove);


    gameSocket.on('deadPlayer', deadPlayer);

    gameSocket.on('disconnect', playerDisconnect);

}


function hostCreateNewGame() {
    //console.log(data);
    var thisGameId = 999;
    this.emit('newGameCreated', { gameId: thisGameId, mySocketId: this.id});
    this.join(thisGameId.toString());
    gameStatus = true;

}


function playerJoinGame(data) {

    var sock = this;
    var room = gameSocket.manager.rooms["/" + data.gameId];
    this.playerName = data.playerName;
    this.gameId = data.gameId;
    if ( players[0] === null ) { players.splice(0, 1); }


    if( room != undefined ){

        data.mySocketId = sock.id;
        sock.join(data.gameId);

        data.posX = positions[players.length].posX;
        data.posY = positions[players.length].posY;
        data.course = positions[players.length].course;
        data.kill = 0;
        data.dead = 0;
        data.reloading = true;
        data.bullets = [null, null];

        var newPlayer = new player(data);

        players.push(newPlayer);

        io.sockets.in(data.gameId).emit('playerJoinedRoom', { player: newPlayer, players: players});

    } else {
        this.emit('error',{message: "This room does not exist."} );
    }
}


function playerStop(data) {
    var runStatus = 'stop';

    players[data.playerNum] = data.player;
    io.sockets.in(this.gameId).emit('playerUpdated', { runStatus: runStatus, player: players[data.playerNum], playerNum: data.playerNum, players: players });
}




function playerDisconnect() {

}















//
