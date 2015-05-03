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
//        game.blue = game.phaser.add.sprite(game.options.player1start, game.options.mapY, 'player');
        game.blue = game.phaser.add.sprite(game.options.player1start, game.options.mapY, 'muaythai');
        game.red = game.phaser.add.sprite(game.options.player2start, game.options.mapY, 'muaythai');
        
        //stand consists of frames 0,1,2
        game.blue.animations.add('stand',[0,1,2,2,1,0]);
        //10 fps
        game.blue.animations.play('stand', 10, true);
        game.red.animations.add('stand',[0,1,2,2,1,0]);
        game.red.animations.play('stand', 10, true);
        //vertically flip
        game.red.scale.x *= -1;
        
        //jump animation
        game.blue.animations.add('jump',[3]);
        game.red.animations.add('jump',[3]);
        


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
        
        if(game.blue.y < game.options.mapY){
            game.blue.animations.play('jump', 10, true);
        } else {
            game.blue.animations.play('stand', 10, true);
        }
        
        if(game.red.y < game.options.mapY){
            game.red.animations.play('jump', 10, true);
        } else {
            game.red.animations.play('stand', 10, true);
        }

    },
            

}

