var game = {
    players : ['blue','red'],
    init: function() {
        game.phaser = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: loader.preload, create: game.create, update: game.update });
        
    },
    sprite:undefined,
    cursors:undefined,

    create : function() {
        game.phaser.stage.disableVisibilityChange = true;
        
//        game.phaser.add.image(0, 0, 'sky');

        //	Enable p2 physics
        game.phaser.physics.startSystem(Phaser.Physics.P2JS);

        //  Make things a bit more bouncey
        game.phaser.physics.p2.gravity.y = 10000;
        game.phaser.physics.p2.defaultRestitution = 0.8;

        //  Add a sprite
        game.blue = game.phaser.add.sprite(200, 200, 'player');
        game.red = game.phaser.add.sprite(200, 300, 'player');

        //  Enable if for physics. This creates a default rectangular body.
        game.phaser.physics.p2.enable(game.blue);
        game.phaser.physics.p2.enable(game.red);

        //  Modify a few body properties
//        game.sprite.body.setZeroDamping();
        game.blue.body.fixedRotation = true;
        game.red.body.fixedRotation = true;

        var text = game.phaser.add.text(20, 20, 'move with arrow keys', { fill: '#ffffff' });

        game.cursors = game.phaser.input.keyboard.createCursorKeys();

    },
    jumpTimer : 0,
    update : function() {
        debug.run();
	
//        game.cursors.right.isDown = true;
        
        for(var p in game.players){
            var color = game.players[p]
            game[color].body.setZeroVelocity();
            if (keyboard.player[color]["left"])
            {
                game[color].body.moveLeft(400);
            }
            else if (keyboard.player[color]["right"])
            {
                game[color].body.moveRight(400);
            }

//            if (keyboard.player[color]["moveup"])
//            {
//                game[color].body.moveUp(400);
//            }
//            else if (keyboard.player[color]["movedown"])
//            {
//                game[color].body.moveDown(400);
//            }
            
            if (keyboard.player[color]["moveup"] && game.phaser.time.now > game.jumpTimer && game.checkIfCanJump(color))
            {
                game[color].body.moveUp(1500);
                jumpTimer = game.phaser.time.now + 750;
            }


        }
        
        
//        for (var action in keyboard.state){
//            keyboard.state[action] = false;
//        }
        
//        game.sprite.body.setZeroVelocity();

    },
    
    checkIfCanJump : function(player) {

        var yAxis = p2.vec2.fromValues(0, 1);
        var result = false;

        for (var i = 0; i < game.phaser.physics.p2.world.narrowphase.contactEquations.length; i++)
        {
            var c = game.phaser.physics.p2.world.narrowphase.contactEquations[i];

            if (c.bodyA === game[player].body.data || c.bodyB === game[player].body.data)
            {
                var d = p2.vec2.dot(c.normalA, yAxis); // Normal dot Y-axis
                if (c.bodyA === game[player].body.data) d *= -1;
                if (d > 0.5) result = true;
            }
        }

        return result;

    }
            

}

