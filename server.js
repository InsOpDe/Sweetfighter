var debug = false;


var express = require('express')
,   app = express()
,   server = require('http').createServer(app)
,   io = require('socket.io').listen(server)
,   couchbase = require('couchbase')
,   cluster = new couchbase.Cluster()
,   model = cluster.openBucket('streetfighter')
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


/**
 * gets from db
 */
var getDb = function (name, fnct) {
    model.get(name, function(err, result) {
        if(err) console.error(err)
        else if(fnct) fnct(result.value);
    });   
}



/**
 * sets data in db
 */
var setDb = function (name,data,fnct) {
    model.upsert(name,data, function(err, result) {
        if(err) console.error(err)
        else if(fnct) fnct(result);
    });
}

//lobby
var lc = 0;
var lobby = [];

var assignQueue = [];

var clients = {};    
var intervalTimer = 50;
var controls = {};

// Websocket
io.sockets.on('connection', function (socket) {
    console.log(timeStamp() + " connection established");
    clients[socket.id] = socket;
    player[socket.id] = {};
    
    socket.on('login', function (data) {
        var name = data.name;
        var pass = data.pass;
        getDb('user',function(dbdata){
            var error = false;
            if (dbdata.hasOwnProperty(name)){
                if (dbdata[name].pass === pass){
                    player[socket.id].user = {name:dbdata[name].user, elo:dbdata[name].elo}
                } else {
                    error = true;
                }
            } else {
                error = true;
            }
            
            socket.emit('login', error );
        });
    });
    
    socket.on('ranking', function () {
        getDb('user',function(users){
            var user = [];
            for(var i in users){
                var userObj = users[i];
                user.push({
                           name: userObj.user,
                           elo: userObj.elo,
                           favChar: userObj.favChar,
                        });
            }
            user.sort(function(a,b){ return a.elo<b.elo})
                
            socket.emit('ranking', user );
        });
    });
    
    //Init commands
    socket.on('init', function (data) {

        if(!player[socket.id].hasOwnProperty('user')){
            console.log("da wollte wer n spiel starten ohne anmeldung!");
            return;
        }
            
        socket.controls = [];
        player[socket.id].socketId = socket.id;
        
        
        //assignQueue
        //TODO: get Player name via db
        console.log("init: " + data.character);
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
                    assignQueue.splice(i,1);
                    var index = assignQueue.indexOf(playerB);
                    assignQueue.splice(index,1);

                }
            }
        }
    }
},1000);



// main physics loop on server
var physicsloop = setInterval(function(){
    handleCommand();
    handleHitstun();
},15);

//updateloop
var updateloop = setInterval(function(){
    for(var i in lobby){
        if(!lobby[i].options)
            break;
        var characterRed = lobby[i].red;
        var characterBlue = lobby[i].blue;
        
        var gameTimer = lobby[i].options.timerObj;
        var hypermeter = lobby[i].options.hypermeterObj;
    
        var update = {players:{red: characterRed, blue: characterBlue}, meta:{timer: gameTimer.timer}};
        
        gameTimer.update();
        hypermeter.update(characterRed, characterBlue);
        
        clients[lobby[i].red.sid].volatile.emit('command', { tick: new Date(), actions : update });
        clients[lobby[i].blue.sid].volatile.emit('command', { tick: new Date(), actions : update });

        //resetVals(lobby[i]);
    }
},15);


function endGame(p1,p2) {

    reCalculateElo(p1,p2);

}


