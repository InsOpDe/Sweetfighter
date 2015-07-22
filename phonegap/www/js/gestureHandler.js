//CONSTANTS - DO NOT CHANGE
var LINE_TOLERANCE = 20,
    SWIPE_TOLERANCE = 100,
    SPIKE_CHECK_TOLERANCE = 20,
    SPIKE_X_DIFF = 50,
    SPIKE_Y_DIFF = 50,
    SPIKE_COORD_CHECK = 10,
    CIRCLE_CHECK_TOL = 25,
    CIRCLE_RAD_TOL = 30,
    CIRCLE_ANGLE = 340;
    
//INPUT GESTURES
var swipeR = false;
    swipeL = false,
    specialA = false,
    specialB = false,
    hyper = false;

function gestureHandler(){
    swipeHandler();
    spikeHandler();
    circleHandler();
    
    debugLine.innerHTML = "SLEFT:" + swipeL + " SRIGHT:" + swipeR + " ^:" + specialB + " V:" + specialA + " Circle:" + hyper;
}

function swipeHandler(){
    swipeR = false;
    swipeL = false;
    
    var len = vectorlist.length;
    var line = false;
    
    for(var i=0;i<len;i++){
        if(vectorlist[i].y > gestureStartY+LINE_TOLERANCE || vectorlist[i].y < gestureStartY-LINE_TOLERANCE){
            line = false;
            break;
        }else{
            line = true;
        }
    }
                
    if(line === true){
        if(gestureStartX - gestureEndX <= -SWIPE_TOLERANCE){
            swipeR = true;
        }
        if(gestureStartX - gestureEndX >= SWIPE_TOLERANCE){
            swipeL = true;
        }
    }
}

function spikeHandler(){
    specialA = false;
    specialB = false;
    
    var len = vectorlist.length;
    
    //V gesture
    if(len > SPIKE_CHECK_TOLERANCE){
        if(gestureStartX-gestureEndX > SPIKE_X_DIFF || gestureStartX-gestureEndX < -SPIKE_X_DIFF){
            if(gestureStartY - gestureEndY <= SPIKE_Y_DIFF && gestureStartY - gestureEndY >= -SPIKE_Y_DIFF){
                var inclined = false,
                    ascend = false,
                    prevYCoord = vectorlist[0].y,
                    i = 1;
            
                for(i;i<SPIKE_COORD_CHECK;i++){
                    if(vectorlist[i].y < prevYCoord){
                        inclined = false;
                        break;
                    }else{
                        inclined = true;
                    }
                    prevYCoord = vectorlist[i].y;
                }

                if(inclined === true){
                    prevYCoord = vectorlist[i].y;
                    i += 1;
                    for(i;i<len;i++){
                        if(vectorlist[i].y < prevYCoord){
                            ascend = true;
                            break;
                        }
                        prevYCoord = vectorlist[i].y;
                    }
                    if(ascend === true){
                        prevYCoord = vectorlist[i].y;
                        i += 1;
                        for(i;i<len;i++){
                            if(vectorlist[i].y > prevYCoord){
                                specialA = false;
                                break;
                            }else{
                                specialA = true;
                            }
                            prevYCoord = vectorlist[i].y;
                        }
                    }
                }
            }
        }
    }
                
    //^ gesture
    if(len > SPIKE_CHECK_TOLERANCE){
        if(gestureStartX-gestureEndX > SPIKE_X_DIFF || gestureStartX-gestureEndX < -SPIKE_X_DIFF){
            if(gestureStartY - gestureEndY <= SPIKE_Y_DIFF && gestureStartY - gestureEndY >= -SPIKE_Y_DIFF){
                var inclined = false,
                ascend = false,
                prevYCoord = vectorlist[0].y,
                i = 1;
                
                for(i;i<SPIKE_COORD_CHECK;i++){
                    if(vectorlist[i].y > prevYCoord){
                        ascend = false;
                        break;
                    } else{
                        ascend = true;
                    }
                    prevYCoord = vectorlist[i].y;
                }

                if(ascend === true){
                    prevYCoord = vectorlist[i].y;
                    i += 1;
                    for(i;i<len;i++){
                        if(vectorlist[i].y > prevYCoord){
                            inclined = true;
                            break;
                        }
                        prevYCoord = vectorlist[i].y;
                    }
                    if(inclined === true){
                        prevYCoord = vectorlist[i].y;
                        i += 1;
                        for(i;i<len;i++){
                            if(vectorlist[i].y < prevYCoord){
                               specialB = false;
                               break;
                            } else{
                                specialB = true;
                            }
                         prevYCoord = vectorlist[i].y;
                        }
                    }
                }
            }
        }
    }
}

