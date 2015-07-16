var debug = false;


var express = require('express')
,   app = express()
,   server = require('http').createServer(app)
,   io = require('socket.io').listen(server)
,   conf = require('./config.json')
,   team = ['blue','red']
,   color = ['blue','red']
,   player = []
,   fs = require('fs');

// Webserver
// auf den Port x schalten
server.listen(conf.port);

app.use(express.static(__dirname + '/phonegap/www'));
app.get('/', function (req, res) {
	// so wird die Datei index.html ausgegeben
	res.sendfile(__dirname + '/phonegap/www/index.html');
});

app.get('/cordova.js', function (req, res) {
	console.log("cordova.js");
	res.sendfile(__dirname + '/cordova.js');
});

//lobby
var lc = 0;
var lobby = [];

var assignQueue = [];

var clients = {};    
var intervalTimer = 50;
var controls = {};
var characterAttributes = {x:0,y:0,hp:100,hypermeter:0,jumping:false,w:120,h:380,crouch:false,velocityY:0,attack:{timer:0,jab:false, kick:false},moving:false,gotHit:{x:0,y:0,damage:0}};



// Websocket
io.sockets.on('connection', function (socket) {
    console.log(timeStamp() + " connection established");
    clients[socket.id] = socket;
    player[socket.id] = {};
    
    //Init commands
    socket.on('init', function (data) {
        socket.controls = [];
        player[socket.id].socketId = socket.id;
        
        
        //assignQueue
        //TODO: get Player name via db
        player[socket.id].character = data.character ;
        player[socket.id].map = data.map ;
        assignQueue.push(player[socket.id]);

       
    });
    

    // wenn ein Benutzer einen Text senden
    socket.on('chat', function (data) {
            var cur = new Date();
            // so wird dieser Text an alle anderen Benutzer gesendet
            io.sockets.emit('chat', { tick: cur, player: data.name || 'Anonym', text: data.text });
            console.log( 
                    "["+ (cur.getHours()<10?'0'+cur.getHours():cur.getHours())
                    +":"+(cur.getMinutes()<10?'0'+cur.getMinutes():cur.getMinutes())
                    +":"+(cur.getSeconds()<10?'0'+cur.getSeconds():cur.getSeconds()) 
                    +"] " +(data.name || 'Anonym') + ": " + data.text );
    });
    
    
    //Processing commands
    socket.on('heartbeat', function (data) {
        var time = Date.now();
        player[socket.id].heartbeat = time;
        data.server = time;
//        console.log(JSON.stringify(data));
        socket.volatile.emit('heartbeat', data );
    });
        
    //Processing commands
    socket.on('command', function (data) {
//           var action = data.action;
        controls[socket.id] = data.state ;
       
       
    });
    

    //disconnect
    socket.on('disconnect', function(){
        
        //function wird rausgenommen, weil wir jetzt lobbys haben        
//        team.push(player[socket.id].color);


        console.log("Player "+player[socket.id].color+" disconnected ("+socket.id+") from Lobby " + player[socket.id].lobby);
        delete player[socket.id]
    });

});


// assigns players together
var assignloop = setInterval(function(){
    if(assignQueue.length > 1){
        
        for(var i in assignQueue){
            var playerA = assignQueue[i];
            for(var j in assignQueue){
                var playerB = assignQueue[j];
                if(i != j){
                    //TODO nur zuordnen wenn rankings etc stimmen
                    assignToLobby(playerA.socketId);
                    assignToLobby(playerB.socketId);
                    assignQueue.splice(i,1)
                    var index = assignQueue.indexOf(playerB);
                    assignQueue.splice(index,1)

                }
            }
        }
    }
},1000)



// main physics loop on server
var physicsloop = setInterval(function(){
    //check which buttons are pressed
    handleAttackTimings();
    handleCommand();
    handleCollision();
},15)

