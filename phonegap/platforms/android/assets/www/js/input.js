var keyboard = {
    state : { left:false , right:false , moveup:false , movedown:false, hit:false, kick:false},
    player : { blue:{} , red:{} },
    init: function() {
        
        var keyboardInput = $(window);
        
        keyboardInput.keydown(function(ev) {
//            console.log("key pressed: ", ev.which);
//            multiplayer.socket.emit('command', { action : ev.which } );
            
            if (ev.which == 37)
            {
                keyboard.state["left"] = true;
            }
            else if (ev.which == 39)
            {
                keyboard.state["right"] = true;
            }

            if (ev.which == 38)
            {
                keyboard.state["moveup"] = true;
            }
            else if (ev.which == 40)
            {
                keyboard.state["movedown"] = true;
            }
            
            //spacebar jab
            if (ev.which == 32) {
                keyboard.state["hit"] = true;
            }
            //return kick
            if (ev.which == 13) {
                keyboard.state["kick"] = true;
            }
            multiplayer.sendCommand({ state: keyboard.state });

        });
        
        keyboardInput.keyup(function(ev) {
            
            if (ev.which == 37)
            {
                keyboard.state["left"] = false;
            }
            else if (ev.which == 39)
            {
                keyboard.state["right"] = false;
            }

            if (ev.which == 38)
            {
                keyboard.state["moveup"] = false;
            }
            else if (ev.which == 40)
            {
                keyboard.state["movedown"] = false;
            }
            
            if (ev.which == 32) {
                keyboard.state["hit"] = false;
                
            }
            
            if (ev.which == 13) {
                keyboard.state["kick"] = false;
                
            }
            
            multiplayer.sendCommand({ state: keyboard.state });

        });

    },
};





