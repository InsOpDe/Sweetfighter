var game = {
    oldX: undefined,
    oldY: undefined,
    offset: 180,
    players : ['blue','red'],
    init: function() {
        game.phaser = new Phaser.Game(700, game.options.mapY, Phaser.CANVAS, 'phaser-example', { preload: loader.preload, create: game.create, update: game.update });
//       game.phaser = new Phaser.Game(game.options.mapX, game.options.mapY, Phaser.CANVAS, 'phaser-example', { preload: loader.preload, create: game.create, update: game.update });
       
        
    },
    sprite:undefined,
    cursors:undefined,

    create : function() {
        // spiel ist aktiv auch wenn das fenster nicht fokussiert ist
        game.phaser.stage.disableVisibilityChange = true;
        
//        game.phaser.add.image(0, 0, 'sky');

        //	Enable p2 physics
//        game.phaser.physics.startSystem(Phaser.Physics.P2JS);

        //  Make things a bit more bouncey
//        game.phaser.physics.p2.gravity.y = 10000;
//        game.phaser.physics.p2.defaultRestitution = 0.8;

        //Hintergrund
        game.ebene1 = game.phaser.add.tileSprite(0, 0, game.options.mapX, game.options.mapY, 'ebene1');
        game.ebene2 = game.phaser.add.tileSprite(0, 0, game.options.mapX, game.options.mapY, 'ebene2');
        game.ebene3 = game.phaser.add.tileSprite(0, 0, game.options.mapX, game.options.mapY, 'ebene3');
        game.ebene4 = game.phaser.add.tileSprite(0, 0, game.options.mapX, game.options.mapY, 'ebene4');

        game.phaser.world.setBounds(0, 0, game.options.mapX, game.options.mapY);

        
        for(var key in game.players){
            var color = game.players[key]
            console.log(game.options.characters);
            
//            game[color] = game.options.characters[color];
//            game[color] = $.extend(game[color],);
            game[color] = game.phaser.add.sprite(game.options.characters[color].start, game.options.mapY, 'muaythai');
            game[color] = $.extend(game[color],game.options.characters[color]);
            console.log(game[color]);
            
            
            //center of player
            var bmd = game.phaser.add.bitmapData(20, 20);

            bmd.ctx.beginPath();
            bmd.ctx.rect(0, 0, 20, 20);
            bmd.ctx.fillStyle = '#ff0000';
            bmd.ctx.fill();
            game[color].center = game.phaser.add.sprite(game[color].x-10, game[color].y-10, bmd);
            console.log(game[color].w,game[color].h);
            //boundingbox of player
            var width = game[color].w // example;
            var height = game[color].h // example;
            var bmd = game.phaser.add.bitmapData(width, height);

            bmd.ctx.beginPath();
            bmd.ctx.rect(0, 0, width, height);
            bmd.ctx.strokeStyle = '#ff0000';
            bmd.ctx.stroke();
            game[color].box = game.phaser.add.sprite(game[color].x, game[color].y-10, bmd);
            
            
            //stand consists of frames 0,1,2
            game[color].animations.add('stand',[0,1,2,2,1,0]);
            //10 fps
            game[color].animations.play('stand', 10, true);
            //jump animation
            var isJumping = game[color].animations.add('jump',[3]);
            //crouch
            var isCrouching = game[color].animations.add('crouch',[5]);
            //defence
            var isDefending = game[color].animations.add('defence',[4]);
            //move
            var isWalking = game[color].animations.add('walk',[7,8,9,8]);
            //jab
            var isJabbing = game[color].animations.add('jab',[10,11,11,11,10]);
//            game[color].animations.add('jab',[11]);
            //kick
            var isKicking = game[color].animations.add('kick',[4,4,6,6,4,4]);

            //add attributes
            var attributes = {
                    isWalking:isWalking,
                    isWalkingSince:Date.now(),
                    isJumping:isJumping,
                    isCrouching:isCrouching,
                    isDefending:isDefending,
                    isAttacking:false,
                    isJabbing:isJabbing,
                    isKicking:isKicking};
            game[color] = $.extend(game[color],attributes);
            
        }
        
        //vertically flip
        game.red.scale.x *= -1;
        
        
        game.phaser.camera.follow(game[game.options.color]);
        
        //set anchors
        game.blue.anchor.y = game.red.anchor.y = 1;
//        game.blue.anchor.x = game.red.anchor.x = 0;
//        game.blue.anchor.x = game.red.anchor.x = 0.5;
        game.blue.anchor.x = 1;
        game.red.anchor.x = 0;
        

//        var text = game.phaser.add.text(20, 20, 'move with arrow keys', { fill: '#ffffff' });

//        game.cursors = game.phaser.input.keyboard.createCursorKeys();

    },
    jumpTimer : 0,
    update : function() {
        debug.run();
        
        
        
        //players
        for(var key in game.players){
            var color = game.players[key]
            
            //debug collision
            //center
            game[color].center.x = game[color].realX-10;
            game[color].center.y = game[color].realY-10;
            
            
            //box
            game[color].box.x = game[color].realX-(game[color].w/2);
            game[color].box.y = game[color].realY-game[color].h;
            
            
            //if is attacking, then first make the move
//            if(!game[color].isJabbing.isPlaying){
            
            if(game[color].jabTimer >= Date.now()){
//                console.log("jab");
                game[color].animations.play('jab', 20, false);
            }else if(game[color].kickTimer >= Date.now()){
//                console.log("kick");
                game[color].animations.play('kick', 20, false);
            }
            else {
                if(game[color].crouch){
                    game[color].animations.play('crouch', 10, true);
                } else {
                    if(game[color].oldX==undefined){
                        game[color].oldX=game[color].x;
                    } else if(game[color].y < game.options.mapY){
                        game[color].animations.play('jump', 10, true);
                    }else if(game[color].isWalking){
                            game[color].animations.play('walk', 10, true);
                    } else {
                        game[color].animations.play('stand', 10, true);
                    }
                }
            }
        }
        
        game.ebene2.tilePosition.x += .25;
        
        //camera
        if(game.oldX==undefined && game.oldY==undefined){
            game.oldX=game.red.x;
            game.oldY=game.red.y;
        }else{
            var diffX=(game.red.x-game.oldX)* (-1);
            //var vz = Math.sign(diffX);
			var vz = (diffX >= 0) ? ((diffX == 0) ? 0 : 1) : -1;
            game.ebene3.tilePosition.x += vz*.5;
//            game.ebene4.tilePosition.x += vz*3;
            game.oldX = game.red.x;
            
            var diffY=(game.red.y-game.oldY)* (-1);
            //vz = Math.sign(diffY);
			var vz = (diffY >= 0) ? ((diffY == 0) ? 0 : 1) : -1;
            game.ebene2.tilePosition.y += vz*.25;
            game.ebene3.tilePosition.y += vz*.5;
            game.oldY = game.red.y;
        }
        

    },
    
    
}
