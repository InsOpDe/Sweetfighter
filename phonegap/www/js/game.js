var game = {
    oldX: undefined,
    oldY: undefined,
    offset: 180,
    players : ['blue','red'],
    init: function() {
        game.phaser = new Phaser.Game(704, 396, Phaser.CANVAS, 'phaser-example', { preload: loader.preload, create: game.create, update: game.update });
        initTouchInterface();
        initShake();
    },
    sprite:undefined,
    cursors:undefined,
    interface:undefined,
    interface_background:undefined,
    healthbar_p1:undefined,
    healthbar_p2:undefined,
    meterbar_p1:undefined,
    meterbar_p2:undefined,

    create : function() {
        // spiel ist aktiv auch wenn das fenster nicht fokussiert ist
        game.phaser.stage.disableVisibilityChange = true;

        //SCALING FOR MOBILE DEVICES
        if (this.game.device.desktop === false){
            this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        }

        //Hintergrund
        game.ebene1 = game.phaser.add.tileSprite(0, 0, game.options.mapX, game.options.mapY, 'ebene1');
        game.ebene2 = game.phaser.add.tileSprite(0, 0, game.options.mapX, game.options.mapY, 'ebene2');
        game.ebene3 = game.phaser.add.tileSprite(0, 0, game.options.mapX, game.options.mapY, 'ebene3');
        game.ebene4 = game.phaser.add.tileSprite(0, 0, game.options.mapX, game.options.mapY, 'ebene4');

        game.phaser.world.setBounds(0, 0, game.options.mapX, game.options.mapY);
        
        
        //hit animations
        game.hitAnimations = {};
        game.hitAnimations.hit1 = game.phaser.add.sprite(0, 0, 'fx1');
        game.hitAnimations.hit1.animations.add('fx1',[0,1,2,3]);
        game.hitAnimations.hit1.alpha = 0;
        
        

        //player animations etc
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
            if(!debug.debugModeOn)game[color].center.alpha = 0;
            
            //boundingbox of player
            var width = game[color].w;
            var height = game[color].h;
            var bmd = game.phaser.add.bitmapData(width, height);
            bmd.ctx.beginPath();
            bmd.ctx.rect(0, 0, width, height);
            bmd.ctx.strokeStyle = '#ff0000';
            bmd.ctx.stroke();
            game[color].box = game.phaser.add.sprite(game[color].x, game[color].y-10, bmd);
            if(!debug.debugModeOn)game[color].box.alpha = 0;
            
            //boundingbox of attack
            var width = 40;
            var height = 40 ;
            var bmd = game.phaser.add.bitmapData(width, height);
            bmd.ctx.beginPath();
            bmd.ctx.rect(0, 0, width, height);
            bmd.ctx.strokeStyle = '#0000ff';
            bmd.ctx.stroke();
            game[color].attackRange = game.phaser.add.sprite(game[color].x, game[color].y, bmd);
            if(!debug.debugModeOn)game[color].attackRange.alpha = 0;
            
            
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
        game.blue.anchor.x = 1;
        game.red.anchor.x = 0;
        
        //Add Userinterface
        game.interface_background = game.phaser.add.image(2,0, 'interface_background');
        game.healthbar_p1 = game.phaser.add.image(100,41, 'healthbar_p1');
        game.healthbar_p2 = game.phaser.add.image(387,41, 'healthbar_p2');
        game.meterbar_p1 = game.phaser.add.image(102,63, 'meterbar_p1');
        game.meterbar_p2 = game.phaser.add.image(452,63, 'meterbar_p2');
        game.interface = game.phaser.add.image(2, 0, 'interface');
        
        game.interface.scale.setTo(0.5, 0.5);
        game.interface.fixedToCamera = true;
        game.interface.cameraOffset.setTo(2,0);
        
        game.healthbar_p1.scale.setTo(0.5,0.5);
        game.healthbar_p1.fixedToCamera = true;
        game.healthbar_p1.cameraOffset.setTo(102,41); 
        game.healthbar_p2.scale.setTo(0.5,0.5);
        game.healthbar_p2.fixedToCamera = true;
        game.healthbar_p2.cameraOffset.setTo(387,41);
        
        game.meterbar_p1.scale.setTo(0.5,0.5);
        game.meterbar_p1.fixedToCamera = true;
        game.meterbar_p1.cameraOffset.setTo(102,63);
        game.meterbar_p2.scale.setTo(0.5,0.5);
        game.meterbar_p2.fixedToCamera = true;
        game.meterbar_p2.cameraOffset.setTo(452,63);
        
        game.interface_background.scale.setTo(0.5, 0.5);
        game.interface_background.fixedToCamera = true;
        game.interface_background.cameraOffset.setTo(2,0);
        
        timerCountdown.initTimer();
        
        //TEST - DEBUG
        hypermeter.changehypermeter_player();
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
            
            //attackrange
//            game[color].attackRange.x = game[color].realX-(game[color].w/1.2);
//            game[color].attackRange.y = game[color].realY-(game[color].h/1.2);
            
            
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
        
        timerCountdown.updateTimer();
    }
};

//TIMER
//TODO MOVE INTERNAL TIMER TO SERVER SIDE
var timerCountdown = {
    timer:undefined,
    text:undefined,
    timerInterval:undefined,
    
    initTimer:function(){
        timerCountdown.timer = 99;
        timerCountdown.text = game.phaser.add.text(321, 21, timerCountdown.timer,{
            font: "bold 54px Arial",
            fill: "555151",
            align: "center"
        });
        timerCountdown.text.bringToTop();
        timerCountdown.text.fixedToCamera = true;
        timerCountdown.text.cameraOffset.setTo(321,21);
        //timerCountdown.startTimer();
    },
    
    updateTimer:function(){
            if(timerCountdown.timer >= 10){
                timerCountdown.text.setText(timerCountdown.timer);
            } else {
                timerCountdown.text.setText("0" + timerCountdown.timer);
            }
            
            if(timerCountdown.timer < 0){
            //timerCountdown.resetTimer();
        }
    },
    
    stopTimer:function(){
        clearInterval(timerCountdown.timerInterval);
    },
    
    resetTimer:function(){
        timerCountdown.stopTimer();
        timerCountdown.timer = 99;
        timerCountdown.text.setText(timerCountdown.timer);
        timerCountdown.startTimer();
    }
};

var hypermeter = {
    hyper:0,
    hypermax:100,
    
    changehypermeter_player:function(){
//        game.meterbar_p1.position.x = 300;
//         game.meterbar_p1.anchor.x = 0;
//        game.meterbar_p1.cameraOffset.setTo(102,63);
//        var cropRect = new Phaser.Rectangle(100,0,100,28);
//        cropRect.topLeft = new Phaser.Point(150,0);
        //cropRect.fixedToCamera = true;
        
//        game.meterbar_p1.crop(cropRect);
        
        game.meterbar_p1.cropEnabled = true;
        game.meterbar_p1.crop.width = 75;
    }
};