var io;
var gameSocket;
var players = {};
var games = [];
/*games[0] = {
    gameName:'friendly game',
    tracking: '01:32h',
    players: 5,
    meatRating: 'Low',
    password: 'FREE'
}*/
var gameStatus = false;
var positions = [
    { posX: 50, posY: 50, course: 'right'},
    { posX: 1900, posY: 50, course: 'left'},
    { posX: 50, posY: 1500, course: 'right'},
    { posX: 1900, posY: 1500, course: 'left'}
];

var player = require('./models/player');
var bullet = require('./models/bullet');

exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" , gameStatus: gameStatus});

    //host events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostBuildGame', hostBuildGame);

    gameSocket.on('getGames', getGames);

    gameSocket.on('playerJoinGame', playerJoinGame);

    //gameSocket.on('disconnect', playerDisconnect);

    //player events
    //gameSocket.on('playerJoinGame', playerJoinGame);

    /*gameSocket.on('playerRun', playerRun);
    gameSocket.on('playerStop', playerStop);
    gameSocket.on('playerFire', playerFire);

    gameSocket.on('bulletRemove', bulletRemove);


    gameSocket.on('deadPlayer', deadPlayer);

    gameSocket.on('disconnect', playerDisconnect);*/

}


function hostCreateNewGame() {

    var thisGameId = ( Math.random()*10000 ) | 0;
    // var game = {};
    // game.
    // games.push(thisGameId);
    this.emit('newGameCreated', { gameId: thisGameId, mySocketId: this.id});
    this.join(thisGameId.toString());
}

function hostBuildGame(data) {

    var gamesNum = games.length;

    games.push({
        gameName: data.gameName,
        tracking: [0,0],
        players: 1,
        meatRating: 'hard',
        password: data.password,
        passwordStatus: (data.password === '') ? 'FREE' : 'PASS',
        gameId: data.gameId,
        hostSocketId: data.hostSocketId
    });

    var newPlayer = {};
    newPlayer.playerName = data.playerName;
    newPlayer.posX = positions[0].posX;
    newPlayer.posY = positions[0].posY;
    newPlayer.course = positions[0].course;
    newPlayer.kill = 0;
    newPlayer.dead = 0;
    newPlayer.reloading = true;
    newPlayer.bullets = [null, null];
    newPlayer.mySocketId = data.hostSocketId;

    players[data.gameId] = [];
    players[data.gameId].push(newPlayer);

    io.sockets.in(this.gameId).emit('buildedGame', { game: games[gamesNum], player: newPlayer, playerActive: 0, players: players[data.gameId] });

    (function incTracking(){
        var timeout = setInterval(function(){
            if (!games[gamesNum]) { clearInterval(timeout); }
            games[gamesNum].tracking[1] +=1;
            if (games[gamesNum].tracking[1] === 60) { games[gamesNum].tracking[1] = 0;
                games[gamesNum].tracking[0] +=1;
            }
        }, 60000);
    })();
}



function getGames() {
    this.emit('gameList', { gameList: games});
}



function playerJoinGame(data) {
    var gameNum = getGameIdNum(data.gameId);
    var passCheck;
    var newPlayer = {};

    if ( data.password === games[gameNum].password ) {
        passCheck = true;

        newPlayer.playerName = data.playerName;
        newPlayer.posX = positions[players[data.gameId].length].posX;
        newPlayer.posY = positions[players[data.gameId].length].posY;
        newPlayer.course = positions[players[data.gameId].length].course;
        newPlayer.kill = 0;
        newPlayer.dead = 0;
        newPlayer.reloading = true;
        newPlayer.bullets = [null, null];
        newPlayer.mySocketId = data.mySocketId;
        players[data.gameId].push( newPlayer );


    } else { passCheck = false; }

    io.sockets.emit('playerJoinedGame', { passCheck: passCheck, player: newPlayer, playerActive: players[data.gameId].length-1, players: players[data.gameId] });

}



function playerDisconnect() {


    /*for (var i = 0, l = games.length; i < l; i++) {
        (function(e){
            if ( this.mySocketId === games[e].hostSocketId ) {
                games.splice(e, 1);
                io.sockets.in(this.gameId).emit('removeGame');
            }
        })(i);
    }*/

    var numDisconnectPlayer;

    console.log(gameId);


    /*for (var i = 0, l = players.length; i < l; i++) {
        if ( players[i].playerName === this.playerName) { numDisconnectPlayer = i; }
    }

    if ( players.length === 1 ) { gameStatus = false; }

    players.splice(numDisconnectPlayer, 1);

    if ( players.length > 0 && numDisconnectPlayer != players.length) {

        (function refreshPosition(){
            var stek = positions[numDisconnectPlayer];
            positions[numDisconnectPlayer] = positions[players.length];
            positions[players.length] = stek;
        })();


    }


    io.sockets.in(this.gameId).emit('refreshAfterDisconnect', {players: players, playerName: this.playerName});*/

}




function getGameIdNum(gameId) {
    var gameIdIndex = 0;
    for (var i = 0, l = games.length; i < l; i++) {
        (function(e){
            if ( games[e].gameId === gameId ) {
                gameIdIndex = e;
            }
        })(i);
    }

    return gameIdIndex;
}


















//