function circleHandler(){
    hyper = false;
    
    var len = vectorlist.length;
    var circle = false;
    
    if(len > CIRCLE_CHECK_TOL){
        var leftMax = vectorlist[0];
        var rightMax = vectorlist[0];
        var topMax = vectorlist[0];
        var bottomMax = vectorlist[0];
        var curVec;

        for(var i=1; i<len;i++){
            curVec = vectorlist[i];

            if(curVec.x < leftMax.x){
                leftMax = curVec;
            } else if (curVec.x > rightMax.x){
                rightMax = curVec;
            }

            if(curVec.y < topMax.y){
                topMax = curVec;
            } else if (curVec.y > bottomMax.y){
                bottomMax = curVec;
            }
        }

        //Calculate approximate center
        var centerA = new vector2D ((leftMax.x + rightMax.x)/2,(leftMax.y + rightMax.y)/2);
        var centerB = new vector2D ((topMax.x + bottomMax.x)/2,(topMax.y + bottomMax.y)/2);
        var approxCenter = new vector2D ((centerA.x + centerB.x)/2,(centerA.y + centerB.y)/2);

        //Check average radius
        var radA = Math.sqrt((leftMax.x - approxCenter.x)*(leftMax.x - approxCenter.x) + (leftMax.y - approxCenter.y)*(leftMax.y - approxCenter.y));
        var radB = Math.sqrt((rightMax.x - approxCenter.x)*(rightMax.x - approxCenter.x) + (rightMax.y - approxCenter.y)*(rightMax.y - approxCenter.y));
        var radC = Math.sqrt((topMax.x - approxCenter.x)*(topMax.x - approxCenter.x) + (topMax.y - approxCenter.y)*(topMax.y - approxCenter.y));
        var radD = Math.sqrt((bottomMax.x - approxCenter.x)*(bottomMax.x - approxCenter.x) + (bottomMax.y - approxCenter.y)*(bottomMax.y - approxCenter.y));

        var approxRadius = (radA+radB+radC+radD) / 4;

        for(var i=0;i<len;i++){
            var rad = Math.sqrt((vectorlist[i].x - approxCenter.x)*(vectorlist[i].x - approxCenter.x) + (vectorlist[i].y - approxCenter.y)*(vectorlist[i].y - approxCenter.y));

            if(rad > approxRadius+CIRCLE_RAD_TOL || rad < approxRadius-CIRCLE_RAD_TOL){
                circle = false;
                break;
            } else{
                circle = true;
            }
        }

        if(circle === true){
            //Check 360° movement
            var preVec = new vector2D(vectorlist[0].x - approxCenter.x, vectorlist[0].y - approxCenter.y);
            //var angle;

            var angle = 0;

            for(var i=1; i<len;i++){
                var vec = new vector2D(vectorlist[i].x - approxCenter.x, vectorlist[i].y - approxCenter.y);

                var value = Math.min(1,(preVec.x*vec.x + preVec.y*vec.y) / (Math.sqrt(preVec.x*preVec.x + preVec.y*preVec.y) * Math.sqrt(vec.x*vec.x + vec.y*vec.y)));

                angle += Math.acos(value);

                preVec = vec;
            }

            angle = angle * 180/Math.PI;

            if(angle >= CIRCLE_ANGLE){
                hyper = true;
            } else{
                hyper = false;
            }
        }   
    }                
}