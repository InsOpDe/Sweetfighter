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

        game.phaser.load.spritesheet('muaythai', 'muay_thai.png', 400, 300, 14);
        game.phaser.load.spritesheet('fx1', 'img/fx1.png', 70, 70, 4);
        game.phaser.load.image('ebene1', 'Pyramiden/Ebene1.png');
        game.phaser.load.image('ebene2', 'Pyramiden/Ebene2.png');
        game.phaser.load.image('ebene3', 'Pyramiden/Ebene3.png');
        game.phaser.load.image('ebene4', 'Pyramiden/Ebene4.png');
        game.phaser.load.image('interface', 'img/Interface.png');
        game.phaser.load.image('interface_background', 'img/Interface_Background.png');
        game.phaser.load.image('healthbar_p1', 'img/Healthbar_P1.png');
        game.phaser.load.image('healthbar_p2', 'img/Healthbar_P2.png');
        game.phaser.load.image('meterbar_p1', 'img/Meterbar_P1.png');
        game.phaser.load.image('meterbar_p2', 'img/Meterbar_P2.png');

    },
}