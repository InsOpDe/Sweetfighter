var game = {
    oldX: undefined,
    oldY: undefined,
    offset: 180,
    players : ['blue','red'],
    init: function() {
        game.phaser = new Phaser.Game(700, 400, Phaser.AUTO, 'gamescreen', { preload: loader.preload, create: game.create, update: game.update });
        initTouchInterface();
        initShake();
        
        $('#waiting').hide();
    },
    backgroundGroup:undefined,
    characterGroup:undefined,
    effectGroup:undefined,
    interfaceGroup:undefined,
    sprite:undefined,
    cursors:undefined,
    interface:undefined,
    interface_background:undefined,
    healthbar_p1:undefined,
    dmgbar_p1:undefined,
    healthbar_p2:undefined,
    dmgbar_p2:undefined,
    meterbar_p1:undefined,
    meterbar_p2:undefined,
    
    projectile_p1:undefined,
    projectileCount_p1:0,
    projectile_p2:undefined,
    projectileCount_p2:0,
    audio: {},
    create : function() {
        // spiel ist aktiv auch wenn das fenster nicht fokussiert ist
        game.phaser.stage.disableVisibilityChange = true;

        //Scaling for mobile devices
        if (this.game.device.desktop === false){
            this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        }

        //sounds
        game.audio.punch1 = game.phaser.add.audio('punch1');
        game.audio.punch1.addMarker('punch1', 0, 0.35);
        game.audio.punch2 = game.phaser.add.audio('punch2');
        game.audio.punch2.addMarker('punch2', 0, 1.0);
        game.audio.punch3 = game.phaser.add.audio('punch3');
        game.audio.punch3.addMarker('punch3', 0, 1.0);
        game.audio.punch1.allowMultiple = false;
        game.audio.punch2.allowMultiple = true;
        game.audio.punch3.allowMultiple = true;

        game.phaser.world.setBounds(0, 0, game.options.mapX, game.options.mapY);
        
        game.backgroundGroup = game.phaser.add.group();
        game.characterGroup = game.phaser.add.group();
        game.foregroundGroup = game.phaser.add.group();
        game.effectGroup = game.phaser.add.group();
        game.interfaceGroup = game.phaser.add.group();

        //Background
        game.ebene1 = game.phaser.add.tileSprite(0, 0, game.options.mapX, game.options.mapY, 'ebene1');
        game.ebene2 = game.phaser.add.tileSprite(0, 0, game.options.mapX, game.options.mapY, 'ebene2');
        game.ebene3 = game.phaser.add.tileSprite(0, 0, game.options.mapX, game.options.mapY, 'ebene3');
        game.ebene4 = game.phaser.add.tileSprite(0, 0, game.options.mapX, game.options.mapY, 'ebene4');
        game.backgroundGroup.add(game.ebene1);
        game.backgroundGroup.add(game.ebene2);
        if(game.options.map == 'jungle'){
            game.foregroundGroup.add(game.ebene3);
        } else {
            game.backgroundGroup.add(game.ebene3);
        }

        game.backgroundGroup.add(game.ebene4);



        
        //player animations etc
        for(var key in game.players){
            var color = game.players[key];
            console.log(color);
            
            game[color] = game.phaser.add.sprite(game.options.characters[color].start, game.options.mapY, color);
            game.characterGroup.add(game[color]);
            
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
//            var width = 40;
//            var height = 40 ;
//            var bmd = game.phaser.add.bitmapData(width, height);
//            bmd.ctx.beginPath();
//            bmd.ctx.rect(0, 0, width, height);
//            bmd.ctx.strokeStyle = '#0000ff';
//            bmd.ctx.stroke();
//            game[color].attackRange = game.phaser.add.sprite(game[color].x, game[color].y, bmd);
//            if(debug.debugModeOn)game[color].attackRange.alpha = 0;
            
            
            //stand consists of frames 0,1,2
            game[color].animations.add('stand',game.options.characters[color].action.idle.animation.frames);
            //10 fps
            game[color].animations.play('stand', 10, true);
            //jump animation
            var isJumping = game[color].animations.add('jump',game.options.characters[color].action.jump.animation.frames);
            //crouch
            var isCrouching = game[color].animations.add('crouch',game.options.characters[color].action.crouch.animation.frames);
            //move
            var isWalking = game[color].animations.add('walk',game.options.characters[color].action.walk.animation.frames);
            //gotHit
            var gotHit = game[color].animations.add('gotHit',game.options.characters[color].action.gotHit.animation.frames);
            //block
            var blocked = game[color].animations.add('blocked',game.options.characters[color].action.blocked.animation.frames);
            //jab
            var isJabbing = game[color].animations.add('jab',game.options.characters[color].action.jab.animation.frames);
            //airhit
            var isAirhit = game[color].animations.add('airhit',game.options.characters[color].action.airhit.animation.frames);
            //crouchhit
            var isCrouchhit = game[color].animations.add('crouchhit', game.options.characters[color].action.crouchhit.animation.frames);
            //foward hit
            var isForwardhit = game[color].animations.add('forwardhit',game.options.characters[color].action.forwardhit.animation.frames);
            //backward hit
            var isBackwardhit = game[color].animations.add('backwardhit',game.options.characters[color].action.backwardhit.animation.frames);
            //kick
            var isKicking = game[color].animations.add('kick',game.options.characters[color].action.kick.animation.frames);
            //special1 
            var isSpecial1 = game[color].animations.add('special1',game.options.characters[color].action.special1.animation.frames);
            //special2  
            var isSpecial2 = game[color].animations.add('special2',game.options.characters[color].action.special2.animation.frames);
            //hyper 
            var isHyper = game[color].animations.add('hyper',game.options.characters[color].action.hyper.animation.frames);
            //Ko
            var isKO = game[color].animations.add('ko',game.options.characters[color].action.ko.animation.frames);

            //add attributes
            var attributes = {
                    gotHit:gotHit,
                    blocked:blocked,
                    isWalking:isWalking,
                    isWalkingSince:Date.now(),
                    isJumping:isJumping,
                    isCrouching:isCrouching,
                    isAttacking:false,
                    isJabbing:isJabbing,
                    isAirhit:isAirhit,
                    isCrouchhit:isCrouchhit,
                    isForwardhit:isForwardhit,
                    isBackwardhit:isBackwardhit,
                    isKicking:isKicking,
                    isSpecial1:isSpecial1,
                    isSpecial2:isSpecial2,
                    isHyper:isHyper,
                    isKO:isKO
                };
            game[color] = $.extend(game[color],attributes);
            
        }
        
        //vertically flip
        game.red.scale.x *= -1;
        
//        game.phaser.camera.x = 150;
//        game.phaser.camera.follow(game[game.options.color]);
        
        //set anchors
        game.blue.anchor.y = game.red.anchor.y = 1;
        game.blue.anchor.x = 1;
        game.red.anchor.x = 0.1;
        
        //Add Userinterface
        game.interface_background = game.phaser.add.image(2,0, 'interface_background');
        game.healthbar_p1 = game.phaser.add.image(102,41, 'healthbar_p1');
        game.dmgbar_p1 = game.phaser.add.image(102,41,'dmgbar');
        game.healthbar_p2 = game.phaser.add.image(387,41, 'healthbar_p2');
        game.dmgbar_p2 = game.phaser.add.image(102,41,'dmgbar');
        game.meterbar_p1 = game.phaser.add.image(102,63, 'meterbar');
        game.meterbar_p2 = game.phaser.add.image(452,63, 'meterbar');
                
        //Avatar - Last parameter is sprite no. on spritesheet
        var avatarA;
        var avatarB;
        if(game.options.characters['blue'].name.indexOf("muaythai") > -1){
            avatarA = 0;
        } else if(game.options.characters['blue'].name.indexOf("frau") > -1){
            avatarA = 1;
        }
        if(game.options.characters['red'].name.indexOf("muaythai") > -1){
            avatarB = 0;
        } else if(game.options.characters['red'].name.indexOf("frau") > -1){
            avatarB = 1;
        }
        
        var avaPA = game.phaser.add.sprite(20,15, 'avatar',avatarA);
        avaPA.scale.setTo(0.4, 0.4);
        avaPA.fixedToCamera = true;
        
        //Avatar player B
        var avaPB = game.phaser.add.sprite(684,15, 'avatar',avatarB);
        avaPB.scale.setTo(0.4, 0.4);
        avaPB.fixedToCamera = true;
        avaPB.scale.x *= -1;
        
        //Avatar animation player A
        var avataranimationAPlayerA = game.phaser.add.sprite(11,5,'avataranimationAPlayerA');
        avataranimationAPlayerA.scale.setTo(0.5, 0.5);
        avataranimationAPlayerA.fixedToCamera = true;
        avataranimationAPlayerA.animations.add('rotateA');
        avataranimationAPlayerA.animations.play('rotateA',10,true);
        var avataranimationBPlayerA = game.phaser.add.sprite(16,10,'avataranimationBPlayerA');
        avataranimationBPlayerA.scale.setTo(0.5, 0.5);
        avataranimationBPlayerA.fixedToCamera = true;
        avataranimationBPlayerA.animations.add('rotateB');
        avataranimationBPlayerA.animations.play('rotateB',10,true);
        
        //Avatar animation player B
        var avataranimationAPlayerB = game.phaser.add.sprite(693,5,'avataranimationAPlayerB');
        avataranimationAPlayerB.scale.setTo(0.5, 0.5);
        avataranimationAPlayerB.scale.x *= -1;
        avataranimationAPlayerB.fixedToCamera = true;
        avataranimationAPlayerB.animations.add('rotateA');
        avataranimationAPlayerB.animations.play('rotateA',10,true);
        var avataranimationBPlayerB = game.phaser.add.sprite(688,10,'avataranimationBPlayerB');
        avataranimationBPlayerB.scale.setTo(0.5, 0.5);
        avataranimationBPlayerB.scale.x *= -1;
        avataranimationBPlayerB.fixedToCamera = true;
        avataranimationBPlayerB.animations.add('rotateB');
        avataranimationBPlayerB.animations.play('rotateB',10,true);
        
        game.interface = game.phaser.add.image(2, 0, 'interface');

        var fill = 555151;
        if(game.options.map == 'jungle'){
            fill = "#ffffff";
        }

        var nameBlue = game.phaser.add.text(92, 78, game.options.nameBlue,{
            font: "bold 12px Arial",
            fill: fill,
            align: "center"
        });
        var eloBlue = game.phaser.add.text(92, 92, game.options.eloBlue + "BP",{
            font: "bold 12px Arial",
            fill: fill,
            align: "center"
        });
        var nameRed = game.phaser.add.text(612, 78, game.options.nameRed,{
            font: "bold 12px Arial",
            fill: fill,
            align: "center"
        });
        var eloRed = game.phaser.add.text(612, 92, game.options.eloRed + "BP",{
            font: "bold 12px Arial",
            fill: fill,
            align: "center"
        }); 
        
        game.interfaceGroup.add(game.interface_background);
        game.interfaceGroup.add(game.healthbar_p1);
        game.interfaceGroup.add(game.dmgbar_p1);
        game.interfaceGroup.add(game.healthbar_p2);
        game.interfaceGroup.add(game.dmgbar_p2);
        game.interfaceGroup.add(game.meterbar_p1);
        game.interfaceGroup.add(game.meterbar_p2);
        game.interfaceGroup.add(avaPA);
        game.interfaceGroup.add(avaPB);
        game.interfaceGroup.add(avataranimationAPlayerA);
        game.interfaceGroup.add(avataranimationBPlayerA);
        game.interfaceGroup.add(avataranimationAPlayerB);
        game.interfaceGroup.add(avataranimationBPlayerB);
        game.interfaceGroup.add(game.interface);
        game.interfaceGroup.add(nameBlue);
        game.interfaceGroup.add(eloBlue);
        game.interfaceGroup.add(nameRed);
        game.interfaceGroup.add(eloRed);
        
        game.interface.scale.setTo(0.5, 0.5);
        game.interface.fixedToCamera = true;
        game.interface.cameraOffset.setTo(2,0);
        
        game.healthbar_p1.scale.setTo(0.5,0.5);
        game.healthbar_p1.fixedToCamera = true;
        game.healthbar_p1.cameraOffset.setTo(102,41); 
        game.healthbar_p2.scale.setTo(0.5,0.5);
        game.healthbar_p2.fixedToCamera = true;
        game.healthbar_p2.cameraOffset.setTo(387,41);
        
        game.dmgbar_p1.fixedToCamera = true;
        game.dmgbar_p1.cameraOffset.setTo(102,41);
        game.dmgbar_p1.scale.setTo(0.5,0.5);
        game.dmgbar_p1.kill();
        game.dmgbar_p2.fixedToCamera = true;
        game.dmgbar_p2.cameraOffset.setTo(387,41);
        game.dmgbar_p2.scale.setTo(0.5,0.5);
        game.dmgbar_p2.kill();
        
        game.meterbar_p1.scale.setTo(0.5,0.5);
        game.meterbar_p1.fixedToCamera = true;
        game.meterbar_p1.cameraOffset.setTo(102,63);
        game.meterbar_p2.scale.setTo(0.5,0.5);
        game.meterbar_p2.fixedToCamera = true;
        game.meterbar_p2.cameraOffset.setTo(452,63);
        
        game.interface_background.scale.setTo(0.5, 0.5);
        game.interface_background.fixedToCamera = true;
        game.interface_background.cameraOffset.setTo(2,0);
        
        nameBlue.fixedToCamera = true;
        nameBlue.cameraOffset.setTo(92,78);
        eloBlue.fixedToCamera = true;
        eloBlue.cameraOffset.setTo(90,92);
        nameRed.anchor.x = 1;
        nameRed.fixedToCamera = true;
        nameRed.cameraOffset.setTo(612,78);
        eloRed.anchor.x = 1;
        eloRed.fixedToCamera = true;
        eloRed.cameraOffset.setTo(612,92);
        
        timerCountdown.initTimer();
        
        
        //hit animations müssen weiter runter, damit sie oben auf liegen
        game.hitAnimations = {};
        game.hitAnimations.hit1 = game.phaser.add.sprite(0, 0, 'fx1');
        game.hitAnimations.hit1.animations.add('fx1',[0,1,2,3]);
        game.hitAnimations.hit1.alpha = 0;
    },
    jumpTimer : 0,
    direction : false,
    update : function() {
        var char = game[game.options.color];
        var fi = game.options.characters[game.options.color].framesinfo;

        game.phaser.camera.focusOnXY(char.realX, char.realY - fi.h/2);
        
        debug.run();
        
        //players
        for(var key in game.players){
            var color = game.players[key];
            
            //debug collision
            //center
            game[color].center.x = game[color].realX-10;
            game[color].center.y = game[color].realY-10;
            
            //box
            game[color].box.x = game[color].realX-(game[color].w/2);
            game[color].box.y = game[color].realY-game[color].h;
            
            if(game[color].gotHitTimer >= Date.now()){
                    game[color].animations.play('gotHit', 5, false);

                if(game[color].hotHitId && game[color].hotHitId != game[color].hotHitIdTemp){
                    game[color].hotHitIdTemp = game[color].hotHitId;
                    game.punched();
                }
            } 
            else if(game[color].blocked){
                game[color].animations.play('blocked', 5, false);
            }
            else if(game[color].jabTimer >= Date.now()){
                game[color].animations.play('jab', 20, false);
            }
            else if(game[color].kickTimer >= Date.now()){
                game[color].animations.play('kick', 20, false);
            }
            else if(game[color].forwardhitTimer >= Date.now()){
                game[color].animations.play('forwardhit', 7, false);
            }
            else if(game[color].backwardhitTimer >= Date.now()){
                game[color].animations.play('backwardhit', 7, false);
                projectile.create(color,"projectile");
            }
            else if(game[color].airhitTimer >= Date.now()){
                game[color].animations.play('airhit', 20, false);
            }
            else if(game[color].crouchhitTimer >= Date.now()){
                game[color].animations.play('crouchhit', 5, false);
            }
            else if(game[color].special1Timer >= Date.now()){
                game[color].animations.play('special1', 10, false);
            }
            else if(game[color].special2Timer >= Date.now()){
                game[color].animations.play('special2', 10, false);
            }
            else if(game[color].hyperTimer >= Date.now()){
                game[color].animations.play('hyper', 10, false);
                projectile.create(color,"hyper");
            }
            else if(game[color].ko){
                    game[color].animations.play('ko', 3, false);
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
            projectile.update(color);
        }
        
        game.ebene2.tilePosition.x += .25;
        
        //Parallax
        if(game.oldX==undefined && game.oldY==undefined){
            game.oldX=game[game.options.color].x;
            game.oldY=game[game.options.color].y;
        }else{
            var diffX=(game[game.options.color].x-game.oldX)* (-1);
            //var vz = Math.sign(diffX);
			var vz = (diffX >= 0) ? ((diffX == 0) ? 0 : 1) : -1;
            game.ebene3.tilePosition.x += vz*.5;
//            game.ebene4.tilePosition.x += vz*3;
            game.oldX = game[game.options.color].x;
            
            var diffY=(game[game.options.color].y-game.oldY)* (-1);
            //vz = Math.sign(diffY);
			var vz = (diffY >= 0) ? ((diffY == 0) ? 0 : 1) : -1;
            game.ebene2.tilePosition.y += vz*.25;
            game.ebene3.tilePosition.y += vz*.5;
            game.oldY = game[game.options.color].y;
        }
        
        timerCountdown.updateTimer();
        healthgauge.updateHealthgaugeDisplay();
        healthgauge.updateDmgBar();
        hypermeter.updateHypermeterDisplay();
    },
    punched : function() {
        var rand = Math.floor(Math.random() * 3) + 1;
        game.audio['punch'+rand].play('punch'+rand);
        //if(!game.audio['punch1'].isPlaying)
        //    game.audio['punch1'].play('punch1');
    }
};

//TIMER - CLIENTSIDE
var timerCountdown = {
    timer:undefined,
    text:undefined,
    
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
        }
    }
};

