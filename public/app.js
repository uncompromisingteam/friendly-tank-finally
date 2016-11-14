;jQuery(function($) {
    'use strict';

    window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              window.oRequestAnimationFrame      ||
              window.msRequestAnimationFrame     ||
              function(callback,  element){
                window.setTimeout(callback, 1000 / 60);
              };
    })();

    var IO = {

        init: function() {
            IO.socket = io.connect();
            IO.bindEvents();
        },

        bindEvents: function() {
            IO.socket.on('connected', IO.onConnected);
            IO.socket.on('newGameCreated', IO.onNewGameCreated);
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom);

            IO.socket.on('playerUpdated', IO.playerUpdated);
            IO.socket.on('playerFired', IO.playerFired);

            //IO.socket.on('refreshAfterDead', IO.refreshAfterDead);

            IO.socket.on('refreshAfterDisconnect', IO.refreshAfterDisconnect);
            IO.socket.on('refreshBullets', IO.refreshBullets);
        },

        onConnected: function(data) {
            App.mySocketId = IO.socket.socket.sessionid;
            App.gameStatus = data.gameStatus;
        },

        onNewGameCreated: function(data) {
            App.Host.gameInit(data);
        },

        playerJoinedRoom: function(data){
            if (App.Player.myName === data.player.playerName) {
                App.Player.updateWaitingScreen(data);
            } else {
                //App.Player.players = data.players.slice();

                App.Player.createPlayers(data.player, undefined, data.players);
                //App.Player.playerRefresh(data.player);
            }

        },

        playerUpdated: function(data){
            //App.Player.gameWorld(data);
            App.Player.players = data.players.slice();

            App.Player.playerRefresh(data);

        },

        playerFired: function(data){
            // data.players[data.playerNum].bullets[data.bulletNum]
            App.Player.players = data.players.slice();

            App.Player.fire().showAllBullets(data.players[data.playerNum].bullets[data.bulletNum], data.playerNum, data.bulletNum);

        },

        refreshBullets: function(data){
            App.Player.players = data.players.slice();
        },

        /*refreshAfterDead: function(data){
            App.Player.players = data.players.slice();
        },*/

        refreshAfterDisconnect: function(data){
            App.Player.removePlayer(data);
        }



    };

    var App = {

        gameId: 0,
        myRole: '',
        gameStatus: null,
        mySocketId: '',
        levelPlan : [
          "wwwwwwwwwwwwwwwwwwwwwwwwwwww",   // (1)
          "w           wwww           w",   // (2)
          "w www wwwww      wwwww www w",   // (3)
          "w www wwwwwwwwwwwwwwww www w",   // (4)
          "w www wwwwwwwwwwwwwwww www w",   // (5)
          "w                          w",   // (6)
          "w wwwwwwwwwwwwwwwwwwwwwwww w",   // (7)
          "w wwwwwwwwwwwwwwwwwwwwwwww w",   // (8)
          "w wwwwwwwwwwwwwwwwwwwwwwww w",   // (9)
          "w wwwwwwwwwwwwwwwwwwwwwwww w",   // (9)
          "w wwwwwwwwwwwwwwwwwwwwwwww w",   // (9)
          "w wwwwwwwwwwwwwwwwwwwwwwww w",   // (10)
          "w                          w",   // (11)
          "w www wwwwwwwwwwwwwwww www w",   // (12)
          "w www wwwwwwwwwwwwwwww www w",   // (13)
          "w www wwwww      wwwww www w",   // (14)
          "w           wwww           w",   // (15)
          "wwwwwwwwwwwwwwwwwwwwwwwwwwww",   // (16)
        ],

        init: function() {
            App.cacheElements();
            App.cacheProperty();
            App.showInitScreen();
            App.bindEvents();

            FastClick.attach(document.body);
        },

        cacheElements: function() {
            App.$doc = $(document);

            // Templates
            App.$gameArea = $('#gameArea');
            App.$gameFieldArea = $('#gameFieldArea');
            App.$templateHelloScreen = $('#hello-screen-template').html();
            App.$templateNewGame = $('#create-game-template').html();
            App.$templateJoinGame = $('#join-game-template').html();
            App.$gameFieldTemplate = $('#game-field-template').html();

            var bodyWidth = document.body.clientWidth;
            var bodyHeight = document.body.clientHeight;
            var percent = bodyHeight/bodyWidth*100;
        },

        cacheProperty: function() {

            App.$bodyWidth = document.body.clientWidth;
            App.$bodyHeight = document.body.clientHeight;

            App.Player.$courseLeft = 'url(img/tankLeft.png)';
            App.Player.$courseRight = 'url(img/tankRight.png)';
            App.Player.$courseTop = 'url(img/tankTop.png)';
            App.Player.$courseBottom = 'url(img/tankBottom.png)';

            App.$initSize = 40;
        },

        bindEvents: function() {

            App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);

            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '#btnStart', App.Player.onPlayerStartClick);

            App.$doc.on('keydown', App.Player.runPlayerEvent );

        },

        showInitScreen: function() {
            App.$gameArea.html(App.$templateHelloScreen);
            App.doTextFit('.title');
        },

        Host: {

            players: [],
            isNewGame: false,
            numPlayersInRoom: 0,

            onCreateClick: function() {
                // App.myRole = 'Host';
                if (App.gameStatus === false) {
                    IO.socket.emit('hostCreateNewGame');
                }
            },

            gameInit: function(data){
                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                //App.myRole = 'Host';
                App.Host.numPlayersInRoom = 1;

                App.Host.displayNewGameScreen();
            },

            displayNewGameScreen: function() {

                App.$gameArea.html( App.$templateJoinGame );

            }

        },


        /* *****************************
         *        PLAYER CODE        *
         ***************************** */

        Player: {
            hostSocketId: '',
            myName: '',
            players: [],
            playerSize: 40,
            speedBullet: 400,
            speedPlayer: 200,
            playerActive: 0,
            canRun: true,
            refreshAnimateFrameID: [],

            onJoinClick: function() {
                if (App.gameStatus === true) {
                    App.$gameArea.html(App.$templateJoinGame);
                }
            },

            onPlayerStartClick: function() {

                var data = {
                    gameId: +($('#inputGameId').val()),
                    playerName: $('#inputPlayerName').val() || 'anon',
                };

                App.Player.myName = data.playerName;

                IO.socket.emit('playerJoinGame', data);

                //App.Player.players.push(data);

            },

            updateWaitingScreen: function(data) {
                //console.log(data[0]);

                if (IO.socket.socket.sessionid === data.player.mySocketId) {
                    App.myRole = 'Player';
                    App.gameId = data.player.gameId;
                    App.Player.players = data.players.slice();
                    App.Player.gameWorld(data.players);

                }
            },

            gameWorld: function(players) {

                App.$gameArea.html( App.$gameFieldTemplate );
                App.Player.drawingLevel();

            },

            drawingLevel: function() {




            },

            createPlayers: function(player, i, players) {

            }


        },

        doTextFit: function(el) {
            textFit(
                $(el)[0], {
                    alignHoriz: true,
                    alignVert: false,
                    widthOnly: true,
                    reProcess: true,
                    maxFontSize: 300
                }
            );
        }

    };

    IO.init();
    App.init();

    // $('#gameArea').html( $('#hello-screen-template').html() );

}($));
