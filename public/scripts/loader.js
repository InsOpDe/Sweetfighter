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

        game.phaser.load.spritesheet('muaythai', 'spritesheet_mt_stand_right.png', 183, 350, 3);
//        game.phaser.load.spritesheet('muaythai', 'spritesheet_mt_stand_right.png', 350, 182, 3);
        
        game.phaser.load.image('player', 'bunny.png');
//        game.phaser.load.image('sky', 'assets/skies/sunset.png');

    },

}