var healthgauge = {
    healthplayers:{blue:{hp:undefined}, red:{hp:undefined}},
    gotHit:{blue:false, red:false},
    prevHealth:{blue:{coord:102,value:430},red:{coord:387,value:430}},
    dmgActive:{blue:false, red:false},
    dmgTimer:{blue:{active:false,timer:undefined,prevHealth:102,value:0},red:{active:false,timer:undefined,prevHealth:387,value:0}},
    
    updateHealthgaugeDisplay:function(){
        var hpPlayerA = healthgauge.healthplayers["blue"].hp;
        hpPlayerA = hpPlayerA*(4.3);
        var cropRectA = new Phaser.Rectangle(430-hpPlayerA,0,hpPlayerA,40);
        game.healthbar_p1.cameraOffset.setTo(102 + (430-hpPlayerA)/2,41); 
        game.healthbar_p1.crop(cropRectA);            
        if(healthgauge.gotHit.blue){
            if(!healthgauge.dmgActive.blue){
                game.dmgbar_p1.revive();
                healthgauge.dmgActive.blue = true;
            }
                game.dmgbar_p1.cameraOffset.setTo(healthgauge.prevHealth.blue.coord,41);
                var cropDmgA = new Phaser.Rectangle(0,0,healthgauge.prevHealth.blue.value - hpPlayerA,40);
                game.dmgbar_p1.crop(cropDmgA);
        } else if(!healthgauge.gotHit.blue && healthgauge.dmgActive.blue){
            healthgauge.prevHealth.blue.coord = 102 + (430-hpPlayerA)/2;
            healthgauge.dmgTimer.blue.value = healthgauge.prevHealth.blue.value - hpPlayerA;
            healthgauge.prevHealth.blue.value = hpPlayerA;
            healthgauge.dmgActive.blue = false;
            healthgauge.dmgTimer.blue.timer = new Date();
            healthgauge.dmgTimer.blue.active = true;
        }
        
        var hpPlayerB = healthgauge.healthplayers["red"].hp;
        hpPlayerB = hpPlayerB*(4.3);
        var cropRectB = new Phaser.Rectangle(0,0,hpPlayerB,40);
        game.healthbar_p2.crop(cropRectB); 
        if(healthgauge.gotHit.red){
            if(!healthgauge.dmgActive.red){
                game.dmgbar_p2.revive();
                healthgauge.dmgActive.red = true;
            }
            game.dmgbar_p2.cameraOffset.setTo(healthgauge.prevHealth.red.coord + 430/2 - (430-hpPlayerB)/2,41);
            var cropDmgB = new Phaser.Rectangle(0,0,healthgauge.prevHealth.red.value - hpPlayerB,40);
            game.dmgbar_p2.crop(cropDmgB);
        } else if(!healthgauge.gotHit.red && healthgauge.dmgActive.red){
            healthgauge.prevHealth.red.value = hpPlayerB;
            healthgauge.dmgActive.red = false;
            healthgauge.dmgTimer.red.timer = new Date();
            healthgauge.dmgTimer.red.active = true;
        }
    },
    updateDmgBar:function(){
        if(healthgauge.dmgTimer.blue.active){
            var curTime = new Date();
            if(curTime.getTime() - healthgauge.dmgTimer.blue.timer.getTime() > 300){
                    game.dmgbar_p1.kill();
                    healthgauge.dmgTimer.blue.active = false;
            }
        }
        if(healthgauge.dmgTimer.red.active){
            var curTime = new Date();
            if(curTime.getTime() - healthgauge.dmgTimer.red.timer.getTime() > 300){
                game.dmgbar_p2.kill();
                healthgauge.dmgTimer.red.active = false;
            }
        }
    }
};

