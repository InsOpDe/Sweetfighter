var debug = false;


var express = require('express')
,   app = express()
,   server = require('http').createServer(app)
,   io = require('socket.io').listen(server)
,   conf = require('./config.json')
,   team = ['blue','red']
,   player = []
,   fs = require('fs');

//locally required
var ressources = require('./ressources');

// Webserver
// auf den Port x schalten
server.listen(conf.port);

app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
	// so wird die Datei index.html ausgegeben
	res.sendfile(__dirname + '/public/index.html');
});

var clients = {};    
var intervalTimer = 50;
var controls = {};
var character = [];
    character["blue"] = {x:0,y:0,hp:100,jumping:false,width:26,velocityY:0};
    character["red"] = {x:0,y:0,hp:100,jumping:false,width:26,velocityY:0};
var options;

// Websocket
io.sockets.on('connection', function (socket) {
    
    clients[socket.id] = socket;
    socket.controls = [];

    // der Client ist verbunden
    socket.emit('chat', { tick: new Date(), text: 'Du bist nun mit dem Server verbunden!' });

    socket.emit('chat', { tick: new Date(), text: 'Du bist Spieler: '+team[team.length-1] });
    console.log("Player "+team[team.length-1]+" joined");
    
    // options an client schicken
    options = {
        //mapX : 800,
        //mapY : 600,
        mapX : 2000,
        mapY : 400,
        player1 : team[team.length-1],
        playerStartDelta : 100,
    }
    
    options.player1start = character["blue"].x = options.playerStartDelta;
    options.player2start = character["red"].x = options.mapX - options.playerStartDelta;
    character["blue"].y=character["red"].y= options.mapY;
    socket.emit('gameOptions', options );
    

    //disconnect old Player if new Player (same Team) logs in elsewhere
    for(var socketId in player){
        if(player[socketId].color == team[team.length-1]){
            clients[socketId].disconnect();
            delete player[socketId]
        }
    }
    player[socket.id] = {};
    player[socket.id].color = team[team.length-1];
    controls[player[socket.id].color] = { left:false , right:false , moveup:false , movedown:false};
    team.pop();



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
       controls[player[socket.id].color] = data.state ;
       
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

},15)

//updateloop
var updateloop = setInterval(function(){
    var update = {};
    update["red"] = {x : character["red"].x , y : character["red"].y }
    update["blue"] = {x : character["blue"].x , y : character["blue"].y }
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
        if(playerCommands.left){
            if(character[p].x - movementSpeed >= 0){
                character[p].x -= movementSpeed;
            }
        } else if (playerCommands.right){
            if(character[p].x + movementSpeed <= (options.mapX-character[p].width)){
                character[p].x += movementSpeed;
            }
        }
        
        if(playerCommands.moveup){
            if(!character[p].jump) {
                character[p].velocityY = jumpHeightSquared;
                character[p].jump = true;
            }
        } else {
            if(character[p].velocityY < minJumpHeight){
                character[p].velocityY = minJumpHeight;
            }
        }
        
        if(playerCommands.hit){
                character[p].x -= hitSpeed;
        }

        character[p].velocityY += gravityAccelerationY ;
        character[p].y += character[p].velocityY ;
        if (character[p].y > options.mapY) {
            character[p].y = options.mapY;
            character[p].jump = false;
            character[p].velocityY = 0;
            
        }
        
        
    }
   
}