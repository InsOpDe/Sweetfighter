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

// Websocket
io.sockets.on('connection', function (socket) {
        clients[socket.id] = socket;
        socket.controls = [];
        
        // der Client ist verbunden
	socket.emit('chat', { tick: new Date(), text: 'Du bist nun mit dem Server verbunden!' });
        
        socket.emit('chat', { tick: new Date(), text: 'Du bist Spieler: '+team[team.length-1] });
        console.log("Player "+team[team.length-1]+" joined");
        socket.emit('gameOptions', { team: team[team.length-1] });

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
           var action = data.action;
//           console.lo
//            console.log(player[socket.id]);
            controls[player[socket.id].color] = data.state ;
//           socket.controls[action] = data.state ;
           
//           console.log('command received: ' + action);
//           console.log('command received: ' + JSON.parse(action));
//           io.sockets.emit('command', { tick: new Date(), player: player[socket.id] , action : action });
           
        });
    
      
    //disconnect
    socket.on('disconnect', function(){
//        if(player[socket.id]){
            
            //siehe paar zeilenweiter oben
            team.push(player[socket.id].color);
//        }
        console.log("Player "+player[socket.id].color+" disconnected ("+socket.id+")");
        delete player[socket.id]

    });

});

//var controls = { left:false , right:false , moveup:false , movedown:false};
var gameloop = setInterval(function(){
//    console.log(player);
//    console.log("+++++" + player[socket.id]);
//    console.log(socket.controls );
//        for (var action in socket.controls){
//            if (socket.controls[action] == true) {
//                console.log('command received: ' + action);
//                io.sockets.emit('command', { tick: new Date(), player: player[socket.id] , action : action , state : true });
//            } else {
//                io.sockets.emit('command', { tick: new Date(), player: player[socket.id] , action : action , state : false });
//            }
//        }
//    for (var a in player){
//        for (var action in player[a].controls){
//            controls[action] = player[a].controls[action];
//        }
//    }
//    console.log(controls);
    io.sockets.emit('command', { tick: new Date(), actions : controls });
},50)


// Portnummer in die Konsole schreiben
console.log('Der Server läuft nun auf dem Port ' + conf.port);