var debug = {
	debugModeOn : true,
	
	init : function(){
		var debugWindow = document.getElementById("debugWindow");
		
		if(!debug.debugModeOn){
			debugWindow.style.display = "none";
		}

		debugKeys = document.createElement("p");
		debugPlayerRed = document.createElement("p");
		debugPlayerBlue = document.createElement("p");
		debugPlayerBlueHp = document.createElement("p");
		debugPlayerRedHp = document.createElement("p");

		pFrames = document.createElement("p");
		debugPing = document.createElement("p");

		
		
		fps = [];
		fpsTemp = 0;
		fpsdelta = 0;
		fpsPerSecond = 0;
		fpsCounter = 0;
		fpsAverage = 0;
		
		debugWindow.appendChild(debugKeys);
		debugWindow.appendChild(debugPlayerRed);
		debugWindow.appendChild(debugPlayerBlue);
		debugWindow.appendChild(pFrames);
		debugWindow.appendChild(debugPing);
		debugWindow.appendChild(debugPlayerBlueHp);
		debugWindow.appendChild(debugPlayerRedHp);

	},
	
	run : function(){
		
		debugKeys.innerHTML = JSON.stringify(keyboard.state);
		debugPlayerRed.innerHTML = "Pos Red " + "x: " + Math.round(game.red.realX) + " "  + "y: " + Math.round(game.red.realY) + " " + "anim: " + game["red"].animations.currentAnim.name;
		debugPlayerBlue.innerHTML = "Pos Blue " + "x: " + Math.round(game.blue.realX) + " "  + "y: " + Math.round(game.blue.realY) + " " + "anim: " + game["blue"].animations.currentAnim.name;;
//		debugKeys.innerHTML = "Controls: " + JSON.stringify(keyboard.state);
//		debugKeys2.innerHTML = "Controls: " + JSON.stringify(keyboard.player["blue"]);
                pFrames.innerHTML = "FPS: " + debug.requestAnimFrame();
                debugPing.innerHTML = "Ping: " + debug.pingCalc() + " (" + debug.pingCalc("toServer") + " + " + debug.pingCalc("fromServer") +")";
                debugPlayerBlueHp.innerHTML = "blue: " + debug.hitpoints("blue");
                debugPlayerRedHp.innerHTML = "red: &nbsp;" + debug.hitpoints("red");
		
	},
        
        hitpoints : function(color){
//            if(!game[color].hp) return "";
            var hp = "";
            for(var i = 0; i < game[color].hp; i=i+2){
                hp += "|";
            }
            return hp;
        },
        
        pingCalc : function(string){
            var sum = 0;
            var diff = 6182;
            for(var i in multiplayer.heartbeats){
                var beat = multiplayer.heartbeats[i];
                if(string == "toServer"){
                    sum += Math.abs(beat.send - beat.server);
                    sum -= diff;
                } else if(string == "fromServer"){
                    sum += Math.abs(beat.server - beat.received);
                    sum -= diff;
                } else {
                    sum += Math.abs(beat.send - beat.received);
                }
                
            }
            
            return (Math.round((sum/multiplayer.heartbeats.length)*10))/10;
        },

	
	requestAnimFrame : function(){
		if(!fpsTemp){
			fpsTemp = new Date().getTime();
			fps[fpsCounter++] = 0;
			return;
		}
		fpsdelta = ( new Date().getTime() - fpsTemp ) / 1000;
		if(new Date().getTime() - fpsPerSecond > 200){
			fps[fpsCounter++] = 1/fpsdelta;
			if(fpsCounter>=10){ fpsCounter=0; };
			
			var sum = 0;
			for(var i = 0; i < fps.length; i++){
			
				sum += parseInt(fps[i],10)
			}
			fpsAverage = sum/fps.length;
			fpsPerSecond = new Date().getTime(); 
		}
		fpsTemp = new Date().getTime(); 
		return fpsAverage;
	},
	
};