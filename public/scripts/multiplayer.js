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
//            console.log(data);
//            chat.display(data);
            var actions = data.actions;
//            console.log( actions['blue'] );
//            console.log( actions['red']  );
            
//            for (var action in keyboard.state){
//                if(actions['blue'])keyboard.state[action] = actions['blue'][action];
//                if(actions['red'])keyboard.state[action] = actions['red'][action];
//            }
            keyboard.player['blue'] = actions['blue']
            keyboard.player['red'] = actions['red']
//            console.log(keyboard.state );
//            if(actions['blue'])keyboard.state = actions['blue'];
//            else if(actions['red'])keyboard.state = actions['red'];
            
//            keyboard.state[action]=data.state;

            
        });
    
    }
};