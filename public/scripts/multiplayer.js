var multiplayer = {
    init:function(){
        multiplayer.socket = io.connect();

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
                    game[color].x = actions[color].x
                    game[color].y = actions[color].y
                    game[color].crouch = actions[color].crouch
                }
            }
            

        });
    
    },
};