//updateloop
var updateloop = setInterval(function(){
    for(var i in lobby){
//        if(typeof clients == 'undefined');
//            break;
        if(!lobby[i].options)
            break;
        var characterRed = lobby[i].red;
        var characterBlue = lobby[i].blue;
        
        var gameTimer = lobby[i].options.timerObj;
        var hypermeter = lobby[i].options.hypermeterObj;
    
        var update = {players:{red: characterRed, blue: characterBlue}, meta:{timer: gameTimer.timer}};
        
        gameTimer.update();
        hypermeter.update(characterRed, characterBlue);
        
    //    update["red"] = {x : character["red"].x , y : character["red"].y }
    //    update["blue"] = {x : character["blue"].x , y : character["blue"].y }
//        io.sockets.emit('command', { tick: new Date(), actions : update });
        clients[lobby[i].red.sid].volatile.emit('command', { tick: new Date(), actions : update });
        clients[lobby[i].blue.sid].volatile.emit('command', { tick: new Date(), actions : update });

        resetVals(lobby[i]);
    }
},15)


// Portnummer in die Konsole schreiben
console.log('Der Server läuft nun auf dem Port ' + conf.port);



function handleAttackTimings(){
//    for (var p in color){
//        var p1 = character[color[p]];
//        var c1 = controls[p];
//        if(p1.attack.jab){
//            p1.attack.timer = Date.now()+300;
//            
//            console.log("jab");
//        }
//    }
}


var movementSpeed = 5;
var hitSpeed = 1;
var gravityAccelerationY = 1;
var jumpHeightSquared = -25;
var minJumpHeight = ( jumpHeightSquared / 3 )
function handleCommand(){
    for(var p in controls){

        //if lobby isnt full yet
        if(typeof player[p] == 'undefined')
            continue;
        var lob = player[p].lobby;
        if(typeof lob == 'undefined' || !lobby[lob].options)
            continue;
        
        var col = player[p].color;
        var options = lobby[lob].options
//        console.log(lobby[lob]);
        var c1 = controls[p];
        var p1 = lobby[lob][col];
        var p2 = (col == "red")? lobby[lob]["blue"] : lobby[lob]["red"];
        var vz = (p1.x > p2.x)? -1 : 1;
        
        if(c1.left){
            if(p1.x - movementSpeed >= (p1.w / 2)){
                if (p1.x - movementSpeed + (p1.w/2) > p2.x - (p2.w/2) && p1.x - movementSpeed - (p1.w/2) < p2.x + (p2.w/2)){
                    var slowerMovementSpeed = movementSpeed * .5;
                    if(p2.x - slowerMovementSpeed >= (p1.w / 2)){
                        p1.x -= slowerMovementSpeed;
                        p2.x -= slowerMovementSpeed;
                    }
                } else {
                    p1.x -= movementSpeed;
                    p1.moving = true;
                }
            }
        } else if (c1.right){
            if(p1.x + movementSpeed <= (options.mapX) - (p1.w / 2)){
                 if (p1.x + movementSpeed + (p1.w/2) > p2.x - (p2.w/2) && p1.x + movementSpeed - (p1.w/2) < p2.x + (p2.w/2)){
                    var slowerMovementSpeed = movementSpeed * .5;
                    if(p2.x + slowerMovementSpeed <= (options.mapX) - (p1.w / 2)){
                        p1.x += slowerMovementSpeed;
                        p2.x += slowerMovementSpeed;
                    }
                } else {
                    p1.x += movementSpeed;
                    p1.moving = true;
                }
            }
        } else {
            p1.moving = false;
        }
        
        if(c1.moveup){
            if(!p1.jump) {
                p1.velocityY = jumpHeightSquared;
                p1.jump = true;
            }
        } else {
            if(p1.velocityY < minJumpHeight){
                p1.velocityY = minJumpHeight;
            } else {
                if (c1.movedown) {
                    p1.crouch=true;
                } else {
                    p1.crouch=false;
                }
            }
        }
        
        
        
        if(c1.hit){
           if(Date.now() > p1.attack.timer){
                p1.attack.timer = Date.now()+400;
                p1.attack.jab = true;
                p1.attack.attacking = true;
                p1.attack.x = p1.x+vz*(p1.w/1)
                p1.attack.y = p1.y-(p1.h/1.3)
                p1.attack.w = 40;
                p1.attack.h = 40;
//                console.log("jab");
           }
            
        } else {
            p1.attack.attacking = false;
            p1.attack.jab = false;
        }
        
        if(c1.kick){
            p1.attack.kick = true;
        } else {
            p1.attack.kick = false;
        }
        if(c1.special1){
            p1.attack.special1 = true;
        } else {
            p1.attack.special1 = false;
        }
        if(c1.special2){
            p1.attack.special2 = true;
        } else {
            p1.attack.special2 = false;
        }
        if(c1.hyper){
            p1.attack.hyper = true;
        } else {
            p1.attack.hyper = false;
        }

        p1.velocityY += gravityAccelerationY ;
        p1.y += p1.velocityY ;
        if (p1.y > options.mapY) {
            p1.y = options.mapY;
            p1.jump = false;
            p1.velocityY = 0;
            
        }
        
        
    }
}

