;jQuery(function($) {
    'use strict';

    window.requestAnimationFrame = (function(){
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

            IO.socket.on('gameList', IO.gameList);

            IO.socket.on('playerJoinedGame', IO.playerJoinedGame);

            IO.socket.on('playerRuned', IO.playerRuned);
            IO.socket.on('playerStoped', IO.playerStoped);

            IO.socket.on('regularUpdatedCoordination', IO.regularUpdatedCoordination);

            IO.socket.on('refreshPlayerAfterDisconnect', IO.refreshPlayerAfterDisconnect);
            IO.socket.on('refreshGameAfterDisconnect', IO.refreshGameAfterDisconnect);

            IO.socket.on('buildedGame', IO.buildedGame);
        },

        onConnected: function(data) {
            App.mySocketId = IO.socket.socket.sessionid;
            //App.gameStatus = data.gameStatus;
        },

        onNewGameCreated: function(data) {
            console.log("create");
            App.Host.gameInit(data);
        },

        gameList: function(data) {
            App.Host.showGamesList(data);
        },

        buildedGame: function(data) {

            App.Player.players = data.players.slice();
            App.Player.playerActive = data.playerActive;

            App.$gameArea.html( App.$gameFieldTemplate );
            App.drawingLevel();

            App.Player.createPlayer( App.Player.players[data.playerActive] );

            App.Player.createStatisticPlayer({ num: data.playerActive,
                                                playerName: App.Player.players[data.playerActive].playerName,
                                                kill: App.Player.players[data.playerActive].kill,
                                                dead: App.Player.players[data.playerActive].dead
                                            });

            //App.Player.regularUpdateCoordination().update();
        },

        playerJoinedGame: function(data){


            if ( data.passCheck === false ) {
                $("#inputPassword").val('') ;
                $("#passStatus").html('Password FALSE');
            } else {
                $("#passStatus").html('');
                App.Player.players = data.players.slice();
                if ( App.Player.playerActive === null ) { App.Player.playerActive = data.playerActive; }
                App.controlGame(data);
                console.log('joined');
            }

        },

        playerRuned: function(data){
            //App.Player.players = data.players.slice();
            App.Player.players[data.playerNum] = data.player;
            App.Player.refreshAfterRun(data).run();
        },

        playerStoped: function(data) {
            App.Player.refreshAfterRun(data).stop();
            //App.Player.players = data.players.slice();
            //App.Player.players[data.playerNum] = data.player;
            // App.Player.canRun[data.playerNum] = true;
            //App.Player.canRun = true;
        },

        regularUpdatedCoordination: function(data) {
            App.Player.players = data.players.slice();
            //App.Player.refreshPlayerAfterRegularUpdate();
        },

        refreshPlayerAfterDisconnect: function(data) {

            var mySocketId = App.Player.players[data.playerNum].mySocketId;
            //App.Player.players = data.players.slice();
            App.Player.playerDisconnect(mySocketId);
            //App.Player.playerActive -=1;
        },

        refreshGameAfterDisconnect: function(){
            App.Player.gameDisconnect();
            App.showInitScreen();
        }


    };

    var App = {

        gameId: 0,
        myRole: '',
        gameStatus: null,
        mySocketId: '',
        arrowCodes: {
            37: 'left',
            38: 'top',
            39: 'right',
            40: 'bottom',
            27: 'esc'
        },
        levelPlan : [
          "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww",   // (1)
          "w                 wwww                 w",   // (2)
          "w www wwwwwwwwwww      wwwwwwwwwww www w",   // (3)
          "w www wwwwwwwwwwwwwwwwwwwwwwwwwwww www w",   // (4)
          "w www wwwwwwwwwwwwwwwwwwwwwwwwwwww www w",   // (5)
          "w                                      w",   // (6)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (7)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (8)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (9)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (10)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (11)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (12)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (13)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (14)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (15)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (16)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (17)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (18)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (19)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (20)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (21)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (22)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (23)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (24)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (25)
          "w wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww w",   // (26)
          "w                                      w",   // (27)
          "w www wwwwwwwwwwwwwwwwwwwwwwwwwwww www w",   // (28)
          "w www wwwwwwwwwwwwwwwwwwwwwwwwwwww www w",   // (29)
          "w www wwwwwwwwwww      wwwwwwwwwww www w",   // (30)
          "w                 wwww                 w",   // (31)
          "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww",   // (32)
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
            App.$templateCreateGame = $('#create-game-template').html();
            App.$templateCreateGameMenu = $('#create-game-menu-template').html();
            App.$templateJoinGame = $('#join-game-template').html();

            App.$templateJoinSelectGame = $('#join-select-game-template').html();

            App.$templateJoinGameMenu = $('#join-game-menu-template').html();
            App.$gameFieldTemplate = $('#game-field-template').html();

        },

        cacheProperty: function() {

            App.$bodyWidth = document.body.clientWidth;
            App.$bodyHeight = document.body.clientHeight;

            App.Player.$courseLeft = 'url(img/tankLeft.png)';
            App.Player.$courseRight = 'url(img/tankRight.png)';
            App.Player.$courseTop = 'url(img/tankTop.png)';
            App.Player.$courseBottom = 'url(img/tankBottom.png)';

            App.$initTankSize = 40;
            App.$initWallSize = 50;
        },

        bindEvents: function() {

            App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);
            App.$doc.on('click', '#btnBuild', App.Host.onBuildClick);

            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '.gameList', App.Player.onPlayerSelectGameClick);

            App.$doc.on('click', '#btnStart', App.Player.onPlayerStartClick);

            App.$doc.on('keydown', App.Player.runPlayerEvent );
            // window.addEventListener('keydown', App.Player.runPlayerEvent().getPressed );
            // window.addEventListener('keyup', App.Player.runPlayerEvent().getPressed );

            window.addEventListener('resize', App.resize);

        },

        showInitScreen: function() {
            App.$gameArea.html(App.$templateHelloScreen);
            App.doTextFit('.title');
        },

        resize: function() {
            $("#gameArea").css({
                'width': window.innerWidth + 'px',
                'height': window.innerHeight + 'px'
            });
        },

        controlGame: function(data) {

            //if ( data.player.mySocketId === App.mySocketId && data.playerActive !== 0) {
                App.$gameArea.html( App.$gameFieldTemplate );
                App.hostSocketId = data.hostSocketId;
                App.drawingLevel();

                //App.gameId = data.gameId;
                for (var i = 0, l = data.players.length; i < l; i++) {
                    (function(e){
                        App.Player.createPlayer(data.players[e]);

                        App.Player.createStatisticPlayer({ num: e,
                                                           playerName: data.players[e].playerName,
                                                           kill: data.players[e].kill,
                                                           dead: data.players[e].dead
                                                        });

                    })(i);
                }

            /*} else {
                App.Player.createPlayer( App.Player.players[data.playerActive] );
                //console.log( $('.tankContainer_' + App.mySocketId) );

            }*/




        },

        drawingLevel: function() {
            $("#gameArea").css({ 'background-image': 'none' });

            for (var i = 0; i < App.levelPlan.length; i++) {
                for (var j = 0; j < App.levelPlan[i].length; j++) {

                    if ( App.levelPlan[i][j] === "w" ) {

                        $("#gameFieldAreaWrapper").append( $('<div/>').addClass('wallContainer')
                                                               .css({'left': App.$initWallSize * j,
                                                                     'top': App.$initWallSize * i,
                                                                     'width': App.$initWallSize + 'px',
                                                                     'height': App.$initWallSize + 'px' }) );
                    }
                }
            }

        },


        Host: {

            players: [],
            isNewGame: false,
            numPlayersInRoom: 0,

            onCreateClick: function() {
                IO.socket.emit('hostCreateNewGame');
            },

            gameInit: function(data){
                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                App.$gameArea.html( App.$templateCreateGameMenu );
            },

            showGamesList: function(data) {
                App.$gameArea.html(App.$templateJoinGameMenu);
                var gamesList = data.gameList;

                $(".joinGameMenuWrapperWrapper").append( $('<div/>').addClass('gameList gameListTitul').append( $('<div/>').addClass('gameListName').html('Game Name') )
                                                                                         .append( $('<div/>').addClass('gameListTrack').html('Tracking Time') )
                                                                                         .append( $('<div/>').addClass('gameListPlayers').html('Players') )
                                                                                         .append( $('<div/>').addClass('gameListMeatrating').html('Meat Rating') )
                                                                                         .append( $('<div/>').addClass('gameListPassword').html('Password') )
                                                        );

                for (var i in gamesList) {

                    var track = ( gamesList[i].tracking[1]<10 ) ? ( '0' + gamesList[i].tracking[0] + 'h:0' +  gamesList[i].tracking[1] + 'm' )
                                                                : ( '0' + gamesList[i].tracking[0] + 'h:' +  gamesList[i].tracking[1] + 'm' );



                    $(".joinGameMenuWrapperWrapper").append( $('<div/>').addClass('gameList').append( $('<div/>').addClass('gameListName').html(gamesList[i].gameName) )
                                                                                             .append( $('<div/>').addClass('gameListTrack').html( track ))
                                                                                             .append( $('<div/>').addClass('gameListPlayers').html(gamesList[i].players) )
                                                                                             .append( $('<div/>').addClass('gameListMeatrating').html(gamesList[i].meatRating) )
                                                                                             .append( $('<div/>').addClass('gameListPassword').html(gamesList[i].passwordStatus) )
                                                                                             .append( $('<div/>').addClass('gameListId').html(gamesList[i].gameId).css({'display': 'none'}) )
                                                            );

                }
            },

            onBuildClick: function() {
                //App.$gameArea.html( App.$gameFieldTemplate );
                //console.log("Asdasd");
                App.Player.hostSocketId = App.mySocketId;

                var data = {
                    gameName: $('#inputGameName').val(),
                    playerName: $('#inputYourNickname').val() || 'anon',
                    password: $('#inputPassword').val(),
                    gameId: App.gameId,
                    hostSocketId: App.Player.hostSocketId
                };

                IO.socket.emit('hostBuildGame', data);
            }

        },


        /* *****************************
         *        PLAYER CODE        *
         ***************************** */

        Player: {
            hostSocketId: '',
            myName: '',
            players: [],

            speedBullet: 400,
            speedPlayer: 300,
            playerActive: null,
            canRun: true,
            refreshAnimateFrameID: [],
            selectGameId: null,

            onJoinClick: function() {
                IO.socket.emit('getGames');
            },

            onJoinMenuClick: function() {
                App.$gameArea.html(App.$templateJoinGameMenu);
            },

            onPlayerSelectGameClick: function() {

                // App.Player.selectGameId = $(this).find(".gameListId").text();
                App.gameId = $(this).find(".gameListId").text();

                App.$gameArea.html( App.$templateJoinSelectGame );
            },

            onPlayerStartClick: function() {
                var data = {
                    playerName: $('#inputYourNickname').val() || 'anon',
                    password: $('#inputPassword').val() || '',
                    gameId: App.gameId,
                    mySocketId: App.mySocketId
                };

                App.Player.myName = data.playerName;
                IO.socket.emit('playerJoinGame', data);
            },

            updateWaitingScreen: function(data) {

                if (IO.socket.socket.sessionid === data.player.mySocketId) {
                    App.myRole = 'Player';
                    App.gameId = data.player.gameId;
                    App.Player.players = data.players.slice();
                    App.Player.gameWorld(data.players);

                }
            },

            createPlayer: function(player) {
                $("#gameFieldAreaWrapper").append( $('<div/>').addClass('tankContainer tankContainer_' + player.mySocketId)
                                                       .css({'left': player.posX + 'px',
                                                            'top': player.posY + 'px',
                                                            'width': App.$initTankSize + 'px',
                                                            'height': App.$initTankSize + 'px',
                                                            'background-image':  App.Player.getCourseURL(player.course)
                                                        }) );

                                    //$('.tankContainer_' + App.PLayer.players[0].mySocketId).css({ 'border': '1px solid yellow'});

                // $("#gameFieldAreaWrapper").css({ 'left':  $("#gameArea").width()/2 - $('.tankContainer_' + player.playerName).width() +'px', 'top':  $("#gameArea").height()/2 - - $('.tankContainer_' + player.playerName).height() +'px' });
                App.Player.windowRotate();
            },

            createStatisticPlayer: function(data) {

                $("#statContainer").append( $('<div/>').addClass('statContainerItem statItem' + data.num)
                                                       .append( $('<div/>').addClass('statContainerItemName').text( data.playerName))
                                                       .append( $('<div/>').addClass('statContainerItemKill').text( 'Kill:' + data.kill))
                                                       .append( $('<div/>').addClass('statContainerItemDead').text( 'Dead:' + data.dead))
                                    );
            },

            windowRotate: function() {
                $("#gameFieldAreaWrapper").css({ 'left':  $("#gameArea").width()/2 - App.Player.players[App.Player.playerActive].posX +'px', 'top':  $("#gameArea").height()/2 - App.Player.players[App.Player.playerActive].posY +'px' });
            },

            runPlayerEvent: function(eventObject) {

                /*var pressed = Object.create(null);

                return {
                    hundler: function (event) {
                        if (App.arrowCodes.hasOwnProperty(event.keyCode)) {
                            var down = event.type == "keydown";
                            pressed[App.arrowCodes[event.keyCode]] = down;
                            event.preventDefault();
                        }
                    },
                    getPressed: function(event) {
                        App.Player.runPlayerEvent().hundler(event);
                        console.log(pressed);
                        return pressed;
                    }
                }*/

                if ((eventObject.keyCode === 39) && (App.Player.canRun === true) ) {
                    console.log('right');
                    App.Player.canRun = false;
                    App.Player.players[App.Player.playerActive].course = 'right';
                    IO.socket.emit('playerRun', { player: App.Player.players[App.Player.playerActive], playerNum: App.Player.playerActive });
                    App.$doc.on('keyup', function(){
                        IO.socket.emit('playerStop', { player: App.Player.players[App.Player.playerActive], playerNum: App.Player.playerActive });
                        App.Player.canRun = true;
                    });

                }
                if ((eventObject.keyCode === 37) && (App.Player.canRun === true) ) {
                    console.log('left');
                    App.Player.canRun = false;
                    App.Player.players[App.Player.playerActive].course = 'left';
                    IO.socket.emit('playerRun', {player: App.Player.players[App.Player.playerActive], playerNum: App.Player.playerActive});
                    App.$doc.on('keyup', function(){
                        IO.socket.emit('playerStop', {player: App.Player.players[App.Player.playerActive], playerNum: App.Player.playerActive});
                        App.Player.canRun = true;
                    });
                }
                if ((eventObject.keyCode === 38) && (App.Player.canRun === true) ) {
                    App.Player.canRun = false;
                    App.Player.players[App.Player.playerActive].course = 'top';
                    IO.socket.emit('playerRun', {player: App.Player.players[App.Player.playerActive], playerNum: App.Player.playerActive});
                    App.$doc.on('keyup', function(){
                        IO.socket.emit('playerStop', {player: App.Player.players[App.Player.playerActive], playerNum: App.Player.playerActive});
                        App.Player.canRun = true;
                    });
                }
                if ((eventObject.keyCode === 40) && (App.Player.canRun === true) ) {
                    App.Player.canRun = false;
                    App.Player.players[App.Player.playerActive].course = 'bottom';
                    IO.socket.emit('playerRun', {player: App.Player.players[App.Player.playerActive], playerNum: App.Player.playerActive});
                    App.$doc.on('keyup', function(){
                        IO.socket.emit('playerStop', {player: App.Player.players[App.Player.playerActive], playerNum: App.Player.playerActive});
                        App.Player.canRun = true;
                    });
                }

                if (eventObject.keyCode === 27) {
                    $("#statFieldArea").css({'display': 'block'});
                    App.$doc.on('keyup', function(){
                        $("#statFieldArea").css({'display': 'none'});
                    });
                }

            },

            refreshAfterRun: function(data) {
                var data = data;

                var refresh = function(){

                    App.Player.refreshAnimateFrameID[data.playerNum] = requestAnimationFrame(refresh);

                    var dt = 0.017;

                    if ( App.Player.players[data.playerNum].course === 'right' ) { App.Player.players[data.playerNum].posX += App.Player.speedPlayer*dt; }
                    if ( App.Player.players[data.playerNum].course === 'left' ) { App.Player.players[data.playerNum].posX -= App.Player.speedPlayer*dt; }
                    if ( App.Player.players[data.playerNum].course === 'top' ) { App.Player.players[data.playerNum].posY -= App.Player.speedPlayer*dt; }
                    if ( App.Player.players[data.playerNum].course === 'bottom' ) { App.Player.players[data.playerNum].posY += App.Player.speedPlayer*dt; }


                    $('.tankContainer_'+ App.Player.players[data.playerNum].mySocketId ).css({'left': App.Player.players[data.playerNum].posX + 'px',
                                                                                    'top': App.Player.players[data.playerNum].posY + 'px',
                                                                                    'background-image':  App.Player.getCourseURL(data.player.course)
                                                                                });

                    if (App.mySocketId === App.Player.players[data.playerNum].mySocketId) { App.Player.windowRotate(); }
                }

                return {
                    run: function() {
                        refresh();
                    },
                    stop: function() {

                        cancelAnimationFrame( App.Player.refreshAnimateFrameID[data.playerNum] );
                        //App.Player.players = data.players.slice();
                        //IO.socket.emit('regularUpdateCoordination', { players: App.Player.players, playerNum: data.playerNum });
                        //App.Player.refreshAnimateFrameID[data.playerNum] = undefined;
                        //console.log(App.Player.refreshAnimateFrameID);
                        //App.Player.refreshAnimateFrameID = 0;
                        //App.Player.refreshAnimateFrameID.splice(data.playerNum, 1);
                    }
                }

            },

            regularUpdateCoordination: function(data) {

                    $('.tankContainer_'+ App.Player.players[data.playerNum].mySocketId ).css({  'left': App.Player.players[data.playerNum].posX + 'px',
                                                                                                'top': App.Player.players[data.playerNum].posY + 'px'
                                                                                        });



                /*var timeout;
                return {
                    update: function(){
                        timeout = setTimeout(function(){
                            IO.socket.emit('regularUpdateCoordination', { players: App.Player.players });
                            App.Player.regularUpdateCoordination().update();
                        }, 500);
                    },
                    stopUpdate: function(){
                        clearTimeout(timeout);
                    }
                }*/
            },

            refreshPlayerAfterRegularUpdate: function() {
                var refreshAnimateFrameID;
                var dt = 0.017;
                function refresh() {
                    refreshAnimateFrameID = requestAnimationFrame(refresh);

                    if ( App.Player.players[data.playerNum].course === 'right' ) { App.Player.players[data.playerNum].posX += App.Player.speedPlayer*dt; }
                    if ( App.Player.players[data.playerNum].course === 'left' ) { App.Player.players[data.playerNum].posX -= App.Player.speedPlayer*dt; }
                    if ( App.Player.players[data.playerNum].course === 'top' ) { App.Player.players[data.playerNum].posY -= App.Player.speedPlayer*dt; }
                    if ( App.Player.players[data.playerNum].course === 'bottom' ) { App.Player.players[data.playerNum].posY += App.Player.speedPlayer*dt; }

                    //if () {}


                    $('.tankContainer_'+ App.Player.players[data.playerNum].mySocketId ).css({'left': App.Player.players[data.playerNum].posX + 'px',
                                                                                    'top': App.Player.players[data.playerNum].posY + 'px',
                                                                                    'background-image':  App.Player.getCourseURL(data.player.course)
                                                                                });

                    if (App.mySocketId === App.Player.players[data.playerNum].mySocketId) { App.Player.windowRotate(); }
                }
            },

            playerDisconnect: function(mySocketId) {
                $('.tankContainer_'+ mySocketId ).remove();
            },

            gameDisconnect: function() {
                $('#gameFieldArea').remove();
            },


            getCourseURL: function(course) {
                if ( course === 'left' ) { return App.Player.$courseLeft };
                if ( course === 'right' ) { return App.Player.$courseRight };
                if ( course === 'top' ) { return App.Player.$courseTop };
                if ( course === 'bottom' ) { return App.Player.$courseBottom };

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
