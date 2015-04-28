var keyboard = {
    state : { left:false , right:false , moveup:false , movedown:false},
    player : { blue:{} , red:{} },
    init: function() {
        var keyboardInput = $(window);
        
        keyboardInput.keydown(function(ev) {
//            console.log("key pressed: ", ev.which);
//            multiplayer.socket.emit('command', { action : ev.which } );
            
            if (ev.which == 37)
            {
                keyboard.state["left"] = true;
//                multiplayer.sendCommand({ action : "left" , state: true });
    //            game.sprite.body.moveLeft(400);
            }
            else if (ev.which == 39)
            {
                keyboard.state["right"] = true;
//                multiplayer.sendCommand({ action : "right" , state: true });
    //            game.sprite.body.moveRight(400);
            }

            if (ev.which == 38)
            {
                keyboard.state["moveup"] = true;
//                multiplayer.sendCommand({ action : "moveup" , state: true });
    //            game.sprite.body.moveUp(400);
            }
            else if (ev.which == 40)
            {
                keyboard.state["movedown"] = true;
//                multiplayer.sendCommand({ action : "movedown" , state: true });
    //            game.sprite.body.moveDown(400);
            }
            multiplayer.sendCommand({ action : "movedown" , state: keyboard.state });

        });
        
        keyboardInput.keyup(function(ev) {
            
            if (ev.which == 37)
            {
                keyboard.state["left"] = false;
//                multiplayer.sendCommand({ action : "left" , state: false });
            }
            else if (ev.which == 39)
            {
                keyboard.state["right"] = false;
//                multiplayer.sendCommand({ action : "right" , state: false });
            }

            if (ev.which == 38)
            {
                keyboard.state["moveup"] = false;
//                multiplayer.sendCommand({ action : "moveup" , state: false });
            }
            else if (ev.which == 40)
            {
                keyboard.state["movedown"] = false;
//                multiplayer.sendCommand({ action : "movedown" , state: false });
            }
            
            multiplayer.sendCommand({ action : "movedown" , state: keyboard.state });

        });

    },
};





