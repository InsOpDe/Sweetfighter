//INIT
var touchable = "createTouch" in document,
    canvas,
    ctx,
    div;
    
//CONTROL
var touches = [],
    startX,
    startY,
    coordX,
    coordY,
    leftTouchId = -1,
    active = false;
    
//GESTURES
var vectorlist = [],
    gestureStartX,
    gestureStartY,
    gestureCoordX,
    gestureCoordY,
    gestureEndX,
    gestureEndY;
    
//CONSTANTS - DO NOT CHANGE
var CONTROL_TOLERANCE = 15,
    MAX_SAVED_VECTORS = 200;

//INPUT CONTROL
var state = {left:false,right:false,moveup:false,movedown:false,hit:false};

//DEBUG
var debugLine;

function initTouchInterface(){
    canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx = canvas.getContext("2d");
    
    canvas.id = "touchInterface";
    div = document.getElementById("game-screen");
    
    div.appendChild(canvas);
    
    if(touchable){
        canvas.addEventListener("touchstart", onTouchStart);
        canvas.addEventListener("touchmove", onTouchMove);
        canvas.addEventListener("touchend", onTouchEnd);       
    }else{
        canvas.addEventListener("mousemove", onMouseMove);
    }
    
    setInterval(draw,30);
    
    //DEBUG
    var debugWindow = document.getElementById("debugWindow");
    debugLine = document.createElement("p");
    debugWindow.appendChild(debugLine);
    debugLine.innerHTML = "GESTUREDEBUG";
}

function onTouchStart(e){
    for(var i = 0; i < e.changedTouches.length; i++){
        var touch = e.changedTouches[i];
        if(leftTouchId < 0 && touch.clientX < (canvas.width/2)){
            leftTouchId = touch.identifier;
            startX = touch.clientX;
            startY = touch.clientY;
            coordX = touch.clientX;
            coordY = touch.clientY;
            active = true;
                        
            continue;
        }else{
            state["hit"] = true;
            multiplayer.sendCommand({ state: state });

            gestureStartX = touch.clientX;
            gestureStartY = touch.clientY;  
            var vector = new vector2D(gestureStartX, gestureStartY);
            vectorlist.push(vector);
                        
            continue;
        }
    }
    touches = e.touches;
}

function onTouchMove(e){
    e.preventDefault();
    for(var i = 0; i < e.changedTouches.length; i++){                    
        var touch = e.changedTouches[i];               
        if(leftTouchId === touch.identifier){
            coordX = touch.clientX;
            coordY = touch.clientY;

            var diffX = startX - coordX;
            var diffY = startY - coordY;

            if(diffX > CONTROL_TOLERANCE){
                state["left"] = true;
            } else{
                state["left"] = false;
            }

            if(diffX < -CONTROL_TOLERANCE){
                state["right"] = true;
            } else{
                state["right"] = false;
            }

            if(diffY > CONTROL_TOLERANCE){
                state["moveup"] = true;
            }else{
                state["moveup"] = false;
            } 

            if(diffY < -CONTROL_TOLERANCE){
                state["movedown"] = true;
            }else{
                state["movedown"] = false;
            }
            
            multiplayer.sendCommand({ state: state });

            continue;
        }else{
            gestureCoordX = touch.clientX;
            gestureCoordY = touch.clientY;
            var vector = new vector2D(gestureCoordX, gestureCoordY);
            vectorlist.push(vector);
                                                
            if(vectorlist.length > MAX_SAVED_VECTORS){
                vectorlist = [];
            }
                        
            continue;
        }
    }
    touches = e.touches;
}

function onTouchEnd(e){
    for(var i = 0; i < e.changedTouches.length; i++){
        var touch = e.changedTouches[i];
        if(leftTouchId === touch.identifier){
            leftTouchId = -1;
            active = false;
                        
            state["left"] = false;
            state["right"] = false;
            state["moveup"] = false;
            state["movedown"] = false;
            
            multiplayer.sendCommand({ state: state });
                        
            continue;
        }else{
            state["hit"] = false;
            
            multiplayer.sendCommand({ state: state });
                        
            gestureEndX = touch.clientX;            
            gestureEndY = touch.clientY;
                       
            var vector = new vector2D(gestureEndX, gestureEndY);
            vectorlist.push(vector);
                        
            gestureHandler();
                        
            vectorlist = [];
                        
            continue;
        }
    }
    touches = e.touches;
}

function onMouseMove(){
    coordX = event.offsetX;
    coordY = event.offsetY;
    //TODO
}

function draw(){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    if(touchable){
        for(var i = 0; i < touches.length; i++){
            var touch = touches[i];
            if(leftTouchId === touch.identifier){
                if(active === true){
                    ctx.beginPath();
                    ctx.strokeStyle = "red";
                    ctx.lineWidth = 5;
                    ctx.arc(startX,startY,20,0,2*Math.PI);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.strokeStyle = "red";
                    ctx.lineWidth = 5;
                    ctx.arc(coordX,coordY,40,0,2*Math.PI);
                    ctx.stroke();
                }
            } else{ 
                ctx.beginPath();
                ctx.strokeStyle = "red";
                ctx.lineWidth = 5;
                ctx.arc(touch.clientX,touch.clientY,40,0,2*Math.PI);
                ctx.stroke();
            }
        }
    }
}