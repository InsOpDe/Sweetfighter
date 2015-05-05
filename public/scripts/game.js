var game = {
    oldX: undefined,
    oldY: undefined,
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

        //Hintergrund
        game.ebene1 = game.phaser.add.tileSprite(0, 0, game.options.mapX, game.options.mapY, 'ebene1');
        game.ebene2 = game.phaser.add.tileSprite(0, 0, game.options.mapX, game.options.mapY, 'ebene2');
        game.ebene3 = game.phaser.add.tileSprite(0, 0, game.options.mapX, game.options.mapY, 'ebene3');
        game.ebene4 = game.phaser.add.tileSprite(0, 0, game.options.mapX, game.options.mapY, 'ebene4');

        game.phaser.world.setBounds(0, 0, game.options.mapX, game.options.mapY);

        //  Add a sprite
//        game.blue = game.phaser.add.sprite(game.options.player1start, game.options.mapY, 'player');
        game.blue = game.phaser.add.sprite(game.options.player1start, game.options.mapY, 'muaythai');
        game.red = game.phaser.add.sprite(game.options.player2start, game.options.mapY, 'muaythai');
        
        
        //game.physics.p2.enable(game.red);
        //game.physics.p2.enable(game.blue);
        //game.red.body.collideWorldBounds = true;
        //game.blue.body.collideWorldBounds = true;
        //game.camera.follow(game.red);
        
        for(var key in game.players){
            var color = game.players[key]
            //stand consists of frames 0,1,2
            game[color].animations.add('stand',[0,1,2,2,1,0]);
            //10 fps
            game[color].animations.play('stand', 10, true);
            //jump animation
            game[color].animations.add('jump',[3]);
            //crouch
            game[color].animations.add('crouch',[5]);
            //defence
            game[color].animations.add('defence',[4]);
            //move
            game[color].animations.add('move',[7,8,9,8]);
            //jab
            game[color].animations.add('jab',[10,11,11,11,10]);
        }
        
        //vertically flip
        game.red.scale.x *= -1;
        
        
        game.phaser.camera.follow(game.red);


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
        
        for(var key in game.players){
            var color = game.players[key]
            if(game[color].crouch){
                game[color].animations.play('crouch', 10, true);
            }
        }
        
        
        if(game.oldX==undefined && game.oldY==undefined){
            game.oldX=game.red.x;
            game.oldY=game.red.y;
        }else{
            var diffX=(game.red.x-game.oldX)* (-1);
            var vz = Math.sign(diffX);
            game.ebene2.tilePosition.x += vz*1;
            game.ebene3.tilePosition.x += vz*2;
            game.ebene4.tilePosition.x += vz*3;
            game.oldX = game.red.x;
            
            var diffY=(game.red.y-game.oldY)* (-1);
            vz = Math.sign(diffY);
            game.ebene2.tilePosition.y += vz*.25;
            game.ebene3.tilePosition.y += vz*.5;
            game.oldY = game.red.y;
        }
        

    },
    
    
}