function handleCollision(){
    for(var lob in lobby){
        for (var p in color){
        
            var p1 = lobby[lob][color[p]];
            var p2 = (color[p] == "red")? lobby[lob]["blue"] : lobby[lob]["red"];

    //        console.log(p1.x,p2.x,p1.w,p2.w);

            //detect whether characters can hit each other
            if (p1.attack.attacking && p1.attack.x + (p1.attack.w/2) > p2.x - (p2.w/2) && p1.attack.x - (p1.attack.w/2) < p2.x + (p2.w/2)){
                p2.gotHit.x = p1.attack.x - (p1.attack.w/2);
                p2.gotHit.y = p1.attack.y - (p1.attack.h/2);
                p2.gotHit.damage = 7;
                p2.hp -= p2.gotHit.damage;
                
                if(p2.hp < 0){
                    p2.hp = 0;
                }

                if(p1.hypermeter <= 95){
                    p1.hypermeter = p1.hypermeter + 5;
                } else{
                    p1.hypermeter = 100;
                }
            }

        }
    }

}


function resetVals(lob){
    for (var p in color){
//        console.log(lob,lobby);
        var p1 = lob[color[p]];
        p1.gotHit.damage = 0;
        p1.attack.jab = false;
        p1.attack.kick = false;
        p1.attack.attacking = false;
    }
}


/**
 * Return a timestamp with the format "m/d/yy h:MM:ss TT"
 * @type {Date}
 */
 
function timeStamp() {
// Create a date object with the current time
  var now = new Date();
 
// Create an array with the current month, day and time
  var date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];
 
// Create an array with the current hour, minute and second
  var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
 
// Determine AM or PM suffix based on the hour
  var suffix = ( time[0] < 12 ) ? "AM" : "PM";
 
// Convert hour from military time
//  time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;
 
// If hour is 0, set it to 12
//  time[0] = time[0] || 12;
 
// If seconds and minutes are less than 10, add a zero
  for ( var i = 1; i < 3; i++ ) {
    if ( time[i] < 10 ) {
      time[i] = "0" + time[i];
    }
  }
 
// Return the formatted string
//  return date.join("/") + " " + time.join(":") + " " + suffix;
  return time.join(":");
}

function extend(){
    for(var i=1; i<arguments.length; i++)
        for(var key in arguments[i])
            if(arguments[i].hasOwnProperty(key))
                arguments[0][key] = JSON.parse(JSON.stringify(arguments[i][key]));
    return arguments[0];
}

//Timer object to create countdowntimers in each lobby
function timerHandler(){
    var timer;
    var prevTime;
    var enabled;

    this.timer = 99;
    this.prevTime = new Date();
    this.enabled = true;

    this.update = function(){
        if(this.enabled && this.timer > 0){
                var curTime = new Date();
                if(curTime.getTime() - this.prevTime.getTime() >= 1000){
                        this.timer--;
                        this.prevTime = curTime;
                }
        } else{
                this.enabled = false;
        }
    };
}

