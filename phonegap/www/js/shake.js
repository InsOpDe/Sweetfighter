//INIT
var deviceMotion = window.DeviceMotionEvent,
    prevX,
    prevY,
    prevZ,
    prevTime;

//INPUT
var comboBreak = false;

//CONSTANTS - DO NOT CHANGE
var TIME_INTERVAL = 1000, 
    SHAKE_TOLERANCE = 15;
    
//DEBUG
var debugShake;

function initShake(){
    if(deviceMotion){
        prevX = null;
        prevY = null;
        prevZ = null;
        prevTime = new Date();
        
        window.addEventListener('devicemotion', shakeHandler, false);
        
        //DEBUG
        var debugWindow = document.getElementById("debugWindow");
        debugShake = document.createElement("p");
        debugWindow.appendChild(debugShake);
        debugShake.innerHTML = "Shake:" + comboBreak;
    }
}

function removeShake(){
    if(deviceMotion){
        window.removeEventListener('devicemotion', shakeHandler, false);
    }
}

function shakeHandler(e){
    var acceleration = e.accelerationIncludingGravity;
    var diffX;
    var diffY;
    var diffZ;
    
    //Init coordinates
    if(prevX === null && prevY === null && prevZ === null){
        prevX = acceleration.x;
        prevY = acceleration.y;
        prevZ = acceleration.z;
        
        return;
    }
    
    diffX = Math.abs(prevX - acceleration.x);
    diffY = Math.abs(prevY - acceleration.y);
    diffZ = Math.abs(prevZ - acceleration.z);
    
    if(diffX > SHAKE_TOLERANCE || diffY > SHAKE_TOLERANCE || diffZ > SHAKE_TOLERANCE){
        var curTime = new Date();
        
        if(curTime.getTime() - prevTime.getTime() > TIME_INTERVAL){
            comboBreak = true;
            prevTime = curTime;
            //DEBUG
            setTimeout(function(){comboBreak = false;}, 3000);
        }
    }
    
    prevX = acceleration.x;
    prevY = acceleration.y;
    prevZ = acceleration.z;
    
    debugShake.innerHTML = "Shake:" + comboBreak;
}