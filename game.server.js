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

    gameSocket.on('disconnect', playerDisconnect);

}


function hostCreateNewGame() {

    var thisGameId = ( Math.random()*10000 ) | 0;
    this.emit('newGameCreated', { gameId: thisGameId, mySocketId: this.id});
    this.join(thisGameId.toString());
}

                                                // HOST
function hostBuildGame(data) {

    this.playerSocketId = data.mySocketId;
    this.gameId = data.gameId;
    this.myNum = 0;

    var newGame = {};
    newGame.gameName = data.gameName;
    newGame.tracking = [0,0];
    newGame.players = 1;
    newGame.meatRating = 'hard';
    newGame.password = data.password;
    newGame.passwordStatus = (data.password === '') ? 'FREE' : 'PASS';
    newGame.gameId = data.gameId;
    newGame.hostSocketId = data.hostSocketId;

    games[this.gameId] = {};
    games[this.gameId] = newGame;


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
    //console.log(newPlayer.mySocketId);

    players[this.gameId] = [];
    //players[data.gameId].push(newPlayer);
    players[this.gameId][0] = newPlayer;

    io.sockets.in(this.gameId).emit('buildedGame', { game: newGame, player: newPlayer, playerActive: 0, players: players[this.gameId] });
    incTracking();

    function incTracking(){
        var timeout = setInterval(function(){
            if (games[data.gameId] === undefined) { clearInterval(timeout); }
            else {
                games[data.gameId].tracking[1] +=1;
                if (games[data.gameId].tracking[1] === 60) { games[data.gameId].tracking[1] = 0;
                    games[data.gameId].tracking[0] +=1;

                }
                incTracking();
            }
        }, 60000);
    }
}



function getGames() {
    this.emit('gameList', { gameList: games});
}


                                                    // PLAYER
function playerJoinGame(data) {
    //var gameNum = getGameIdNum(data.gameId);
    var sock = this;
    var room = gameSocket.manager.rooms["/" + data.gameId];
    this.playerSocketId = data.mySocketId;
    this.gameId = data.gameId;


    var passCheck;
    var newPlayer = {};
    var empty;

    if( room != undefined ){

        if ( data.password === games[this.gameId].password ) {
            passCheck = true;

            for (var i = 0; i < 4; i++) {
                if ( players[this.gameId][i] === undefined && empty === undefined ) {
                    empty = i;
                }
            }
            console.log(empty);

            if (!this.myNum) { this.myNum = empty; }

            data.mySocketId = sock.id;
            sock.join(data.gameId);

            games[data.gameId].players +=1;

            newPlayer.playerName = data.playerName;
            newPlayer.posX = positions[empty].posX;
            newPlayer.posY = positions[empty].posY;
            newPlayer.course = positions[empty].course;
            newPlayer.kill = 0;
            newPlayer.dead = 0;
            newPlayer.reloading = true;
            newPlayer.bullets = [null, null];
            newPlayer.mySocketId = data.mySocketId;
            players[this.gameId][empty] = newPlayer;

            // players[data.gameId].push( newPlayer );

        } else { passCheck = false; }

        io.sockets.in(this.gameId).emit('playerJoinedGame', { passCheck: passCheck,
                                                              player: newPlayer,
                                                              playerActive: empty,
                                                              players: players[this.gameId],
                                                              //gameId: data.gameId,
                                                              hostSocketId: games[data.gameId].hostSocketId
                                                          });
    } else {
        this.emit('error',{message: "This room does not exist."} );
    }

}

function playerRun(data) {
    // console.log( players[data.gameId] );
    // console.log( data.playerNum );
    players[this.gameId][data.playerNum].course = data.player.course;
    io.sockets.in(this.gameId).emit('playerRuned', { player: players[this.gameId][data.playerNum], playerNum: data.playerNum, players: players[this.gameId] });
}

function playerStop(data) {
    players[this.gameId][data.playerNum].posX = data.player.posX;
    players[this.gameId][data.playerNum].posY = data.player.posY;
    io.sockets.in(this.gameId).emit('playerStoped', { player: players[this.gameId][data.playerNum], playerNum: data.playerNum, players: players[this.gameId] });
}






function playerDisconnect(data) {

    if ( this.gameId !== undefined ) {
        // console.log(this.gameId);

        games[this.gameId].players -=1;

        players[this.gameId][this.myNum] = undefined;

        if ( games[this.gameId].players === 0 ) {

            io.sockets.in(this.gameId).emit('refreshGameAfterDisconnect');
            delete games[this.gameId];
            delete players[this.gameId];
        } else {
            io.sockets.in(this.gameId).emit('refreshPlayerAfterDisconnect', { playerNum: this.myNum, players: players[this.gameId]});

            /*if ( this.myNum !== players.length ) {

                var numNew = players[this.gameId].length;
                var newOld = this.myNum;

                (function refreshPosition(){
                    var stek = positions[newOld];
                    positions[newOld] = positions[numNew];
                    positions[numNew] = stek;
                })();

            }*/
            //console.log(players[data.gameId]);
        }



    }

}

function regularUpdateCoordination(data) {
    players[this.gameId] = data.players.slice();
    io.sockets.in(this.gameId).emit('regularUpdatedCoordination', { players: players[this.gameId] });
}

// ----------------------------------------------------------------------------------------------------------- //

/*function getGameIdNum(gameId) {
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

function regularUpdateCoordination(data) {
    players = data.players.slice();
}*/


















//
