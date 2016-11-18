var io;
var gameSocket;
var players = {};
var games = {};
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

    //join events
    gameSocket.on('getGames', getGames);
    gameSocket.on('playerJoinGame', playerJoinGame);

    //player events
    gameSocket.on('playerRun', playerRun);
    gameSocket.on('playerStop', playerStop);
    gameSocket.on('regularUpdateCoordination', regularUpdateCoordination);

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

    //var gamesNum = games.length;


    var newGame = {};
    newGame.gameName = data.gameName;
    newGame.tracking = [0,0];
    newGame.players = 1;
    newGame.meatRating = 'hard';
    newGame.password = data.password;
    newGame.passwordStatus = (data.password === '') ? 'FREE' : 'PASS';
    newGame.gameId = data.gameId;
    newGame.hostSocketId = data.hostSocketId;

    games[data.gameId] = {};
    games[data.gameId] = newGame;


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

    io.sockets.in(this.gameId).emit('buildedGame', { game: games[data.gameId], player: newPlayer, playerActive: 0, players: players[data.gameId] });

    (function incTracking(){
        var timeout = setInterval(function(){
            if (!games[data.gameId]) { clearInterval(timeout); }
            games[data.gameId].tracking[1] +=1;
            if (games[data.gameId].tracking[1] === 60) { games[data.gameId].tracking[1] = 0;
                games[data.gameId].tracking[0] +=1;
            }
        }, 60000);
    })();
}



function getGames() {
    this.emit('gameList', { gameList: games});
}



function playerJoinGame(data) {
    //var gameNum = getGameIdNum(data.gameId);
    var passCheck;
    var newPlayer = {};

    if ( data.password === games[data.gameId].password ) {
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

    io.sockets.in(this.gameId).emit('playerJoinedGame', { passCheck: passCheck, player: newPlayer, playerActive: players[data.gameId].length-1, players: players[data.gameId], gameId: data.gameId });

}

function playerRun(data) {
    // console.log( players[data.gameId] );
    players[data.gameId][data.playerNum].course = data.player.course;
    io.sockets.in(this.gameId).emit('playerRuned', { player: players[data.gameId][data.playerNum], playerNum: data.playerNum, players: players[data.gameId] });
}

function playerStop(data) {
    players[data.gameId][data.playerNum].posX = data.player.posX;
    players[data.gameId][data.playerNum].posY = data.player.posY;
    io.sockets.in(this.gameId).emit('playerStoped', { player: players[data.gameId][data.playerNum], playerNum: data.playerNum, players: players[data.gameId] });
}



function regularUpdateCoordination(data) {
    players = data.players.slice();
}


function playerDisconnect() {
    console.log( this.mySocketId );
}




function getGameIdNum(gameId) {
    var gameIdIndex;
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
