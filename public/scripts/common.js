//setup for animations
(function() {
    var lastTime = 0;
    var vendors = ['ms', ';', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; x++) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
                window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() {
                callback(currTime + timeToCall);
            },
                    timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };

}
());

var defSettings = {gridSize:64,grid:false,ressources:false,zoom:0};
var settings = ["zoom","grid","ressources","gridSize"];
function setSettingsCookie (key, value) {
    var settings = readCookie("settings")
    if(settings == ''){
        settings = defSettings;
    } else {
        settings = JSON.parse(settings);
    }
    settings[key] = value;
    settings = JSON.stringify(settings);
    document.cookie = "settings="+settings;
}

function resetSettingsCookie () {
    document.cookie = "settings="+JSON.stringify(defSettings);
}

function getSettingsCookie (key) {
    var settings = readCookie("settings")
    if(settings == ''){
        settings = defSettings;
    } else {
        settings = JSON.parse(settings);
    }
    return settings[key];
}

function readCookie(cookieName) {
 var re = new RegExp('[; ]'+cookieName+'=([^\\s;]*)');
 var sMatch = (' '+document.cookie).match(re);
 if (cookieName && sMatch) return unescape(sMatch[1]);
return '';
}


var PIXIloader = {
    loadSelectedAsset: function( type , name , spriteObject ){
        var sprites = [];
        if(type=="buildings"){
            if(name=="mine"){
                sprites.push(game.getOutline(spriteObject, 2));
            }
            buildings.list[name].selector = sprites;
        }
        
        return sprites;
    },
    loadAsset: function( type , name ) {

              var assetsToLoader = [ "images/"+type+"/"+name+".json" ];
                var pixiLoader = new PIXI.AssetLoader(assetsToLoader);
                //pixiLoader.onComplete = onAssetsLoaded();

                pixiLoader.onComplete = onAssetsLoaded
               
                pixiLoader.load();
                var sprites = [];
                if( name == "mine" || name == "bigenergy" || name == "bigfac" ){ //TODO ganz schrecklich, automatisieren!
                    for(var i = 0; i<11;i++){
                        sprites.push(name+"-"+i);
                    }
                } else if( type == "aircraft" || (type == "buildings" && name == "gun-turret") || type == "vehicles" ) {
                    for(var i = 0; i<8;i++){
                        sprites.push(name+"-"+i);
                    }
                    if( type == "aircraft" ){
                        for(var i = 0; i<8;i++){
                            sprites.push(name+"_shadow-"+i);
                        }
                    }
                } else if ( type == "projectiles" )  {
                    for(var i = 0; i<5;i++){
                            sprites.push(name+"-"+i);
                        }
                }else  if ( type == "buildings" ) {
                    sprites.push(name+"-"+0);
                } else   {
                    sprites.push(name);
                }
//                 console.log(sprites);
                //game.testVehicleSprites = ["assault-0", "assault-1", "assault-2", "assault-3", "assault-4", "assault-5", "assault-6", "assault-7"];
                
                function onAssetsLoaded()
                {
//                   if(type=="buildings") console.log(buildings.list,buildings.list[name]);
//                    console.log(type , name, sprites, sprites[0]);
//                    var spriteObject = PIXI.Sprite.fromFrame(sprites[ 0 ]);
//                    var spriteObject = PIXI.Sprite.fromFrame(item.spriteSheet[ (item.direction + 8) ]);
//                     if(type=="buildings") buildings.list[name].selector = []
//                     PIXIloader.loadSelectedAsset( type , name , spriteObject );
//                     var selectionSprite = PIXIloader.loadSelectedAsset( type , name , spriteObject );
//                     if(type=="buildings") console.log(selectionSprite,spriteObject);
//                     if(type=="buildings") buildings.list[name].selector.push( selectionSprite );
//                     if(type=="buildings") console.log(buildings.list[name].selector);
//                    if(name=="areaSelection"){
//                        console.log("area");
//                        game.sspriteObject = PIXI.Sprite.fromFrame(mapgui.list.areaSelection.spriteSheet[ 0 ]);
//                        //game.sspriteObject.setTexture(PIXI.Texture.fromFrame(mapgui.list.areaSelectionSmall.spriteSheet[ 0 ]));
//                        game.fgContainer.addChild(game.sspriteObject);
//                    }

//                    if(name=="cannon-ball"){
//                        console.log("cannon-ball",sprites);
//                        game.sspriteObject = PIXI.Sprite.fromFrame(sprites[ 3 ]);
//                        console.log("cannon-ball");
//                        //game.sspriteObject.setTexture(PIXI.Texture.fromFrame(mapgui.list.areaSelectionSmall.spriteSheet[ 0 ]));
//                        game.fgContainer.addChild(game.sspriteObject);
//                    }
                      
//                    var frameName = game.testVehicleSprites[1];
//                    game.testVehicle = PIXI.Sprite.fromFrame(frameName);
//                    
//                    
//                    game.testVehicle.position.x = 300;
//                    game.testVehicle.position.y = 300;
//                    game.fgContainer.addChild(game.testVehicle);
                    game.superloader = true;
                    //console.log(sprites);
                    //callback(sprites);
                    
                }
                return sprites;
            
              //END TEST
    
    }
};

