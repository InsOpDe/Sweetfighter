var debug = {
	debugModeOn : true,
	
	init : function(){
		var debugWindow = document.getElementById("debugWindow");
		
		if(!debug.debugModeOn){
			debugWindow.style.display = "none";
		}

		debugKeys = document.createElement("p");
		debugKeys2 = document.createElement("p");
		pFrames = document.createElement("p");

		
		
		fps = [];
		fpsTemp = 0;
		fpsdelta = 0;
		fpsPerSecond = 0;
		fpsCounter = 0;
		fpsAverage = 0;
		
		debugWindow.appendChild(debugKeys);
		debugWindow.appendChild(debugKeys2);
		debugWindow.appendChild(pFrames);

	},
	
	run : function(){
		
		debugKeys.innerHTML = "Controls: " + JSON.stringify(keyboard.player["red"]);
//		debugKeys.innerHTML = "Controls: " + JSON.stringify(keyboard.state);
		debugKeys2.innerHTML = "Controls: " + JSON.stringify(keyboard.player["blue"]);
                pFrames.innerHTML = "FPS: " + debug.requestAnimFrame();
		
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