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

            IO.socket.on('gameList', IO.gameList);

            IO.socket.on('playerJoinedGame', IO.playerJoinedGame);

            IO.socket.on('buildedGame', IO.buildedGame);


            //IO.socket.on('playerUpdated', IO.playerUpdated);
            //IO.socket.on('playerFired', IO.playerFired);

            //IO.socket.on('refreshAfterDead', IO.refreshAfterDead);

            //IO.socket.on('refreshAfterDisconnect', IO.refreshAfterDisconnect);
            //IO.socket.on('refreshBullets', IO.refreshBullets);
        },

        onConnected: function(data) {
            App.mySocketId = IO.socket.socket.sessionid;
            //App.gameStatus = data.gameStatus;
        },

        onNewGameCreated: function(data) {
            App.Host.gameInit(data);
        },

        gameList: function(data) {
            App.Host.showGamesList(data);
        },

        buildedGame: function(data) {
            //App.Player.createGameField();
            App.Player.players = data.players.slice();
            App.Player.playerActive = data.playerActive;

            App.$gameArea.html( App.$gameFieldTemplate );
            App.drawingLevel();

            App.controlGame(data);
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
            }

        }





    };

    var App = {

        gameId: 0,
        myRole: '',
        gameStatus: null,
        mySocketId: '',
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
            // App.$gameArea.html( App.$gameFieldTemplate );
            // App.drawingLevel();

            if ( data.player.mySocketId === App.mySocketId && data.playerActive !== 0) {
                App.$gameArea.html( App.$gameFieldTemplate );
                App.drawingLevel();
                for (var i = 0, l = data.players.length; i < l; i++) {
                    (function(e){
                        App.Player.createPlayer(data.players[e]);
                    })(i);
                }
            } else {
                console.log(App.mySocketId);
                console.log(App.Player.players[data.playerActive].mySocketId);
                App.Player.createPlayer( App.Player.players[data.playerActive] );
                //console.log( $('.tankContainer_' + App.mySocketId) );

            }




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

                for (var i = 0, l = gamesList.length; i < l; i++) {

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
                var data = {
                    gameName: $('#inputGameName').val(),
                    playerName: $('#inputYourNickname').val() || 'anon',
                    password: $('#inputPassword').val(),
                    gameId: App.gameId,
                    hostSocketId: App.mySocketId
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
                App.Player.selectGameId = $(this).find(".gameListId").text();
                App.$gameArea.html( App.$templateJoinSelectGame );

            },

            onPlayerStartClick: function() {
                var data = {
                    playerName: $('#inputYourNickname').val() || 'anon',
                    password: $('#inputPassword').val() || '',
                    gameId: App.Player.selectGameId,
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

            windowRotate: function() {
                console.log(App.Player.playerActive);
                $("#gameFieldAreaWrapper").css({ 'left':  $("#gameArea").width()/2 - App.Player.players[App.Player.playerActive].posX +'px', 'top':  $("#gameArea").height()/2 - App.Player.players[App.Player.playerActive].posY +'px' });
            },

            runPlayerEvent: function(eventObject) {

                var runAnimateFrameID;

                if ((eventObject.keyCode === 39) && (App.Player.canRun === true)) {
                    App.Player.canRun = false;
                    runRightTank();
                }
                if ((eventObject.keyCode === 37) && (App.Player.canRun === true)) {
                    App.Player.canRun = false;
                    runLeftTank();
                }
                if ((eventObject.keyCode === 38) && (App.Player.canRun === true)) {
                    App.Player.canRun = false;
                    runTopTank();
                }
                if ((eventObject.keyCode === 40) && (App.Player.canRun === true)) {
                    App.Player.canRun = false;
                    runBottomTank();
                }



                function runRightTank() {
                    runAnimateFrameID = requestAnimationFrame(runRightTank);
                    // refreshAnimateFrameID[App.Player.playerActive] = requestAnimationFrame(runRightTank);

                    var dt = 0.017;

                    App.Player.players[App.Player.playerActive].course = 'right';

                    /*$(".tankContainer_" + App.Player.players[App.Player.playerActive].mySocketId).css({'left': App.Player.players[App.Player.playerActive].posX + 'px',
                                                                                                      'top': App.Player.players[App.Player.playerActive].posY + 'px',
                                                                                                      'background-image':  App.Player.getCourseURL(App.Player.players[App.Player.playerActive].course)
                                                                                                });*/

                        App.Player.players[App.Player.playerActive].posX += App.Player.speedPlayer*dt;
                        $(".tankContainer_" + App.Player.players[App.Player.playerActive].mySocketId).css({'left': App.Player.players[App.Player.playerActive].posX + 'px',
                                                                                                           'background-image':  App.Player.getCourseURL(App.Player.players[App.Player.playerActive].course)
                                                                                                       });
                        App.Player.windowRotate();


                }
                function runLeftTank() {

                    runAnimateFrameID = requestAnimationFrame(runLeftTank);

                    var dt = 0.017;

                    App.Player.players[App.Player.playerActive].course = 'left';

                        App.Player.players[App.Player.playerActive].posX -= App.Player.speedPlayer*dt;
                        $(".tankContainer_" + App.Player.players[App.Player.playerActive].mySocketId).css({'left': App.Player.players[App.Player.playerActive].posX + 'px',
                                                                                                            'background-image':  App.Player.getCourseURL(App.Player.players[App.Player.playerActive].course)
                                                                                                        });
                        App.Player.windowRotate();

                    // IO.socket.emit('playerRun', {player: App.Player.players[App.Player.playerActive], playerNum: App.Player.playerActive});

                }
                function runTopTank() {

                    runAnimateFrameID = requestAnimationFrame(runTopTank);

                    var dt = 0.017;

                    App.Player.players[App.Player.playerActive].course = 'top';

                        App.Player.players[App.Player.playerActive].posY -= App.Player.speedPlayer*dt;
                        $(".tankContainer_" + App.Player.players[App.Player.playerActive].mySocketId).css({'top': App.Player.players[App.Player.playerActive].posY + 'px',
                                                                                                'background-image':  App.Player.getCourseURL(App.Player.players[App.Player.playerActive].course)
                                                                                            });
                        App.Player.windowRotate();


                }
                function runBottomTank() {

                    runAnimateFrameID = requestAnimationFrame(runBottomTank);

                    var dt = 0.017;

                    App.Player.players[App.Player.playerActive].course = 'bottom';

                    App.Player.players[App.Player.playerActive].posY += App.Player.speedPlayer*dt;
                    $(".tankContainer_" + App.Player.players[App.Player.playerActive].mySocketId).css({'top': App.Player.players[App.Player.playerActive].posY + 'px',
                                                                                            'background-image':  App.Player.getCourseURL(App.Player.players[App.Player.playerActive].course)
                                                                                        });
                    App.Player.windowRotate();

                }

                App.$doc.on('keyup', function(){
                    App.Player.canRun = true;
                    window.cancelAnimationFrame(runAnimateFrameID);
                });

                /*if ((eventObject.keyCode === 39)) {
                    App.Player.players[App.Player.playerActive].course = 'right';
                    $(".tankContainer_" + App.Player.players[App.Player.playerActive].mySocketId).css({'left': App.Player.players[App.Player.playerActive].posX + 'px',
                                                                                                      'top': App.Player.players[App.Player.playerActive].posY + 'px',
                                                                                                      'background-image':  App.Player.getCourseURL(App.Player.players[App.Player.playerActive].course)
                                                                                                });
                }

                if ((eventObject.keyCode === 37)) {
                    App.Player.players[App.Player.playerActive].course = 'left';
                    $(".tankContainer_" + App.Player.players[App.Player.playerActive].mySocketId).css({'left': App.Player.players[App.Player.playerActive].posX + 'px',
                                                                                                      'top': App.Player.players[App.Player.playerActive].posY + 'px',
                                                                                                      'background-image':  App.Player.getCourseURL(App.Player.players[App.Player.playerActive].course)
                                                                                                });
                }

                if ((eventObject.keyCode === 38)) {
                    App.Player.players[App.Player.playerActive].course = 'top';
                    $(".tankContainer_" + App.Player.players[App.Player.playerActive].mySocketId).css({'left': App.Player.players[App.Player.playerActive].posX + 'px',
                                                                                                      'top': App.Player.players[App.Player.playerActive].posY + 'px',
                                                                                                      'background-image':  App.Player.getCourseURL(App.Player.players[App.Player.playerActive].course)
                                                                                                });
                }

                if ((eventObject.keyCode === 40)) {
                    App.Player.players[App.Player.playerActive].course = 'bottom';
                    $(".tankContainer_" + App.Player.players[App.Player.playerActive].mySocketId).css({'left': App.Player.players[App.Player.playerActive].posX + 'px',
                                                                                                      'top': App.Player.players[App.Player.playerActive].posY + 'px',
                                                                                                      'background-image':  App.Player.getCourseURL(App.Player.players[App.Player.playerActive].course)
                                                                                                });
                }*/


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