function loadItem(name) {
    if(typeof this.list[name] === 'object')
        var item = this.list[name];
    
   
   
     //item aus db laden
    if (!item) {
         
        multiplayer.socket.emit ('getMapReq', {item: name});

        (multiplayer.socket.on ('getMapReqSuc', function (data) {
//            console.log(name, data.data.name);
            
            //hier is verwirrend wegen tausend callbacks,
            //deswegen check ich hier ob ich im richtigen gelandet bin ;D
            if(name!=data.data.name){
                return;
            }
                
            item = data.data;
            
            if (item.spriteArray) {
                return;
            }
            
            item.spriteSheet = loader.loadImage('images/' + this.defaults.type + '/' + item.name + '.png');
            
            
            if(this.defaults.type == 'vehicles' ||  this.defaults.type == 'aircraft' ||  this.defaults.type == 'buildings') {
                item.spriteSheet = PIXIloader.loadAsset(this.defaults.type,item.name);
//                item.selectedSpritesheet = PIXIloader.loadSelectedAsset(this.defaults.type,item.name);
            }
            
//            console.log(item.spriteSheet);
            item.spriteArray = [];
            item.spriteCount = 0;
//            console.log(item.name, item.spriteImages, item.spriteImages.length);
//            for (var i = 0; i < item.spriteImages[0].count; i++) {
            for (var i = 0; i < item.spriteImages.length; i++) {
                var constructImageCount = item.spriteImages[i].count;
                //HIER GIBTS VLL N PROBLEM ATTENTION WIP TODO
                var constructDirectionCount = item.spriteImages[i].directions;
                if (constructDirectionCount) {
                    for (var j = 0; j < constructDirectionCount; j++) {
                        var constructImageName = item.spriteImages[i].name + "-" + j;
                        item.spriteArray[constructImageName] = {
                            name: constructImageName,
                            count: constructImageCount,
                            offset: item.spriteCount
                        };
                        item.spriteCount += constructImageCount;
                    }
                    ;
                } else {
                    var constructImageName = item.spriteImages[i].name;
                    item.spriteArray[constructImageName] = {
                        name: constructImageName,
                        count: constructImageCount,
                        offset: item.spriteCount
                    };
                    item.spriteCount += constructImageCount;
                }
            }
//            console.log(item);
            //closure shit
            this.list[item.name] = item;
            game.itemsLoaded++;
        }.bind(this)));

    } else {
        if (item.spriteArray) {
            return;
        }
        item.spriteSheet = loader.loadImage('images/' + this.defaults.type + '/' + name + '.png');
        //if(this.defaults.type == 'vehicles' ||  this.defaults.type == 'aircraft' ||  this.defaults.type == 'buildings') {
            item.spriteSheet = PIXIloader.loadAsset(this.defaults.type,item.name);
//            item.selectedSpritesheet = PIXIloader.loadSelectedAsset(this.defaults.type,item.name);
        //}
//        console.log(item.spriteSheet)
        item.spriteArray = [];
        item.spriteCount = 0;
        for (var i = 0; i < item.spriteImages.length; i++) {
            var constructImageCount = item.spriteImages[i].count;

            var constructDirectionCount = item.spriteImages[i].directions;
            if (constructDirectionCount) {
                for (var j = 0; j < constructDirectionCount; j++) {
                    var constructImageName = item.spriteImages[i].name + "-" + j;
                    item.spriteArray[constructImageName] = {
                        name: constructImageName,
                        count: constructImageCount,
                        offset: item.spriteCount
                    };
                    item.spriteCount += constructImageCount;
                }
                ;
            } else {
                var constructImageName = item.spriteImages[i].name;
                item.spriteArray[constructImageName] = {
                    name: constructImageName,
                    count: constructImageCount,
                    offset: item.spriteCount
                };
                item.spriteCount += constructImageCount;
            }
        }
        game.itemsLoaded++;
    }
    
}

/*The default add() method used by all our game entities*/
function addItem(details) {
    var item = {};
    var name = details.name;
    $.extend(item, this.defaults);
    $.extend(item, this.list[name]);
    item.life = item.hitpoints;
    $.extend(item, details);
    return item;
}