function reCalculateElo(p1,p2) {
    var elo1 = p1.user.elo;
    var elo2 = p2.user.elo;
    var k = 20;
    console.log(p1.user,p2.user);

    
    if  (p1.user.won === true){
        console.log("p1");
        if(elo1>=elo2){
            console.log(">");
            var EA = 1 / (1+Math.pow(10,(elo1-elo2)/400));

            elo1 = elo1 + k*(1-(1-EA));
            elo2 = elo2 + k*(0-EA);
        } else {
            console.log("<");
            var EA = 1 / (1+Math.pow(10,(elo1-elo2)/400));
            EA *= -1;
            //console.log(EA,1 / (1+Math.pow(10,(elo1-elo2)/400)));
            elo2 = elo2 + k*(1-(1-EA));
            elo1 = elo1 + k*(0-EA);
        }

    } else {
        //hier springt der nie rein
        console.log("p2");
        var EA = 1 / (1+Math.pow(10,(elo1-elo2)/400));
        elo1 = elo1 + k*(1-(1-EA));
        elo2 = elo2 + k*(0-EA);
    }
    p1.user.diff = Math.ceil(elo1) - p1.user.elo;
    p2.user.diff = Math.ceil(elo2) - p2.user.elo;
    p1.user.elo = Math.ceil(elo1);
    p2.user.elo = Math.ceil(elo2);
    console.log(p1.user,p2.user);
    
    getDb('user',function(users){
        var usersArr = [];
        for(var i in users){
            var user = users[i];
            if(user.user == p1.user.name){
                user.elo = p1.user.elo;
            } else if (user.user == p2.user.name){
                user.elo = p2.user.elo;
            }

            usersArr.push({name: user.user,
                elo: user.elo})
        }



        setDb('user',users)

        usersArr.sort(function(a,b){ return a.elo<b.elo});
        for(var i in usersArr){
            if(usersArr[i].name == p1.user.name){
                p1.user.rank = (i*1)+1;
            } else if (usersArr[i].name == p2.user.name){
                p2.user.rank = (i*1)+1;
            }
        }


        clients[p1.socketId].emit('gameover', {won:p1.user.won,diff:p1.user.diff,elo:p1.user.elo, rank:p1.user.rank});
        clients[p2.socketId].emit('gameover', {won:p2.user.won,diff:p2.user.diff,elo:p2.user.elo, rank:p2.user.rank});

        lobby.splice(lobby.indexOf(p1.lobby),1);
        //delete clients[p1.socketId];
        //delete clients[p2.socketId];
        //delete player[p1.socketId];
        //delete player[p2.socketId];
        delete controls[p1.socketId];
        delete controls[p2.socketId];
        //player.splice(player.indexOf(p1.socketId),1);
        //player.splice(player.indexOf(p2.socketId),1);

    })

}


//get character Attributes from server
var characterAttributes;
getDb('character',function(characters){
    characterAttributes = characters;
});

// Portnummer in die Konsole schreiben
console.log('Der Server läuft nun auf dem Port ' + conf.port);

//FOLLOWING ARE INPUT- AND HITBOXHANDLER