//Hypermeter object which handles the basic hypermeter intervals for each player in each lobby
function hypermeterHandler(){
    var prevTime;
    var enabled;
    
    this.prevTime = new Date();
    this.enabled = true;
    
    this.update = function(characterRed, characterBlue){
        if(this.enabled){
            var curTime = new Date();
            if(curTime.getTime() - this.prevTime.getTime() >= 1000){   
                if(characterRed.hypermeter < 100){
                    characterRed.hypermeter++;
                }
                if(characterBlue.hypermeter < 100){
                    characterBlue.hypermeter++;
                }
                    
                this.prevTime = curTime;
            }
        }
    };
}

function assignToLobby(socketId) {
    
    var socket = clients[socketId];
    
    var slot = "observer";
    
    if(team.length > 0){
        //lobby
        if(team.length > 1){
            var character = [];
            character["blue"] = extend({},characterAttributes);
            character["red"] = extend({},characterAttributes);
            lobby[lc] = {blue:character["blue"],red:character["red"]};
        }

        slot = team[team.length-1];
        team.pop();
        lobby[lc][slot].sid = socket.id;
//        lobby[lc].sockets = {};
//        lobby[lc].sockets[slot] = socket;

        if(team.length == 0){
            var notifyPlayers = lc;
        }
    } else {


        //neue lobby
        var character = [];
            character["blue"] = extend({},characterAttributes)
            character["red"] = extend({},characterAttributes)
        lobby[++lc] = {blue:character["blue"],red:character["red"]}

        team = ['blue','red']
        slot = team[team.length-1];
        team.pop();
        lobby[lc][slot].sid = socket.id;
    }
    
    
        // der Client ist verbunden
        socket.emit('chat', { tick: new Date(), text: 'Du bist nun mit dem Server verbunden!' });

        socket.emit('chat', { tick: new Date(), text: 'Du bist Spieler: '+slot });
        console.log("Player "+slot+"("+ socket.id +") joined Lobby " + lc);

        if(!(typeof notifyPlayers == "undefined")){
            var lC = notifyPlayers;
            // options an client schicken
            var options = {
                mapX : 900, //1500
                mapY : 400,
                playerStartDelta : 100,
                color : slot
            };
            
            var gameTimer = new timerHandler();
            var hypermeter = new hypermeterHandler();

            lobby[lC].options = {mapX : options.mapX, mapY:options.mapY};
            lobby[lC].options.timerObj = gameTimer;
            lobby[lC].options.hypermeterObj = hypermeter;

            var characterRed = lobby[lC].red;
            var characterBlue = lobby[lC].blue;
           
            characterBlue.start = characterBlue.x = options.playerStartDelta;
            characterRed.start = characterRed.x = options.mapX - options.playerStartDelta;
            characterBlue.y=characterRed.y= options.mapY;
            characterBlue.lobby=characterRed.lobby= lC;

    //      if(lobby[1])console.log(lobby[0].red.lobby,lobby[1].red.lobby,lC);
    //        else console.log(lobby[0].red.lobby,lC);

            options.characters = {"red" : characterBlue , "blue" : characterBlue};
            for(var i in lobby[lC]){
                if( i == 'options')
                    continue;
                var sid = lobby[lC][i].sid;
    //            console.log("player " + i + " in Lobby " + lc + " has been sent the gameOptions");
    //            console.log(sid);
                options.color = i;
                
                clients[sid].emit('gameOptions', options );
            }
            console.log("Lobby " + lC + " starts Playing");

            if(slot != "observer") controls[socket.id] = { left:false , right:false , moveup:false , movedown:false};
        }


        
        player[socket.id].color = slot;
        player[socket.id].lobby = lc;
}