/* Common functions for turning and movement */

// Finds the angle between two objects in terms of a direction (where 0 <= angle < directions)
function findAngle(object, unit, directions) {
//    var dy = (object.y) - (unit.y);
//    var dx = (object.x) - (unit.x);
    var direction;
    if (object.x > unit.x) {
        if (object.y > unit.y) {
            direction = 3;
        } else if (object.y < unit.y) {
            direction = 1;
        } else {
            direction = 2;
        }
    } else if (object.x < unit.x) {
        if (object.y > unit.y) {
            direction = 5;
        } else if (object.y < unit.y) {
            direction = 7;
        } else {
            direction = 6;
        }
    } else if (object.y > unit.y) {
        direction = 4;
    } else if (object.x == unit.x
            && object.y == unit.y) {
        direction = unit.newDirection;
    } else {
        direction = 0;
    }
    return direction;
    //Convert Arctan to value between (0 - directions)


//    var angle = wrapDirection(directions/2-(Math.atan2(dx,dy)*directions/(2*Math.PI)),directions);//console.log(angle);
//    return angle;
}

// returns the smallest difference (value ranging between -directions/2 
// to + directions/2). between two angles (where 0 <= angle < directions)
function angleDiff(angle1, angle2, directions) {
    if (angle1 >= directions / 2) {
        angle1 = angle1 - directions;
    }
    if (angle2 >= directions / 2) {
        angle2 = angle2 - directions;
    }

    var diff = angle2 - angle1;

    if (diff < -directions / 2) {
        diff += directions;
    }
    if (diff > directions / 2) {
        diff -= directions;
    }

    return diff;
}

//Wrap value of direction so that it lies between 0 and directions-1
function wrapDirection(direction, directions) {
    if (direction < 0) {
        direction += directions;
    }
    if (direction >= directions) {
        direction -= directions;
    }

    return direction;
}

//For projectiles: finding angle ToDo
function findFiringAngle(target, source, directions) {
    var dy = (target.y) - (source.y);
    var dx = (target.x) - (source.x);
    if (target.type == "buildings") {
        dy += target.baseWidth / 2 / game.gridSize;
        dx += target.baseHeight / 2 / game.gridSize;
    } else if (target.type == "aircraft") {//todo
        dx += 0.5;
        dy += 0.5;
    } else if(target.type == "vehicles"){
        dx += 0.5;
        dy += 0.5;
//        dy += game.gridSize / 2 / game.gridSize;
//        dx += game.gridSize / 2 / game.gridSize;
    }
    
    if (source.type == "buildings") {
        dy -= source.baseWidth / 2 / game.gridSize;
        dx -= source.baseHeight / 2 / game.gridSize;
    } else if (source.type == "aircraft") {
        dy -= 0.5;
        dx -= 0.5;
    } else if(target.type == "vehicles"){
        dy -= 0.5;
        dx -= 0.5;
    }
    
    //Convert Arctan to value between (0 – 7)
    var angle = wrapDirection(directions / 2 - (Math.atan2(dx, dy) * directions / (2 * Math.PI)), directions);
    return angle;
}



// Common Functions related to combat
function isValidTarget(item) {
    return item.team != this.team &&
            (this.canAttackLand && (item.type == "buildings" || item.type == "vehicles") ||
                    (this.canAttackAir && (item.type == "aircraft")));
}
function findTargetsInSight(increment) {
    if (!increment) {
        increment = 0;
    }
    var targets = [];
    for (var i = game.items.length - 1; i >= 0; i--) {
        var item = game.items[i];
        if (this.isValidTarget(item)) {
            if (Math.pow(item.x - this.x, 2) + Math.pow(item.y - this.y, 2) < Math.pow(this.
                    range + increment, 2)) { //ATTENTION war mal sight is jetzt range
                targets.push(item);
            }
        }
    }
    ;
// Sort targets based on distance from attacker
    var attacker = this;
    targets.sort(function(a, b) {
        return (Math.pow(a.x - attacker.x, 2) + Math.pow(a.y - attacker.y, 2)) - (Math.pow(b.x - attacker.x, 2)
                + Math.pow(b.y - attacker.y, 2));
    });
    return targets;
};
function isTargetInRange(prey){
    var attacker = this;
    return ((Math.pow(prey.x - attacker.x, 2) +
                            Math.pow(prey.y - attacker.y, 2)) < Math.pow(attacker.range, 2));
};

