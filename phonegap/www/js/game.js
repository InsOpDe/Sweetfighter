var game = {
    oldX: undefined,
    oldY: undefined,
    offset: 180,
    players : ['blue','red'],
    init: function() {
        game.phaser = new Phaser.Game(704, 396, Phaser.AUTO, 'phaser-example', { preload: loader.preload, create: game.create, update: game.update });
//        game.phaser = new Phaser.Game(704, 396, Phaser.CANVAS, 'phaser-example', { preload: loader.preload, create: game.create, update: game.update });
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

//        game.ebene1.alpha = game.ebene2.alpha = game.ebene3.alpha = game.ebene4.alpha = 0

        game.phaser.world.setBounds(0, 0, game.options.mapX, game.options.mapY);
        
        

        
        

        //player animations etc
        for(var key in game.players){
            var color = game.players[key]
            console.log(game.options.characters);
            
//            game[color] = game.options.characters[color];
//            game[color] = $.extend(game[color],);
//            game[color] = game.phaser.add.sprite(game.options.characters[color].start, game.options.mapY, 'muaythai');
//            game[color] = game.phaser.add.sprite(game.options.characters[color].start, game.options.mapY, 'muaythai');
//            game[color] = game.phaser.add.sprite(game.options.characters[color].start, game.options.mapY, 'muaythai');
            game[color] = game.phaser.add.sprite(game.options.characters[color].start, game.options.mapY, 'muaythai'+color);
            game[color] = $.extend(game[color],game.options.characters[color]);
            console.log(game[color]);
            
            
            //center of player
            var bmd = game.phaser.add.bitmapData(20, 20);
            bmd.ctx.beginPath();
            bmd.ctx.rect(0, 0, 20, 20);
            bmd.ctx.fillStyle = '#ff0000';
            bmd.ctx.fill();
            game[color].center = game.phaser.add.sprite(game[color].x-10, game[color].y-10, bmd);
            if(debug.debugModeOn)game[color].center.alpha = 0;
            
            //boundingbox of player
            var width = game[color].w;
            var height = game[color].h;
            var bmd = game.phaser.add.bitmapData(width, height);
            bmd.ctx.beginPath();
            bmd.ctx.rect(0, 0, width, height);
            bmd.ctx.strokeStyle = '#ff0000';
            bmd.ctx.stroke();
            game[color].box = game.phaser.add.sprite(game[color].x, game[color].y-10, bmd);
            if(debug.debugModeOn)game[color].box.alpha = 0;
            
            //boundingbox of attack
            var width = 40;
            var height = 40 ;
            var bmd = game.phaser.add.bitmapData(width, height);
            bmd.ctx.beginPath();
            bmd.ctx.rect(0, 0, width, height);
            bmd.ctx.strokeStyle = '#0000ff';
            bmd.ctx.stroke();
            game[color].attackRange = game.phaser.add.sprite(game[color].x, game[color].y, bmd);
            if(debug.debugModeOn)game[color].attackRange.alpha = 0;
            
            
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
            //special1 
            var isSpecial1 = game[color].animations.add('special1',[24,25,26,25]);
            //special2  
            var isSpecial2 = game[color].animations.add('special2',[28,28,29,30,30,29]);
            //hyper 
            var isHyper = game[color].animations.add('hyper',[21,21,22,23,22]);

            //add attributes
            var attributes = {
                    isWalking:isWalking,
                    isWalkingSince:Date.now(),
                    isJumping:isJumping,
                    isCrouching:isCrouching,
                    isDefending:isDefending,
                    isAttacking:false,
                    isJabbing:isJabbing,
                    isKicking:isKicking,
                    isSpecial1:isSpecial1,
                    isSpecial2:isSpecial2,
                    isHyper:isHyper,
                };
            game[color] = $.extend(game[color],attributes);
            
        }
        
        //vertically flip
        game.red.scale.x *= -1;
        
        
        game.phaser.camera.follow(game[game.options.color]);
        
        //set anchors
        game.blue.anchor.y = game.red.anchor.y = 1;
        game.blue.anchor.x = 1;
        game.red.anchor.x = 0.1;
        
        //Add Userinterface
        game.interface_background = game.phaser.add.image(2,0, 'interface_background');
        game.healthbar_p1 = game.phaser.add.image(0,0, 'healthbar_p1');
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
        
        
        //hit animations müssen weiter runter, damit sie oben auf liegen
        game.hitAnimations = {};
        game.hitAnimations.hit1 = game.phaser.add.sprite(0, 0, 'fx1');
        game.hitAnimations.hit1.animations.add('fx1',[0,1,2,3]);
        game.hitAnimations.hit1.alpha = 0;
        
        
        //shadereffekte
        game.hitAnimations.shader1 = new Phaser.Filter(game.phaser, null, fragmentSrc);
//        game.hitAnimations.shader1.alpha = 0.0;
        game.hitAnimations.shader1.setResolution(704, 396);

//        game.hitAnimations.shaderEffect1 = game.phaser.add.sprite();
        game.hitAnimations.shaderEffects = game.phaser.add.tileSprite(0, 0, game.options.mapX, game.options.mapY, 'bgtrans');

        
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
            
//                    console.log(game[color].animations.currentAnim.frame);

            //handling shader 21,22,23
            var curFrame = game[color].animations.currentAnim.frame;
            var posX = game[color].position.x-game.phaser.camera.x;
            var posY = game[color].position.y-game.phaser.camera.y;
            var w = game[color].w;
//            var posX = game[color].realX;
//            var posY = game[color].realY;
//            console.log(posX,posY);
            //hyper
//            if(curFrame <= 23 && curFrame >= 21 ){
//                if(curFrame == 21)
//                    game.hitAnimations.shader1.update({x:posX-w-150,y:posY-170});
//                else if (curFrame == 22)
//                    game.hitAnimations.shader1.update({x:posX-w,y:posY-220});
//                else{
//                    game.hitAnimations.shader1.update({x:posX-w+50,y:posY-250});
//                    var movement = 30;
//                    console.log("end");
//                    setInterval(function(){
//                        game.hitAnimations.shader1.update({x:posX-w+50+movement,y:posY-250});
//                        movement+=movement;
////                        console.log("asd");
//                    },50)
//                }
//            }
            
            
            if(game[color].jabTimer >= Date.now()){
//                console.log("jab");
                game[color].animations.play('jab', 20, false);
            }
            else if(game[color].kickTimer >= Date.now()){
//                console.log("kick");
                game[color].animations.play('kick', 20, false);
            }
            else if(game[color].special1Timer >= Date.now()){
                game[color].animations.play('special1', 10, false);
            }
            else if(game[color].special2Timer >= Date.now()){
                game[color].animations.play('special2', 10, false);
            }
            else if(game[color].hyperTimer >= Date.now()){
                game[color].animations.play('hyper', 10, false);
                game.hitAnimations.shaderEffects.filters = [ game.hitAnimations.shader1 ];
                var counter = 0;
                
                if(typeof isPlayingHyper == "undefined")
                    isPlayingHyper = setInterval(function(posX){    
                        var shaderPosX = posX-w;
    //                    console.log(shaderPosX,posX-w,game[color].position.x,color,counter);
//                       if(counter >= 0 && counter <= 4){
//                           shaderPosX-=50;
//                           game.hitAnimations.shader1.update({x:shaderPosX,y:posY-170});
//                       } else if(counter > 4 && counter <= 10) {
//                           game.hitAnimations.shader1.update({x:shaderPosX,y:posY-220});
//                       } 
//                       else if(counter > 10 && counter <= 15) {
//                           shaderPosX+=100;
//                           game.hitAnimations.shader1.update({x:shaderPosX,y:posY-250});
//                       }
//                       else {

                           shaderPosX += counter*50 - 150;
//                       }
                       counter++;
                       game.hitAnimations.shader1.update({x:shaderPosX,y:posY-200});

                       if(counter >= 15){
                           game.hitAnimations.shaderEffects.filters = undefined;
                           clearInterval(isPlayingHyper);
                           delete isPlayingHyper;
                        }

                    },50,posX)
//                game.hitAnimations.shader1.update({x:50,y:60});
//                game[color].isHyper.onComplete = function(){console.log("asd");};
            }
            else {
                
                //animation finished?
                if(game[color].isHyper.isPlaying){
//                    game.hitAnimations.shaderEffects.filters = undefined;
                    
                } else {
//                    console.log(game[color].isHyper._frameIndex);
//                    console.log(game[color].isHyper._frameDiff);
//                    console.log(game[color].isHyper._frameSkipp);
                }
                
                
//                game.hitAnimations.shaderEffects.filters = undefined;
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
        healthgauge.updateHealthgaugeDisplay();
        hypermeter.updateHypermeterDisplay();
    }
};

//TIMER - CLIENTSIDE
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
    },
    
    updateTimer:function(){
        if(!isNaN(timerCountdown.timer)){
            if(timerCountdown.timer >= 10){
                timerCountdown.text.setText(timerCountdown.timer);
            } else {
                timerCountdown.text.setText("0" + timerCountdown.timer);
            }
        } else{
            //console.log("no time");
        }
    }
};

