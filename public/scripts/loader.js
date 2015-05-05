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

        game.phaser.load.spritesheet('muaythai', 'muay_thai.png', 360, 360, 14);
//        game.phaser.load.spritesheet('muaythai', 'spritesheet_mt_stand_right.png', 350, 182, 3);
        game.phaser.load.image('ebene1', 'Pyramiden/ebene1.png');
        game.phaser.load.image('ebene2', 'Pyramiden/ebene2.png');
        game.phaser.load.image('ebene3', 'Pyramiden/ebene3.png');
        game.phaser.load.image('ebene4', 'Pyramiden/ebene4.png');

    },
}