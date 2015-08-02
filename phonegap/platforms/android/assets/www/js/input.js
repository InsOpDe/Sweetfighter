var keyboard = {
    state : { left:false , right:false , moveup:false , movedown:false, hit:false, kick:false},
    player : { blue:{} , red:{} },
    block : false,
    init: function() {
        
        var keyboardInput = $(window);
        
        keyboardInput.keydown(function(ev) {
            if(keyboard.block)
                return;
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
            //q special1
            if (ev.which == 81) {
                keyboard.state["special1"] = true;
            }
            //w special2
            if (ev.which == 87) {
                keyboard.state["special2"] = true;
            }
            //e hyper
            if (ev.which == 69) {
                keyboard.state["hyper"] = true;
            }
            if(ev.which == 89){
                keyboard.state["mode"] = true;
            }
            if(ev.which == 79){
                keyboard.state["dashL"] = true;
            }
            if(ev.which == 80){
                keyboard.state["dashR"] = true;
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
            
            if (ev.which == 81) {
                keyboard.state["special1"] = false;
            }
             //w special2
            if (ev.which == 87) {
                keyboard.state["special2"] = false;
            }
            //e hyper
            if (ev.which == 69) {
                keyboard.state["hyper"] = false;
            }
            if(ev.which == 89){
                keyboard.state["mode"] = false;
            }
            if(ev.which == 79){
                keyboard.state["dashL"] = false;
            }
            if(ev.which == 80){
                keyboard.state["dashR"] = false;
            }
            multiplayer.sendCommand({ state: keyboard.state });

        });

    }
};