var healthgauge = {
    healthplayers:{blue:{hp:undefined}, red:{hp:undefined}},
    
    updateHealthgaugeDisplay:function(){
//        console.log(healthgauge.healthplayers["blue"].hp);
        var hpPlayerA = healthgauge.healthplayers["blue"].hp;
        hpPlayerA = hpPlayerA*(4.3);
        var cropRectA = new Phaser.Rectangle(430-hpPlayerA,0,hpPlayerA,40);
        var initPosA = 102;
        game.healthbar_p1.cameraOffset.setTo(initPosA + (430-hpPlayerA)/2,41); 
        game.healthbar_p1.crop(cropRectA);
        
//        console.log(healthgauge.healthplayers["red"].hp);
        var hpPlayerB = healthgauge.healthplayers["red"].hp;
        hpPlayerB = hpPlayerB*(4.3);
        var cropRectB = new Phaser.Rectangle(0,0,hpPlayerB,40);
        game.healthbar_p2.crop(cropRectB);      
    }
};

var hypermeter = {
    hyperplayer:{blue:{hyper:undefined}, red:{hyper:undefined}},
    
    updateHypermeterDisplay:function(){
//        console.log("Blau:" + hypermeter.hyperplayer["blue"].hyper);
//        console.log("Rot:" + hypermeter.hyperplayer["red"].hyper);
        
        var hyperPlayerA = hypermeter.hyperplayer["blue"].hyper;
        hyperPlayerA = hyperPlayerA * 3;
        var cropRectA = new Phaser.Rectangle(0,0,hyperPlayerA,28);
        game.meterbar_p1.crop(cropRectA);
        
        var hyperPlayerB = hypermeter.hyperplayer["red"].hyper;
        hyperPlayerB = hyperPlayerB * 3;
        
        game.meterbar_p2.anchor.x = 1;
        var initPosB = 452 + 150;      
        game.meterbar_p2.cameraOffset.setTo(initPosB,63);
        var cropRectB = new Phaser.Rectangle(0,0,hyperPlayerB, 28);
        game.meterbar_p2.crop(cropRectB);
    }
};
