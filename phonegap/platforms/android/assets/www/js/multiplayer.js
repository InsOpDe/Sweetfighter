var multiplayer = {
    init:function(){
        multiplayer.socket = io.connect(serverIP);
    },
    startGame:function(){
        multiplayer.socket.emit('init', menu.options );
        chat.run();
        multiplayer.run();
        keyboard.block = false;
    },
    socket:null,
    lastHeartbeat: [],
    heartbeats: [],
    timestamp:new Date().valueOf(),
    sendCommand:function(details){
        //var time = Date.now();
        multiplayer.socket.emit('command', details );
//        multiplayer.lastHeartbeat = time;
//        multiplayer.heartbeats.push({send:time,received:0,server:0});
    },
    
    run:function(){
        
        
        var heartbeatInterval = setInterval(function(){
            var time = Date.now();
            if(Math.abs(multiplayer.lastHeartbeat - time) > 1000){
                multiplayer.socket.emit('heartbeat',{send:time});
                multiplayer.lastHeartbeat = time;
                multiplayer.heartbeats.push({send:time,received:0,server:0});
            }
        },1000)
        
        multiplayer.socket.on('heartbeat', function (data) {
            var received = Date.now();
            var send = data.send;
            var server = data.server;
            for(var i in multiplayer.heartbeats){
                var beat = multiplayer.heartbeats[i];
                if(beat.send == send){
                    beat.received = received;
                    beat.server = server;
                    if(multiplayer.heartbeats.length > 5){
                        multiplayer.heartbeats.shift();
                    }
                }
            }
        });


        multiplayer.socket.on('gameover', function (data) {
            menu.gameover(data);
        });
        
        multiplayer.socket.on('command', function (data) {
            var actions = data.actions.players;
            timerCountdown.timer = data.actions.meta.timer;
            
            
            //hier werden die positionen übertragen
            for(var color in actions){
                if(game[color]){
                    if(color == "red"){
                        game[color].x = actions[color].x + game.offset - (game.offset/2);
                    } else {
                        game[color].x = actions[color].x + game.offset + (game.offset/2);
                    }
                    
                    game[color].y = actions[color].y;
                    game[color].realX = actions[color].x;
                    game[color].realY = actions[color].y;
                    game[color].w = actions[color].characterinfo.w;
                    game[color].h = actions[color].characterinfo.h;
                    
                    healthgauge.healthplayers[color].hp = actions[color].characterinfo.hp;
                    healthgauge.gotHit[color] = actions[color].attack.hitstun.gotHit;
                    hypermeter.hyperplayer[color].hyper = actions[color].characterinfo.hypermeter;
                    
//                    game[color].attackRange.x = actions[color].attack.x - (actions[color].attack.w / 2);
//                    game[color].attackRange.y = actions[color].attack.y - (actions[color].attack.h / 2);
//                    
//                    if(actions[color].gotHit.damage > 0){
//                        //game[color].hp -= actions[color].gotHit.damage;
//                        game.hitAnimations.hit1.x = actions[color].gotHit.x-10;
////                        game.hitAnimations.hit1.y = actions[color].gotHit.y-20;
//                        game.hitAnimations.hit1.y = actions[color].gotHit.y+20;
//                        var animation = game.hitAnimations.hit1.animations.play('fx1', 20, false);
//                        game.hitAnimations.hit1.alpha = 1;
//                        var stillPlayer = setInterval(function(){
//                            if(!animation.isPlaying){
//                                clearTimeout(stillPlayer);
//                                game.hitAnimations.hit1.alpha = 0;
//                            }
//                        },20);
//                    }
                
                    game[color].gotHit = actions[color].attack.hitstun.gotHit;
                    game[color].blocked = actions[color].attack.block;
                    game[color].isWalking = actions[color].moving;
                    game[color].crouch = actions[color].crouch;
                    game[color].jab = actions[color].attack.jab;
                    game[color].kick = actions[color].attack.kick;
                    game[color].airhit = actions[color].attack.airhit;
                    game[color].crouchhit = actions[color].attack.crouchhit;
                    game[color].forwardhit = actions[color].attack.forwardhit;
                    game[color].backwardhit = actions[color].attack.backwardhit;
                    game[color].special1 = actions[color].attack.special1;
                    game[color].special2 = actions[color].attack.special2;
                    game[color].hyper = actions[color].attack.hyper;
                    game[color].ko = actions[color].characterinfo.ko;
                    
                    game[color].projectileExist = actions[color].attack.projectile.exist;
                    game[color].projectileX = actions[color].attack.projectile.posX;
                    game[color].projectileY = actions[color].attack.projectile.posY;
                    console.log(color, game[color].gotHit);
                    if(game[color].gotHit){
                        game[color].gotHitTimer = Date.now() + 300;
                        if(!game[color].hotHitId)
                            game[color].hotHitId = Date.now();
                    } else {
                        game[color].hotHitId = false;
                    }
                    if(game[color].jab){
                        game[color].jabTimer = Date.now() + 300; //genaue zeit wielange ein jab dauert!
                    }
                    if(game[color].forwardhit){
                        game[color].forwardhitTimer = Date.now() + 500; //genaue zeit wielange ein jab dauert!
                    }
                    if(game[color].backwardhit){
                        game[color].backwardhitTimer = Date.now() + 500;
                    }
                    if(game[color].airhit){
                        game[color].airhitTimer = Date.now() + 300; //genaue zeit wielange ein jab dauert!
                    }
                    if(game[color].crouchhit){
                        game[color].crouchhitTimer = Date.now() + 300; //genaue zeit wielange ein jab dauert!
                    }
                    if(game[color].kick){
                        game[color].kickTimer = Date.now() + 500; //genaue zeit wielange ein jab dauert!
                    }
                    if(game[color].special1){
                        game[color].special1Timer = Date.now() + 500; //genaue zeit wielange ein special dauert!
                    }
                    if(game[color].special2){
                        game[color].special2Timer = Date.now() + 500; //genaue zeit wielange ein special dauert!
                    }
                    if(game[color].hyper){
                        game[color].hyperTimer = Date.now() + 600; //genaue zeit wielange ein special dauert!
                    }
                }
            }
            

        });
    
    },
};