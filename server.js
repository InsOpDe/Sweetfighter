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

var clients = {};    
var intervalTimer = 50;
var controls = {};
var characterAttributes = {x:0,y:0,hp:100,jumping:false,w:120,h:380,crouch:false,velocityY:0,attack:{jab:false, kick:false},moving:false};
var character = [];
    character["blue"] = extend({},characterAttributes)
    character["red"] = extend({},characterAttributes)
var options;

// Websocket
io.sockets.on('connection', function (socket) {
    console.log(timeStamp() + " connection established");
    clients[socket.id] = socket;
    socket.controls = [];
    var slot = "observer"
    if(team.length > 0){
        slot = team[team.length-1];
        team.pop();
    }
    

    // der Client ist verbunden
    socket.emit('chat', { tick: new Date(), text: 'Du bist nun mit dem Server verbunden!' });

    socket.emit('chat', { tick: new Date(), text: 'Du bist Spieler: '+slot });
    console.log("Player "+slot+" joined");
    
    // options an client schicken
    options = {
        mapX : 700, //1500
        mapY : 400,
        playerStartDelta : 100,
        color : slot,
        
    }
    
    character["blue"].start = character["blue"].x = options.playerStartDelta;
    character["red"].start = character["red"].x = options.mapX - options.playerStartDelta;
    character["blue"].y=character["red"].y= options.mapY;
//    console.log(JSON.stringify(character));
    options.characters = {"red" : character["red"] , "blue" : character["blue"]};
    socket.emit('gameOptions', options );
    

    //disconnect old Player if new Player (same Team) logs in elsewhere
    for(var socketId in player){
        if(player[socketId].color == slot){
            clients[socketId].disconnect();
            delete player[socketId]
        }
    }
    player[socket.id] = {};
    player[socket.id].color = slot;
    if(slot != "observer") controls[player[socket.id].color] = { left:false , right:false , moveup:false , movedown:false};
    



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
    socket.on('command', function (data) {
//           var action = data.action;
        if(slot != "observer"){
            controls[player[socket.id].color] = data.state ;
        }
       
       
    });
    
      
    //disconnect
    socket.on('disconnect', function(){
        team.push(player[socket.id].color);
        console.log("Player "+player[socket.id].color+" disconnected ("+socket.id+")");
        delete player[socket.id]

    });

});

// main physics loop on server
var physicsloop = setInterval(function(){
    //check which buttons are pressed
    handleCommand();
    handleCollision();
},15)

//updateloop
var updateloop = setInterval(function(){
    var update = {red: character["red"], blue: character["blue"]};
//    update["red"] = {x : character["red"].x , y : character["red"].y }
//    update["blue"] = {x : character["blue"].x , y : character["blue"].y }
    io.sockets.emit('command', { tick: new Date(), actions : update });
},45)


// Portnummer in die Konsole schreiben
console.log('Der Server läuft nun auf dem Port ' + conf.port);

var movementSpeed = 5;
var hitSpeed = 1;
var gravityAccelerationY = 1;
var jumpHeightSquared = -25;
var minJumpHeight = ( jumpHeightSquared / 3 )
function handleCommand(){
    for(var p in controls){
        var playerCommands = controls[p];
        var p1 = character[p];
        var p2 = (p == "red")? character["blue"] : character["red"];
        
        if(playerCommands.left){
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
        } else if (playerCommands.right){
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
        
        if(playerCommands.moveup){
            if(!p1.jump) {
                p1.velocityY = jumpHeightSquared;
                p1.jump = true;
            }
        } else {
            if(p1.velocityY < minJumpHeight){
                p1.velocityY = minJumpHeight;
            } else {
                if (playerCommands.movedown) {
                    p1.crouch=true;
                } else {
                    p1.crouch=false;
                }
            }
        }
        
        
        
        if(playerCommands.hit){
//            console.log(p);
            p1.attack.jab = true;
        } else {
            p1.attack.jab = false;
        }
        
        if(playerCommands.kick){
            p1.attack.kick = true;
        } else {
            p1.attack.kick = false;
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
    for (var p in color){
        
        var p1 = character[color[p]];
        var p2 = (color[p] == "red")? character["blue"] : character["red"];
//        console.log(p1.x,p2.x,p1.w,p2.w);

        //detect whether characters bounce into each other
        if (p1.x + (p1.w/2) > p2.x - (p2.w/2) && p1.x - (p1.w/2) < p2.x + (p2.w/2)){
//            console.log(timeStamp()," collision!");
//            if(controls[color[p]])
        }

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