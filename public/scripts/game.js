var game = {
    players : ['blue','red'],
    init: function() {
        game.phaser = new Phaser.Game(game.options.mapX, game.options.mapY, Phaser.CANVAS, 'phaser-example', { preload: loader.preload, create: game.create, update: game.update });
        
    },
    sprite:undefined,
    cursors:undefined,

    create : function() {
        // spiel ist aktiv auch wenn das fenster nicht fokussiert ist
        game.phaser.stage.disableVisibilityChange = true;
        
//        game.phaser.add.image(0, 0, 'sky');

        //	Enable p2 physics
        game.phaser.physics.startSystem(Phaser.Physics.P2JS);

        //  Make things a bit more bouncey
//        game.phaser.physics.p2.gravity.y = 10000;
        game.phaser.physics.p2.defaultRestitution = 0.8;

        //  Add a sprite
        game.blue = game.phaser.add.sprite(game.options.player1start, game.options.mapY, 'player');
        game.red = game.phaser.add.sprite(game.options.player2start, game.options.mapY, 'player');
        


        //  Enable if for physics. This creates a default rectangular body.
//        game.phaser.physics.p2.enable(game.blue);
//        game.phaser.physics.p2.enable(game.red);
        

        //  Modify a few body properties
//        game.sprite.body.setZeroDamping();
//        game.blue.body.fixedRotation = true;
//        game.red.body.fixedRotation = true;
        
        //set anchors
        game.blue.anchor.y = game.red.anchor.y = 1;
        game.blue.anchor.x = game.red.anchor.x = 0;

        var text = game.phaser.add.text(20, 20, 'move with arrow keys', { fill: '#ffffff' });

//        game.cursors = game.phaser.input.keyboard.createCursorKeys();

    },
    jumpTimer : 0,
    update : function() {
        debug.run();

    },
            

}

