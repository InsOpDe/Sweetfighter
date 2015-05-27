var multiplayer = {
    init:function(){
        multiplayer.socket = io.connect(serverIP);

        chat.run();
        multiplayer.run();  
        

    },
    socket:null,
    lastHeartbeat: [],
    heartbeats: [],
    timestamp:new Date().valueOf(),
    sendCommand:function(details){
        var time = Date.now();
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
            console.log(data);
            for(var i in multiplayer.heartbeats){
                var beat = multiplayer.heartbeats[i];
                console.log(beat.send == send,beat.send,send);
                if(beat.send == send){
                    beat.received = received;
                    beat.server = server;
                    if(multiplayer.heartbeats.length > 5){
                        multiplayer.heartbeats.shift();
                    }
                }
            }
        });
        
        
        multiplayer.socket.on('command', function (data) {
            var actions = data.actions;
            
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
                    game[color].w = actions[color].w;
                    game[color].h = actions[color].h;
                    
                    
                    game[color].attackRange.x = actions[color].attack.x - (actions[color].attack.w / 2);
                    game[color].attackRange.y = actions[color].attack.y - (actions[color].attack.h / 2);
                    
                    if(actions[color].gotHit.damage > 0){
                        game[color].hp -= actions[color].gotHit.damage;
                        game.hitAnimations.hit1.x = actions[color].gotHit.x-10;
                        game.hitAnimations.hit1.y = actions[color].gotHit.y-20;
                        var animation = game.hitAnimations.hit1.animations.play('fx1', 20, false);
                        game.hitAnimations.hit1.alpha = 1;
                        var stillPlayer = setInterval(function(){
                            if(!animation.isPlaying){
                                clearTimeout(stillPlayer);
                                game.hitAnimations.hit1.alpha = 0;
                            }
                        },20);
                    }
                    
                    game[color].crouch = actions[color].crouch
                    game[color].jab = actions[color].attack.jab
                    game[color].isWalking = actions[color].moving
                    game[color].kick = actions[color].attack.kick;
                    if(game[color].jab){
                        game[color].jabTimer = Date.now() + 180; //genaue zeit wielange ein jab dauert!
//                        attackTimer = Date.now() + 500;
                    }
                    if(game[color].kick){
                        game[color].kickTimer = Date.now() + 200; //genaue zeit wielange ein jab dauert!
                    }
                }
            }
            

        });
    
    },
};