var hypermeter = {
    hyperplayer:{blue:{hyper:undefined}, red:{hyper:undefined}},
    
    updateHypermeterDisplay:function(){        
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

var projectile = {
    create:function(color,projectile){
        switch(color){  
            case 'red':
                if(game[color].projectileExist && game.projectileCount_p1 < 1){
                    game.projectileCount_p1++;
                    switch(projectile){
                        case "projectile":
                            game.projectile_p1 = game.phaser.add.sprite(game[color].projectileX, game[color].projectileY,'projectile');
                            break;
                        case "hyper":
                            game.projectile_p1 = game.phaser.add.sprite(game[color].projectileX, game[color].projectileY,'projectileHyper');
                            break;
                    }
                    game.effectGroup.add(game.projectile_p1);
                    game.projectile_p1.animations.add('move',[0,1]);
                    game.projectile_p1.animations.play('move', 3, true);
                }
                break;
            case 'blue':
                if(game[color].projectileExist && game.projectileCount_p2 < 1){
                    game.projectileCount_p2++;
                    switch(projectile){
                        case "projectile":
                            game.projectile_p2 = game.phaser.add.sprite(game[color].projectileX, game[color].projectileY,'projectile');
                            break;
                        case "hyper":
                            game.projectile_p2 = game.phaser.add.sprite(game[color].projectileX, game[color].projectileY,'projectileHyper');
                            break;
                    }
                    game.effectGroup.add(game.projectile_p2);
                    game.projectile_p2.animations.add('move',[0,1]);
                    game.projectile_p2.animations.play('move', 3, true);
                }
                break;
        }
    },
    update:function(color){
        switch(color){  
            case 'red':
                if(game[color].projectileExist && game.projectileCount_p1 >= 1){
                    game.projectile_p1.x = game[color].projectileX;
                } else if(!game[color].projectileExist && game.projectileCount_p1 >= 1){
                    game.projectile_p1.destroy();
                    game.projectileCount_p1--;
                }
                break;
            case 'blue':
                if(game[color].projectileExist && game.projectileCount_p2 >= 1){
                    game.projectile_p2.x = game[color].projectileX;
                } else if(!game[color].projectileExist && game.projectileCount_p2 >= 1){
                    game.projectile_p2.destroy();
                    game.projectileCount_p2--;
                }
                break;
        }
    }
};