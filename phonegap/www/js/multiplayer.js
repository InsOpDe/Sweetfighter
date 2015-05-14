var multiplayer = {
    init:function(){
        multiplayer.socket = io.connect(serverIP);

        chat.run();
        multiplayer.run();  
        

    },
    socket:null,
    timestamp:new Date().valueOf(),
    sendCommand:function(details){
        multiplayer.socket.emit('command', details );
    },
    
    run:function(){
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
                    game[color].crouch = actions[color].crouch
                    game[color].jab = actions[color].attack.jab
                    game[color].isWalking = actions[color].moving
                    game[color].kick = actions[color].attack.kick;
                    if(game[color].jab){
                        game[color].jabTimer = Date.now() + 200; //genaue zeit wielange ein jab dauert!
                    }
                    if(game[color].kick){
                        game[color].kickTimer = Date.now() + 200; //genaue zeit wielange ein jab dauert!
                    }
                }
            }
            

        });
    
    },
};