window.addEventListener("load", function () {
	loader.init();
        keyboard.init();
	debug.init();
        multiplayer.init();	
        chat.init();
        
        //warten bis der server gameOptions schickt
        multiplayer.socket.on('gameOptions', function (data) {
            //nur einmal initialisieren (bei serverrestart oderso)
            if( typeof game.options == "undefined"){
                game.options = data;
                game.init();
            }
        });
        
        
}, false)


var loader = {

    init: function() {
        
    },
    preload : function() {

        game.phaser.load.image('player', 'bunny.png');
//        game.phaser.load.image('sky', 'assets/skies/sunset.png');

    },

}