function colorNameToHex(color)
{
    var colors = {"aliceblue":"f0f8ff","antiquewhite":"faebd7","aqua":"00ffff","aquamarine":"7fffd4","azure":"f0ffff",
    "beige":"f5f5dc","bisque":"ffe4c4","black":"000000","blanchedalmond":"ffebcd","blue":"0000ff","blueviolet":"8a2be2","brown":"a52a2a","burlywood":"deb887",
    "cadetblue":"5f9ea0","chartreuse":"7fff00","chocolate":"d2691e","coral":"ff7f50","cornflowerblue":"6495ed","cornsilk":"fff8dc","crimson":"dc143c","cyan":"00ffff",
    "darkblue":"00008b","darkcyan":"008b8b","darkgoldenrod":"b8860b","darkgray":"a9a9a9","darkgreen":"006400","darkkhaki":"bdb76b","darkmagenta":"8b008b","darkolivegreen":"556b2f",
    "darkorange":"ff8c00","darkorchid":"9932cc","darkred":"8b0000","darksalmon":"e9967a","darkseagreen":"8fbc8f","darkslateblue":"483d8b","darkslategray":"2f4f4f","darkturquoise":"00ced1",
    "darkviolet":"9400d3","deeppink":"ff1493","deepskyblue":"00bfff","dimgray":"696969","dodgerblue":"1e90ff",
    "firebrick":"b22222","floralwhite":"fffaf0","forestgreen":"228b22","fuchsia":"ff00ff",
    "gainsboro":"dcdcdc","ghostwhite":"f8f8ff","gold":"ffd700","goldenrod":"daa520","gray":"808080","green":"008000","greenyellow":"adff2f",
    "honeydew":"f0fff0","hotpink":"ff69b4",
    "indianred ":"cd5c5c","indigo":"4b0082","ivory":"fffff0","khaki":"f0e68c",
    "lavender":"e6e6fa","lavenderblush":"fff0f5","lawngreen":"7cfc00","lemonchiffon":"fffacd","lightblue":"add8e6","lightcoral":"f08080","lightcyan":"e0ffff","lightgoldenrodyellow":"fafad2",
    "lightgrey":"d3d3d3","lightgreen":"90ee90","lightpink":"ffb6c1","lightsalmon":"ffa07a","lightseagreen":"20b2aa","lightskyblue":"87cefa","lightslategray":"778899","lightsteelblue":"b0c4de",
    "lightyellow":"ffffe0","lime":"00ff00","limegreen":"32cd32","linen":"faf0e6",
    "magenta":"ff00ff","maroon":"800000","mediumaquamarine":"66cdaa","mediumblue":"0000cd","mediumorchid":"ba55d3","mediumpurple":"9370d8","mediumseagreen":"3cb371","mediumslateblue":"7b68ee",
    "mediumspringgreen":"00fa9a","mediumturquoise":"48d1cc","mediumvioletred":"c71585","midnightblue":"191970","mintcream":"f5fffa","mistyrose":"ffe4e1","moccasin":"ffe4b5",
    "navajowhite":"ffdead","navy":"000080",
    "oldlace":"fdf5e6","olive":"808000","olivedrab":"6b8e23","orange":"ffa500","orangered":"ff4500","orchid":"da70d6",
    "palegoldenrod":"eee8aa","palegreen":"98fb98","paleturquoise":"afeeee","palevioletred":"d87093","papayawhip":"ffefd5","peachpuff":"ffdab9","peru":"cd853f","pink":"ffc0cb","plum":"dda0dd","powderblue":"b0e0e6","purple":"800080",
    "red":"ff0000","rosybrown":"bc8f8f","royalblue":"4169e1",
    "saddlebrown":"8b4513","salmon":"fa8072","sandybrown":"f4a460","seagreen":"2e8b57","seashell":"fff5ee","sienna":"a0522d","silver":"c0c0c0","skyblue":"87ceeb","slateblue":"6a5acd","slategray":"708090","snow":"fffafa","springgreen":"00ff7f","steelblue":"4682b4",
    "tan":"d2b48c","teal":"008080","thistle":"d8bfd8","tomato":"ff6347","turquoise":"40e0d0",
    "violet":"ee82ee",
    "wheat":"f5deb3","white":"ffffff","whitesmoke":"f5f5f5",
    "yellow":"ffff00","yellowgreen":"9acd32"};

    if (typeof colors[color.toLowerCase()] != 'undefined')
        return colors[color.toLowerCase()];

    return false;
}

console.save = function(data, filename){

    if(!data) {
        console.error('Console.save: No data')
        return;
    }

    if(!filename) filename = 'console.json'

    if(typeof data === "object"){
        data = JSON.stringify(data, undefined, 4)
    }

    var blob = new Blob([data], {type: 'text/json'}),
        e    = document.createEvent('MouseEvents'),
        a    = document.createElement('a')

    a.download = filename
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)
 }
 
 
 
 