var movementSpeed = 5;
var hitSpeed = 1;
var gravityAccelerationY = 1;
var jumpHeightSquared = -25;
var minJumpHeight = ( jumpHeightSquared / 3 );
function handleCommand(){
    for(var p in controls){
        //if lobby isnt full yet
        if(typeof player[p] === 'undefined')
            continue;
        var lob = player[p].lobby;
        if(typeof lob === 'undefined' || !lobby[lob]  || !lobby[lob].hasOwnProperty("options"))
            continue;
        
        var col = player[p].color;
        var options = lobby[lob].options;

        var c1 = controls[p];
        var p1 = lobby[lob][col];
        var p2 = (col === "red")? lobby[lob]["blue"] : lobby[lob]["red"];
        var c2 = controls[p2.sid];
        
        if(!p1.hitstun.gotHit){
        
            if(c1.left){
                if(!p1.jump){
                    if(!c1.movedown){
                        if(!c1.hit){
                            if(!p1.attack.block){
                                if(p1.x - movementSpeed >= p1.w/2 + 20){
                                    if(p1.x < p2.x){
                                        p1.x -= movementSpeed;
                                        p1.moving = true;
                                    } 
                                    else if(p1.x - p1.w/2 > p2.x + p2.w/2 - 20){
                                        p1.x -= movementSpeed;
                                        p1.moving = true;
                                    } else if(p1.x - p1.w/2 === p2.x + p2.w/2 - 20){
                                        //console.log("Collide");
                                        if(!c2.movedown){
                                            handlePush(p1,p2,"left",movementSpeed,"collide");
                                        }
                                    }
                                } else if(p1.x - movementSpeed < p1.w/2 + 20){
                                    p1.x = p1.w/2 + 20;
                                    p1.moving = true;
                                }
                            }
                        }
                    }
                } else if(p1.jump){
                    if(p1.x - movementSpeed >= p1.w/2 + 20){
                        if(p1.x < p2.x){
                            p1.x -= movementSpeed;
                            p1.moving = true;
                        } 
                        else if(p1.x - p1.w/2 > p2.x + p2.w/2 - 20){
                            p1.x -= movementSpeed;
                            p1.moving = true;
                        }
                    }
                }
            } else if(c1.right){
                if(!p1.jump){
                    if(!c1.movedown){
                        if(!c1.hit){
                            if(!p1.attack.block){
                                if(p1.x + movementSpeed <= (options.mapX) - (p1.w / 2) - 20){
                                    if(p1.x > p2.x){
                                        p1.x += movementSpeed;
                                        p1.moving = true;
                                    } 
                                    else if(p1.x + p1.w/2 < p2.x - p2.w/2 + 20){
                                        p1.x += movementSpeed;
                                        p1.moving = true;
                                    } else if(p1.x + p1.w/2 === p2.x - p2.w/2 + 20){
                                        //console.log("Collide");
                                        if(!c2.movedown){
                                            handlePush(p1,p2,"right",movementSpeed,"collide");
                                        }
                                    }                    
                                } else if(p1.x + movementSpeed > (options.mapX) - (p1.w / 2) - 20){
                                    p1.x = (options.mapX) - (p1.w / 2) - 20;
                                }
                            }
                        }
                    }
                } else if(p1.jump){
                    if(p1.x + movementSpeed <= (options.mapX) - (p1.w / 2) - 20){
                        if(p1.x > p2.x){
                            p1.x += movementSpeed;
                            p1.moving = true;
                        } 
                        else if(p1.x + p1.w/2 < p2.x - p2.w/2 + 20){
                            p1.x += movementSpeed;
                            p1.moving = true;
                        }
                    }
                }
            } else {
                p1.moving = false;
            }

            if(c1.moveup && !c1.movedown){
                if(!p1.jump) {
                    p1.velocityY = jumpHeightSquared;
                    p1.jump = true;
                }
            } else {
                if(p1.velocityY < minJumpHeight){
                    p1.velocityY = minJumpHeight;
                } else {
                    if (c1.movedown && !p1.jump) {
                        p1.crouch=true;
                        p1.h = 170;
                    } else {
                        p1.crouch=false;
                        p1.h = 300;
                    }
                }
            }

            p1.velocityY += gravityAccelerationY ;
            p1.y += p1.velocityY ;
            if (p1.y > options.mapY) {
                p1.y = options.mapY;
                p1.jump = false;
                p1.velocityY = 0;
            } 

            //1 = blue, -1 = red
            var vz = (p1.x > p2.x)? -1 : 1;
            
            //JAB COMBO - TRANSITION FROM JAB, JAB, KICK
            if(c1.hit && !c1.right && !c1.left && !c1.moveup && !c1.movedown && !p1.jump){
                p1.attack.jabcommand.jab = false;
                p1.attack.jabcommand.kick = false;

                //JAB1
                if(!p1.attack.jabcommand.jab1){
                    if(!p1.attack.jabcommand.jabcomboend){
                        p1.attack.jabcommand.jab = true;
                        handleHitbox("jab",p1,p2,vz);
                        p1.attack.jabcommand.jab1 = true;
                        p1.attack.jabcommand.jab1Time = new Date();
                    } else if(p1.attack.jabcommand.jabcomboend){
                        var curTime = new Date;
                        if(curTime.getTime() - p1.attack.jabcommand.jabcomboendTime.getTime() >= 1000){
                            p1.attack.jabcommand.jab = true;
                            handleHitbox("jab",p1,p2,vz);
                            p1.attack.jabcommand.jab1 = true;
                            p1.attack.jabcommand.jab1Time = new Date();
                            p1.attack.jabcommand.jabcomboend = false;
                        }
                    } 
                } else if(p1.attack.jabcommand.jab1){
                    //JAB2
                    if(!p1.attack.jabcommand.jab2){
                        p1.attack.jabcommand.jab = false;
                        var curTime = new Date();
                        if(curTime.getTime() - p1.attack.jabcommand.jab1Time.getTime() >= 300){
                            if(curTime.getTime() - p1.attack.jabcommand.jab1Time.getTime() <= 700){
                                p1.attack.jabcommand.jab = true;
                                handleHitbox("jab",p1,p2,vz);
                                p1.attack.jabcommand.jab2 = true;
                                p1.attack.jabcommand.jab2Time = new Date();
                            } else{     
                                p1.attack.jabcommand.jab1 = false;
                            }
                        }
                    } else if(p1.attack.jabcommand.jab2){
                        //JAB3
                        if(!p1.attack.jabcommand.jab3){
                            p1.attack.jabcommand.jab = false;
                            var curTime = new Date();
                            if(curTime.getTime() - p1.attack.jabcommand.jab2Time.getTime() >= 300){
                                if(curTime.getTime() - p1.attack.jabcommand.jab2Time.getTime() <= 700){
                                    p1.attack.jabcommand.kick = true;
                                    handleHitbox("kick",p1,p2,vz);
                                    p1.attack.jabcommand.jabcomboend = true;
                                    p1.attack.jabcommand.jabcomboendTime = new Date();
                                    p1.attack.jabcommand.jab1 = false;
                                    p1.attack.jabcommand.jab2 = false;
                                } else{
                                    p1.attack.jabcommand.jab1 = false;
                                    p1.attack.jabcommand.jab2 = false;
                                }
                            }
                        }
                    }
                }
            } else {
                p1.attack.jabcommand.jab = false;
                p1.attack.jabcommand.kick = false;
            }

            //TODO
            if(c1.hit && p1.jump){
                p1.attack.airhit = true;
            } else{
                p1.attack.airhit = false;
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

            if(vz === 1){
                if(c1.hit && c1.right && !p1.jump){
                    p1.attack.fowardhit = true;
                } else {
                    p1.attack.fowardhit = false;
                }
            } else if(vz === -1){
                if(c1.hit && c1.left && !p1.jump){
                    p1.attack.fowardhit = true;
                } else {
                    p1.attack.fowardhit = false;
                }
            }
            
        }
        
    }
}

//TODO - CHANGE VALUES TO VARIABLE CUZ DATABASE/JSON
//CAN'T DIE ON BLOCK
function handleHitbox(action,p1,p2,vz){
    switch(action){
        case "jab":
            var p1hitboxX = p1.x + vz*100;
            var p1hitboxYBelow = p1.y - p1.h + 62;
            var p1hitboxYAbove = p1.y - p1.h + 46;
        
            var p2hitboxX = p2.x - vz*p2.w/2;
            var p2hitboxYBelow = p2.y;
            var p2hitboxYAbove = p2.y - p2.h;

            if(p1hitboxYAbove > p2hitboxYAbove && p1hitboxYBelow < p2hitboxYBelow){
                switch(vz){
                    case 1:
                        var block = controls[p2.sid].right;
                        if(p1hitboxX > p2hitboxX){
                            if(block && !p2.hitstun.gotHit && !p2.jump){
                                p2.attack.block = true;
                                if(p2.hp > 1){
                                    p2.hp -= 1;
                                }
                                p2.hitstun.timer = new hitstunTimer(100);
                                handlePush(p1,p2,"right",5,"hit");

                                if(p1.hypermeter <= 100 - 1){
                                    p1.hypermeter += 1;
                                } else{
                                    p1.hypermeter = 100;
                                } 
                            } else if(!block || p2.jump){
                                p2.hp -= 20;
                                if(p2.hp < 0){
                                    p2.hp = 0;
                                    console.log("preendgame");
                                    player[p1.sid].user.won = true;
                                    player[p2.sid].user.won = false;
                                    endGame(player[p1.sid],player[p2.sid]);
                                }
                                
                                p2.hitstun.gotHit = true;
                                p2.hitstun.timer = new hitstunTimer(300);
                                handlePush(p1,p2,"right",20,"hit");
                            
                                if(p1.hypermeter <= 100 - 2){
                                    p1.hypermeter += 2;
                                } else{
                                    p1.hypermeter = 100;
                                } 
                            }
                        }
                        break;
                    case -1:
                        var block = controls[p2.sid].left;
                        if(p1hitboxX < p2hitboxX){
                            if(block && !p2.hitstun.gotHit && !p2.jump){
                                p2.attack.block = true;
                                if(p2.hp > 1){
                                    p2.hp -= 1;
                                }
                                
                                p2.hitstun.timer = new hitstunTimer(100);
                                handlePush(p1,p2,"left",5,"hit");

                                if(p1.hypermeter <= 100 - 1){
                                    p1.hypermeter += 1;
                                } else{
                                    p1.hypermeter = 100;
                                } 
                            } else if(!block || p2.jump){
                                p2.hp -= 20;
                                if(p2.hp < 0){
                                    p2.hp = 0;
                                    console.log("preendgame");
                                    player[p1.sid].user.won = true;
                                    player[p2.sid].user.won = false;
                                    endGame(player[p1.sid],player[p2.sid]);
                                }
                                
                                p2.hitstun.gotHit = true;
                                p2.hitstun.timer = new hitstunTimer(300);
                                handlePush(p1,p2,"left",20,"hit");
                            
                                if(p1.hypermeter <= 100 - 2){
                                    p1.hypermeter += 2;
                                } else{
                                    p1.hypermeter = 100;
                                } 
                            }
                        }
                        break;
                }
            }
            break;
        case "kick":
            var p1hitboxX = p1.x + vz*100;
            var p1hitboxYBelow = p1.y - p1.h + 122;
            var p1hitboxYAbove = p1.y - p1.h + 86;
        
            var p2hitboxX = p2.x - vz*p2.w/2;
            var p2hitboxYBelow = p2.y;
            var p2hitboxYAbove = p2.y - p2.h;

            if(p1hitboxYAbove > p2hitboxYAbove && p1hitboxYBelow < p2hitboxYBelow){
                switch(vz){
                    case 1:
                        var block = controls[p2.sid].right;
                        if(p1hitboxX > p2hitboxX){
                            if(block && !p2.hitstun.gotHit && !p2.jump){
                                p2.attack.block = true;
                                if(p2.hp > 1){
                                    p2.hp -= 1;
                                }
                                
                                p2.hitstun.timer = new hitstunTimer(100);
                                handlePush(p1,p2,"right",5,"hit");

                                if(p1.hypermeter <= 100 - 1){
                                    p1.hypermeter += 1;
                                } else{
                                    p1.hypermeter = 100;
                                } 
                            } else if(!block || p2.jump){
                                p2.hp -= 30;
                                if(p2.hp < 0){
                                    p2.hp = 0;
                                }
                                
                                p2.hitstun.gotHit = true;
                                p2.hitstun.timer = new hitstunTimer(500);
                                handlePush(p1,p2,"right",100,"hit");
                            
                                if(p1.hypermeter <= 100 - 3){
                                    p1.hypermeter += 3;
                                } else{
                                    p1.hypermeter = 100;
                                } 
                            }
                        }
                        break;
                    case -1:
                        var block = controls[p2.sid].left;
                        if(p1hitboxX < p2hitboxX){
                            if(block && !p2.hitstun.gotHit && !p2.jump){
                                p2.attack.block = true;
                                if(p2.hp > 1){
                                    p2.hp -= 1;
                                }
                                
                                p2.hitstun.timer = new hitstunTimer(100);
                                handlePush(p1,p2,"left",5,"hit");

                                if(p1.hypermeter <= 100 - 1){
                                    p1.hypermeter += 1;
                                } else{
                                    p1.hypermeter = 100;
                                } 
                            } else if(!block || p2.jump){
                                p2.hp -= 30;
                                if(p2.hp < 0){
                                    p2.hp = 0;
                                }
                                
                                p2.hitstun.gotHit = true;
                                p2.hitstun.timer = new hitstunTimer(500);
                                handlePush(p1,p2,"left",100,"hit");
                            
                                if(p1.hypermeter <= 100 - 3){
                                    p1.hypermeter += 3;
                                } else{
                                    p1.hypermeter = 100;
                                } 
                            }
                        }
                        break;
                }
            }
            break;
    }
}

//TODO
var mapX = 1000;
function handlePush(p1,p2,direction,distance,action){
    var boundaryL = p1.w/2 + 20;
    var boundaryR  = mapX - (p1.w / 2) - 20;
    
    switch(action){
        case "collide":
            switch(direction){
                case "left":
                    var push = p2.x - distance;
                    if(push >= boundaryL){
                        p2.x = push;
                    } else if(push < boundaryL){
                        p2.x = boundaryL;
                    }

                    break;
                case "right":
                    var push = p2.x + distance;
                    if(push <= boundaryR){
                        p2.x = push;
                    } else if(push > boundaryR){
                        p2.x = boundaryR;
                    }
                    p2.x += distance;
                    break;
            }
            break;
            
        case "hit":
            switch(direction){
                case "left":
                    if(p2.x !== boundaryL){
                        var push = p2.x - distance;
                        if(push >= boundaryL){
                            p2.x = push;
                        } else if(push < boundaryL){
                            p2.x = boundaryL;
                        }
                    } else if(p2.x === boundaryL){
                        var push = p1.x + distance;
                        if(push <= boundaryR){
                            p1.x = push;
                        } else if(push > boundaryR){
                            p1.x = boundaryR;
                        }
                    }
                    break;
                
                case "right":
                    if(p2.x !== boundaryR){
                        var push = p2.x + distance;
                        if(push <= boundaryR){
                            p2.x = push;
                        } else if(push > boundaryR){
                            p2.x = boundaryR;
                        }
                    } else if(p2.x === boundaryR){
                        var push = p1.x - distance;
                        if(push >= boundaryL){
                            p1.x = push;
                        } else if(push < boundaryL){
                            p1.x = boundaryL;
                        }
                    }
                    break;
            }
            
            break;
    }
}

//TODO
function handleLaunch(player, endX, maxY){
    
}

function handleHitstun(){
    for(var i in lobby){
        if(!lobby[i].options)
            break;
        var characterRed = lobby[i].red;
        var characterBlue = lobby[i].blue;
        
        if(characterRed.hitstun.gotHit || characterRed.attack.block){
            var hitstunRed = characterRed.hitstun.timer;
            hitstunRed.check(characterRed);
        }
        
        if(characterBlue.hitstun.gotHit || characterBlue.attack.block){
            var hitstunBlue = characterBlue.hitstun.timer;
            hitstunBlue.check(characterBlue);
        }
    }
}

function hitstunTimer(duration){
    var start;
    var duration;
    
    this.start = new Date();
    this.duration = duration;
    
    this.check = function(defender){
        if(defender.hitstun.gotHit){
            var curTime = new Date();
            if(curTime.getTime() - this.start.getTime() > this.duration){
                defender.hitstun.gotHit = false;
            }
        } else if(!defender.hitstun.gotHit){
            var curTime = new Date();
            if(curTime.getTime() - this.start.getTime() > this.duration){
                defender.attack.block = false;
            }
        }
    };
}

//Deprecated atm, dunno if needed
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
    var charChoice = player[socket.id].character;
    //console.log("assignToLobby: " + charChoice);
    var cA = characterAttributes[charChoice];
    //console.log("cA: ", cA.name);
    cA.w = cA.characterinfo.w;
    cA.h = cA.characterinfo.h;
    cA.hp = cA.characterinfo.hp;

    if(team.length > 0){

        slot = team[team.length-1];

        //lobby
        if(team.length > 1){
            lobby[lc] = {};
        }
            var character = [];
            character[slot] = extend({},cA);
            console.log(lobby[lc],lc);

            lobby[lc][slot] = character[slot];
            //lobby[lc] = {blue:character["blue"],red:character["red"]};
        //} else {
        //
        //}

        console.log(lobby[lc],slot);
        team.pop();
        lobby[lc][slot].sid = socket.id;
//        lobby[lc].sockets = {};
//        lobby[lc].sockets[slot] = socket;

        if(team.length == 0){
            var notifyPlayers = lc;
        }
    } else {
        team = ['blue','red'];
        slot = team[team.length-1];

        //neue lobby
        var character = [];
            character[slot] = extend({},cA);
            //character["red"] = extend({},cA);
        lobby[++lc] = {};
        lobby[lc][slot] = character[slot];
        //lobby[++lc] = {blue:character["blue"],red:character["red"]};
        console.log(lc);
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
            
            var nameRed = player[lobby[lC].red.sid].user.name;
            var eloRed = player[lobby[lC].red.sid].user.elo;
            var nameBlue = player[lobby[lC].blue.sid].user.name;
            var eloBlue = player[lobby[lC].blue.sid].user.elo;
            
            var options = {
                mapX : 1000,
                mapY : 400,
                playerStartDelta : 120,
                color : slot,
                nameRed:nameRed,
                eloRed:eloRed,
                nameBlue:nameBlue,
                eloBlue: eloBlue
            };
            
            var gameTimer = new timerHandler();
            var hypermeter = new hypermeterHandler();

            lobby[lC].options = {mapX : options.mapX, mapY:options.mapY};
            lobby[lC].options.timerObj = gameTimer;
            lobby[lC].options.hypermeterObj = hypermeter;

            var characterRed = lobby[lC].red;
            var characterBlue = lobby[lC].blue;
            console.log("characterRed: ", characterRed.name);
            console.log("characterBlue: ", characterBlue.name);

            characterBlue.start = characterBlue.x = 150 + options.playerStartDelta;
            characterRed.start = characterRed.x = 850 - options.playerStartDelta;
            characterBlue.y=characterRed.y= options.mapY;
            characterBlue.lobby=characterRed.lobby= lC;

    //      if(lobby[1])console.log(lobby[0].red.lobby,lobby[1].red.lobby,lC);
    //        else console.log(lobby[0].red.lobby,lC);

            options.characters = {"red" : characterRed , "blue" : characterBlue};
            for(var i in lobby[lC]){
                if( i == 'options')
                    continue;
                var sid = lobby[lC][i].sid;
//                console.log("player " + i + " in Lobby " + lc + " has been sent the gameOptions");
//                console.log(sid);
                options.color = i; 
                //console.log(i);
                clients[sid].emit('gameOptions', options );
                if(slot != "observer") controls[sid] = {left:false,right:false,moveup:false,movedown:false,hit:false,special1:false,special2:false,hyper:false};
            }
            console.log("Lobby " + lC + " starts Playing");
        }
        player[socket.id].color = slot;
        player[socket.id].lobby = lc;
}

//TODO FINISHHANDLER
function gameFinishedHandler(){
    
}