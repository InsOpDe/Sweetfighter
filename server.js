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
//var characterAttributes = {x:0,y:0,w:100,h:300,hp:100,hypermeter:0,
//                           moving:false,jump:false,velocityY:0,crouch:false,
//                           hitstun:{gotHit:false,timer:undefined},
//                           attack:{fowardhit:false, backwardhit:false,airhit:false,crouchhit:false,special1:false,special2:false,hyper:false,block:false,
//                                    jabcommand:{jab:false,kick:false,
//                                               jab1:false,jab1Time:undefined,
//                                               jab2:false,jab2Time:undefined,
//                                               jabcomboend:false,jabcomboendTime:undefined},
//                                    projectile:{exist:false,timer:undefined,posX:undefined,posY:undefined,distance:undefined},       
//                                    mode:{active:false, dmgMultiplicator:1}
//                           }};

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
//        console.log("init: " + data.character);
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
    
    for(var p in controls){
        //if lobby isnt full yet
        if(typeof player[p] === 'undefined')
            continue;
        var lob = player[p].lobby;
        if(typeof lob === 'undefined' || !lobby[lob]  || !lobby[lob].hasOwnProperty("options"))
            continue;
        var col = player[p].color;
        var p1 = lobby[lob][col];
        var p2 = (col === "red")? lobby[lob]["blue"] : lobby[lob]["red"];
        var vz = (p1.x > p2.x)? -1 : 1;
        handleDash(p1,p2);
        handleStartup(p1,p2,vz);
        handleEndlag(p1);
    }
    
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
        
        checkKO(characterRed,characterBlue);
        gameTimer.update();
        hypermeter.update(characterRed, characterBlue);
        handleProjectile.update(characterRed, characterBlue);
        handleProjectile.handleHitbox(characterRed,characterBlue);
        
        clients[lobby[i].red.sid].volatile.emit('command', { tick: new Date(), actions : update });
        clients[lobby[i].blue.sid].volatile.emit('command', { tick: new Date(), actions : update });
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
        
        var movementSpeed = p1.characterinfo.movementspeed;
        
            p1.velocityY += gravityAccelerationY ;
            p1.y += p1.velocityY ;
            if (p1.y > options.mapY) {
                p1.y = options.mapY;
                p1.jump = false;
                p1.velocityY = 0;
            }
        
        if(!p1.attack.hitstun.gotHit && !p1.characterinfo.dash.active){
            if(c1.left){
                if(!p1.jump){
                    if(!c1.movedown){
                        if(!c1.hit){
                            if(!p1.attack.block){
                                if(p1.x - movementSpeed >= p1.characterinfo.w/2 + 20){
                                    if(p1.x < p2.x){
                                        p1.x -= movementSpeed;
                                        p1.moving = true;
                                    } 
                                    else if(p1.x - p1.characterinfo.w/2 - movementSpeed >= p2.x + p2.characterinfo.w/2 - 20){
                                        p1.x -= movementSpeed;
                                        p1.moving = true;
                                    }
                                    else if(p1.x - p1.characterinfo.w/2 - movementSpeed < p2.x + p2.characterinfo.w/2 - 20){
                                        if(!c2.movedown){
                                            handlePush(p1,p2,"left",movementSpeed,"collide");
                                        }
                                    }
                                } else if(p1.x - movementSpeed < p1.characterinfo.w/2 + 20){
                                    p1.x = p1.characterinfo.w/2 + 20;
                                    p1.moving = true;
                                }
                            }
                        }
                    }
                } else if(p1.jump){
                    if(p1.x - movementSpeed >= p1.characterinfo.w/2 + 20){
                        if(p1.x < p2.x){
                            p1.x -= movementSpeed;
                            p1.moving = true;
                        } 
                        else if(p1.x - p1.characterinfo.w/2 > p2.x + p2.characterinfo.w/2 - 20){
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
                                if(p1.x + movementSpeed <= (options.mapX) - (p1.characterinfo.w/2) - 20){
                                    if(p1.x > p2.x){
                                        p1.x += movementSpeed;
                                        p1.moving = true;
                                    } 
                                    else if(p1.x + p1.characterinfo.w/2 + movementSpeed <= p2.x - p2.characterinfo.w/2 + 20){
                                        p1.x += movementSpeed;
                                        p1.moving = true;
                                    } 
                                    else if(p1.x + p1.characterinfo.w/2 + movementSpeed > p2.x - p2.characterinfo.w/2 + 20){
                                        if(!c2.movedown){
                                            handlePush(p1,p2,"right",movementSpeed,"collide");
                                        }
                                    }                    
                                } else if(p1.x + movementSpeed > (options.mapX) - (p1.characterinfo.w / 2) - 20){
                                    p1.x = (options.mapX) - (p1.characterinfo.w / 2) - 20;
                                    p1.moving = true;
                                }
                            }
                        }
                    }
                } else if(p1.jump){
                    if(p1.x + movementSpeed <= (options.mapX) - (p1.characterinfo.w/2) - 20){
                        if(p1.x > p2.x){
                            p1.x += movementSpeed;
                            p1.moving = true;
                        } 
                        else if(p1.x + p1.characterinfo.w/2 < p2.x - p2.characterinfo.w/2 + 20){
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
                        p1.characterinfo.h = p1.action.crouch.h;
                    } else {
                        p1.crouch=false;
                        p1.characterinfo.h = p1.action.idle.h;
                    }
                }
            }
            
            if(c1.dashL){
                if(!p1.jump){
                    if(!c1.movedown && !c1.left && !c1.right){
                        if(!c1.hit){
                            if(!p1.attack.block){
                                if(!p1.characterinfo.dash.active){
                                    p1.characterinfo.dash.active = true;
                                    p1.characterinfo.dash.direction = "left";
                                    p1.characterinfo.dash.endPos = p1.x - p1.characterinfo.dash.distance;
                                }
                            }
                        }
                    }
                }
            }
                
                if(c1.dashR){
                    if(!p1.jump){
                        if(!c1.movedown && !c1.left && !c1.right){
                            if(!c1.hit){
                                if(!p1.attack.block){
                                    if(!p1.characterinfo.dash.active){
                                        p1.characterinfo.dash.active = true;
                                        p1.characterinfo.dash.direction = "right";
                                        p1.characterinfo.dash.endPos = p1.x + p1.characterinfo.dash.distance;
                                    }
                                }
                            }
                        }
                    }
                }
            
            //1 = blue, -1 = red
            var vz = (p1.x > p2.x)? -1 : 1;            
            
            //JAB COMBO - TRANSITION FROM JAB, JAB, KICK
            if(!p1.attack.endlag.hitexecuted){
                if(c1.hit && !c1.right && !c1.left && !c1.moveup && !c1.movedown && !p1.jump){
                    //JAB1
                    if(!p1.attack.neutralcombo.jab1){
                        p1.attack.jab = true;
                        p1.attack.startup.start = true;
                        p1.attack.startup.timer = new Date();
                        p1.attack.startup.move = "jab";
                        
                        p1.attack.neutralcombo.jab1 = true;
                        p1.attack.neutralcombo.timer = new Date();

                        p1.attack.endlag.hitexecuted = true;
                        p1.attack.endlag.timer = new Date();
                        p1.attack.endlag.duration = p1.action.jab.endlag; 
                    } else if(p1.attack.neutralcombo.jab1){
                        //JAB2
                        if(!p1.attack.neutralcombo.jab2){
                            p1.attack.jab = false;
                            var curTime = new Date();
                            if(curTime.getTime() - p1.attack.neutralcombo.timer.getTime() <= p1.attack.neutralcombo.comboTime){
                                p1.attack.jab = true;
                                p1.attack.startup.start = true;
                                p1.attack.startup.timer = new Date();
                                p1.attack.startup.move = "jab";
                                
                                p1.attack.neutralcombo.jab2 = true;
                                p1.attack.neutralcombo.timer = new Date();

                                p1.attack.endlag.hitexecuted = true;
                                p1.attack.endlag.timer = new Date();
                                p1.attack.endlag.duration = p1.action.jab.endlag;
                            } else{     
                                p1.attack.neutralcombo.jab1 = false;
                            }
                        } else if(p1.attack.neutralcombo.jab2){
                            //JAB3
                            p1.attack.jab = false;
                            var curTime = new Date();
                            if(curTime.getTime() - p1.attack.neutralcombo.timer.getTime() <= p1.attack.neutralcombo.comboTime){
                                p1.attack.kick = true;
                                p1.attack.startup.start = true;
                                p1.attack.startup.timer = new Date();
                                p1.attack.startup.move = "kick";
                                
                                p1.attack.neutralcombo.jab1 = false;
                                p1.attack.neutralcombo.jab2 = false;

                                p1.attack.endlag.hitexecuted = true;
                                p1.attack.endlag.timer = new Date();
                                p1.attack.endlag.duration = p1.action.kick.endlag;
                            } else{
                                p1.attack.neutralcombo.jab1 = false;
                                p1.attack.neutralcombo.jab2 = false;
                            }
                        }
                    }
                }
            } else {
                p1.attack.jab = false;
                p1.attack.kick = false;
            }            

            if(vz === 1){
                if(!p1.attack.endlag.hitexecuted){
                    if(c1.hit && c1.right && !c1.left && !c1.moveup && !c1.movedown && !p1.jump){
                        p1.attack.forwardhit = true;
                        p1.attack.startup.start = true;
                        p1.attack.startup.timer = new Date();
                        p1.attack.startup.move = "forwardhit";
                        
                        p1.characterinfo.w += p1.characterinfo.w/2;
                        
                        p1.attack.endlag.hitexecuted = true;
                        p1.attack.endlag.timer = new Date();
                        p1.attack.endlag.duration = p1.action.forwardhit.endlag;
                    }
                } else {
                    p1.attack.forwardhit = false;
                }
                if(!p1.attack.endlag.hitexecuted){
                    if(c1.hit && c1.left && !c1.right && !c1.moveup && !c1.movedown && !p1.jump){
                        if(!p1.attack.projectile.exist){
                            p1.attack.backwardhit = true;
                            handleProjectile.create("backwardhit",p1,vz,p1.action.backwardhit.distance);
                            
                            p1.attack.endlag.hitexecuted = true;
                            p1.attack.endlag.timer = new Date();
                            p1.attack.endlag.duration = p1.action.backwardhit.endlag;
                        }
                    }
                } else {
                    p1.attack.backwardhit = false;
                }
                
            } else if(vz === -1){
                if(!p1.attack.endlag.hitexecuted){    
                    if(c1.hit && c1.left && !c1.right && !c1.moveup && !c1.movedown && !p1.jump){
                        p1.attack.forwardhit = true;
                        p1.attack.startup.start = true;
                        p1.attack.startup.timer = new Date();
                        p1.attack.startup.move = "forwardhit";
                        
                        p1.characterinfo.w += p1.characterinfo.w/2;
                        
                        p1.attack.endlag.hitexecuted = true;
                        p1.attack.endlag.timer = new Date();
                        p1.attack.endlag.duration = p1.action.forwardhit.endlag;
                    }
                } else {
                    p1.attack.forwardhit = false;
                }
                if(!p1.attack.endlag.hitexecuted){
                    if(c1.hit && c1.right && !c1.left && !c1.moveup && !c1.movedown && !p1.jump){
                        if(!p1.attack.projectile.exist){
                            p1.attack.backwardhit = true;
                            handleProjectile.create("backwardhit",p1,vz,p1.action.backwardhit.distance);
                            
                            p1.attack.endlag.hitexecuted = true;
                            p1.attack.endlag.timer = new Date();
                            p1.attack.endlag.duration = p1.action.backwardhit.endlag;
                        }
                    }
                } else {
                    p1.attack.backwardhit = false;
                }
            }         
            
            if(!p1.attack.endlag.hitexecuted){
                if(c1.hit && p1.jump && !c1.movedown){
                    p1.attack.airhit = true;
                    p1.attack.startup.start = true;
                    p1.attack.startup.timer = new Date();
                    p1.attack.startup.move = "airhit";
                    
                    p1.attack.endlag.hitexecuted = true;
                    p1.attack.endlag.timer = new Date();
                    p1.attack.endlag.duration = p1.action.airhit.endlag;
                }
            } else{
                p1.attack.airhit = false;
            }
            
            if(!p1.attack.endlag.hitexecuted){
                if(c1.hit && p1.crouch && !c1.moveup){
                    p1.attack.crouchhit = true;
                    p1.attack.startup.start = true;
                    p1.attack.startup.timer = new Date();
                    p1.attack.startup.move = "crouchhit";
                    
                    p1.attack.endlag.hitexecuted = true;
                    p1.attack.endlag.timer = new Date();
                    p1.attack.endlag.duration = p1.action.crouchhit.endlag;
                }
            } else{
                p1.attack.crouchhit = false;
            }
            
//TODO
            if(!p1.attack.endlag.hitexecuted){
                if(c1.special1){
                    if(p1.characterinfo.hypermeter >= 20){
                        p1.attack.special1 = true;
                        p1.characterinfo.hypermeter -= 20;
                        p1.attack.startup.start = true;
                        p1.attack.startup.timer = new Date();
                        p1.attack.startup.move = "special1";
                        
                        p1.attack.endlag.hitexecuted = true;
                        p1.attack.endlag.timer = new Date();
                        p1.attack.endlag.duration = p1.action.special1.endlag;
                    }
                }
            } else {
                p1.attack.special1 = false;
            }
            
            if(!p1.attack.endlag.hitexecuted){
                if(c1.special2){
                    if(p1.characterinfo.hypermeter >= 20){
                        p1.attack.special2 = true;
                        p1.characterinfo.hypermeter -= 20;
                        p1.attack.startup.start = true;
                        p1.attack.startup.timer = new Date();
                        p1.attack.startup.move = "special2";
                        
                        p1.attack.endlag.hitexecuted = true;
                        p1.attack.endlag.timer = new Date();
                        p1.attack.endlag.duration = p1.action.special2.endlag;
                    }
                }
            } else {
                p1.attack.special2 = false;
            }
            
            if(!p1.attack.endlag.hitexecuted){
                if(c1.hyper){
                    if(p1.characterinfo.hypermeter >= 60){
                        p1.attack.hyper = true;
                        p1.characterinfo.hypermeter -= 60;
                        handleProjectile.create("hyper", p1,vz,p1.action.hyper.distance);
                        
                        p1.attack.endlag.hitexecuted = true;
                        p1.attack.endlag.timer = new Date();
                        p1.attack.endlag.duration = p1.action.hyper.endlag;
                    }
                }
            } else {
                p1.attack.hyper = false;
            }
//

            if(c1.mode && p1.characterinfo.hypermeter === 100){
                p1.attack.mode.active = true;
                p1.attack.mode.dmgMultiplicator = p1.characterinfo.dmgMultiplicator;
            }
            
        }
        
    }
}

var mapX = 1000;

function handleDash(p1, p2){
    if(p1.attack.hitstun.gotHit){
        p1.characterinfo.dash.active = false;
    }
    if(p1.characterinfo.dash.active){
        var direction = p1.characterinfo.dash.direction;
        switch(direction){
            case "left":
                if(p1.x > p1.characterinfo.dash.endPos){
                    if(p1.x - p1.characterinfo.dash.speed >= p1.characterinfo.w/2 + 20){
                        if(p1.x < p2.x){
                            p1.x -= p1.characterinfo.dash.speed;
                            p1.moving = true;
                        } 
                        else if(p1.x - p1.characterinfo.w/2 - p1.characterinfo.dash.speed >= p2.x + p2.characterinfo.w/2 - 20){
                            p1.x -= p1.characterinfo.dash.speed;
                            p1.moving = true;
                        }
                        else if(p1.x - p1.characterinfo.w/2 - p1.characterinfo.dash.speed < p2.x + p2.characterinfo.w/2 - 20){
                            if(!controls[p2.sid].movedown){
                                handlePush(p1,p2,"left",p1.characterinfo.movementspeed,"collide");
                            }
                            p1.x = p2.x + p2.characterinfo.w/2 - 20 + p1.characterinfo.w/2;
                            p1.characterinfo.dash.active = false;
                        }
                    } else if(p1.x - p1.characterinfo.dash.speed < p1.characterinfo.w/2 + 20){
                        p1.x = p1.characterinfo.w/2 + 20;
                        p1.moving = true;
                        p1.characterinfo.dash.active = false;
                    }
                } else{
                    p1.characterinfo.dash.active = false;
                }

                break;
            case "right":
                if(p1.x < p1.characterinfo.dash.endPos){
                    if(p1.x + p1.characterinfo.dash.speed <= mapX - (p1.characterinfo.w/2) - 20){
                        if(p1.x > p2.x){
                            p1.x += p1.characterinfo.dash.speed;
                            p1.moving = true;
                        } 
                        else if(p1.x + p1.characterinfo.w/2 + p1.characterinfo.dash.speed <= p2.x - p2.characterinfo.w/2 + 20){
                            p1.x += p1.characterinfo.dash.speed;
                            p1.moving = true;
                        } 
                        else if(p1.x + p1.characterinfo.w/2 + p1.characterinfo.dash.speed > p2.x - p2.characterinfo.w/2 + 20){
                            if(!controls[p2.sid].movedown){
                                handlePush(p1,p2,"right",p1.characterinfo.movementspeed,"collide");
                            }
                            p1.x = p2.x - p2.characterinfo.w/2 + 20 - p1.characterinfo.w/2;
                            p1.characterinfo.dash.active = false;
                        }                    
                    } else if(p1.x + p1.characterinfo.dash.speed > mapX - (p1.characterinfo.w / 2) - 20){
                        p1.x = mapX - (p1.characterinfo.w / 2) - 20;
                        p1.moving = true;
                        p1.characterinfo.dash.active = false;
                    }
                } else{
                    p1.characterinfo.dash.active = false;
                }
                
                break;
        }
    }
}

function handleStartup(p1,p2,vz){
    if(p1.attack.startup.start){
        var curTime = new Date();
        var move = p1.attack.startup.move;
        if(curTime.getTime() - p1.attack.startup.timer.getTime() > p1.action[move].startup){
            handleHitbox(p1.attack.startup.move,p1,p2,vz);
            if(move.localeCompare("forwardhit")===0){
                p1.characterinfo.w -= p1.characterinfo.w/3;
            }
            p1.attack.startup.start = false;
        }
    }
}

function handleEndlag(player){
    if(player.attack.endlag.hitexecuted){
        var curTime = new Date();
        if(curTime.getTime() - player.attack.endlag.timer.getTime() > player.attack.endlag.duration){
            player.attack.endlag.hitexecuted = false;
        }
    }
}

var handleProjectile = {
    create:function(move,player,vz,distance){
        if(player.attack.projectile.exist === false){
            player.attack.projectile.exist = true;
            player.attack.projectile.posX = player.x - vz*player.characterinfo.w*player.action[move].spawnX;
            player.attack.projectile.posY = player.y - player.characterinfo.h*player.action[move].spawnY;
            player.attack.projectile.speed = player.action[move].speed;
            player.attack.projectile.distance = player.x + vz*distance;
            player.attack.projectile.range = player.action[move].range;
            player.attack.projectile.botY = player.action[move].botY;
            player.attack.projectile.pierce = player.action[move].pierce;
            player.attack.projectile.damage = player.action[move].damage;
            player.attack.projectile.hitstun = player.action[move].hitstun;
            player.attack.projectile.push = player.action[move].push;
        }
    },
    update:function(characterRed,characterBlue){
        if(characterRed.attack.projectile.exist === true){
            if(characterRed.attack.projectile.posX >= characterRed.attack.projectile.distance){
                characterRed.attack.projectile.posX -= characterRed.attack.projectile.speed;
            } else if(characterRed.attack.projectile.posX < characterRed.attack.projectile.distance){
                characterRed.attack.projectile.exist = false;
            }
        }
        
        if(characterBlue.attack.projectile.exist === true){
            if(characterBlue.attack.projectile.posX <= characterBlue.attack.projectile.distance){
                characterBlue.attack.projectile.posX += characterBlue.attack.projectile.speed;
            } else if(characterBlue.attack.projectile.posX > characterBlue.attack.projectile.distance){
                characterBlue.attack.projectile.exist = false;
            }
        }
    },
    
    handleHitbox:function(characterRed, characterBlue){
        if(characterBlue.attack.projectile.exist){
            var p1hitboxleftX = characterBlue.attack.projectile.posX;
            var p1hitboxrightX = characterBlue.attack.projectile.posX + characterBlue.attack.projectile.range;
            var p1hitboxtopY = characterBlue.attack.projectile.posY + 30;
            var p1hitboxbotY = characterBlue.attack.projectile.posY + characterBlue.attack.projectile.botY;
            var p2hitboxleftX = characterRed.x - characterRed.characterinfo.w/2;
            var p2hitboxrightX = characterRed.x + characterRed.characterinfo.w/2;
            var p2hitboxtopY = characterRed.y - characterRed.characterinfo.h;
            var p2hitboxbotY = characterRed.y;
            
            var block = controls[characterRed.sid].right;
            if((characterRed.x > p1hitboxrightX && p1hitboxrightX > p2hitboxleftX) || (characterRed.x < p1hitboxleftX && p1hitboxleftX < p2hitboxrightX)){
                if(p1hitboxtopY < p2hitboxbotY || !(p1hitboxtopY > p2hitboxbotY) && p1hitboxbotY > p2hitboxtopY){
                    if(!characterBlue.attack.projectile.pierce){
                        characterBlue.attack.projectile.exist = false;
                    }
                    if(!block || characterRed.jump){
                        characterRed.characterinfo.hp -= characterBlue.attack.projectile.damage*characterBlue.attack.mode.dmgMultiplicator;
                        if(characterRed.characterinfo.hp < 0){
                            characterRed.characterinfo.hp = 0;
                        }
                        characterRed.attack.hitstun.gotHit = true;
                        characterRed.attack.hitstun.timer = new hitstunTimer(characterBlue.attack.projectile.hitstun);
                        handlePush(characterBlue,characterRed,"right",characterBlue.attack.projectile.push,"projectile");
                    } else if(block && !characterRed.attack.hitstun.gotHit && !characterRed.jump){
                        characterRed.attack.block = true;
                        if(characterRed.characterinfo.hp > 1){
                            characterRed.characterinfo.hp -= 1;
                        }
                        characterRed.attack.hitstun.timer = new hitstunTimer(100);
                        handlePush(characterBlue,characterRed,"right",5,"projectile");
                    }
                }
            }
        }
        
        if(characterRed.attack.projectile.exist){
            var p1hitboxleftX2 = characterRed.attack.projectile.posX;
            var p1hitboxrightX2 = characterRed.attack.projectile.posX + characterRed.attack.projectile.range;
            var p1hitboxtopY2 = characterRed.attack.projectile.posY + 30;
            var p1hitboxbotY2 = characterRed.attack.projectile.posY + characterRed.attack.projectile.botY;
            var p2hitboxleftX2 = characterBlue.x - characterBlue.characterinfo.w/2;
            var p2hitboxrightX2 = characterBlue.x + characterBlue.characterinfo.w/2;
            var p2hitboxtopY2 = characterBlue.y - characterBlue.characterinfo.h;
            var p2hitboxbotY2 = characterBlue.y;
            
            var block = controls[characterBlue.sid].left;
            if((characterBlue.x > p1hitboxrightX2 && p1hitboxrightX2 > p2hitboxleftX2) || (characterBlue.x < p1hitboxleftX2 && p1hitboxleftX2 < p2hitboxrightX2)){
                if(p1hitboxtopY2 < p2hitboxbotY2 || !(p1hitboxtopY2 > p2hitboxbotY2) && p1hitboxbotY2 > p2hitboxtopY2){
                    if(!characterRed.attack.projectile.pierce){
                        characterRed.attack.projectile.exist = false;
                    }
                    if(!block || characterBlue.jump){
                        characterBlue.characterinfo.hp -= characterRed.attack.projectile.damage*characterRed.attack.mode.dmgMultiplicator;
                        if(characterBlue.characterinfo.hp < 0){
                            characterBlue.characterinfo.hp = 0;
                        }
                        characterBlue.attack.hitstun.gotHit = true;
                        characterBlue.attack.hitstun.timer = new hitstunTimer(characterRed.attack.projectile.hitstun);
                        handlePush(characterRed,characterBlue,"left",characterRed.attack.projectile.push,"projectile");
                    } else if(block && !characterBlue.attack.hitstun.gotHit && !characterBlue.jump){
                        characterBlue.attack.block = true;
                        if(characterBlue.characterinfo.hp > 1){
                            characterBlue.characterinfo.hp -= 1;
                        }
                        characterBlue.attack.hitstun.timer = new hitstunTimer(100);
                        handlePush(characterRed,characterBlue,"left",5,"projectile");
                    }
                }
            }
        }
    }
};

//CAN'T DIE ON BLOCK
function handleHitbox(action,p1,p2,vz){
    switch(action){
        case "jab":
            var p1hitboxX = p1.x + vz*p1.characterinfo.w*p1.action.jab.range;
            var p1hitboxYBelow = p1.y - p1.characterinfo.h + p1.characterinfo.h*p1.action.jab.botY;
            var p1hitboxYAbove = p1.y - p1.characterinfo.h + p1.characterinfo.h*p1.action.jab.topY;
        
            var p2hitboxX = p2.x - vz*p2.characterinfo.w/2;
            var p2hitboxYBelow = p2.y;
            var p2hitboxYAbove = p2.y - p2.characterinfo.h;

            if(p1hitboxYAbove > p2hitboxYAbove && p1hitboxYBelow < p2hitboxYBelow){
                switch(vz){
                    case 1:
                        var block = controls[p2.sid].right;
                        if(p1hitboxX > p2hitboxX){
                            if(block && !p2.attack.hitstun.gotHit && !p2.jump){
                                p2.attack.block = true;
                                if(p2.characterinfo.hp > 1){
                                    p2.characterinfo.hp -= 1;
                                }
                                p2.attack.hitstun.timer = new hitstunTimer(100);
                                handlePush(p1,p2,"right",5,"hit");
                                
                                if(!p1.attack.mode.active){
                                    if(p1.characterinfo.hypermeter <= 100 - 1){
                                        p1.characterinfo.hypermeter += 1;
                                    } else{
                                        p1.characterinfo.hypermeter = 100;
                                    }
                                }
                                if(!p2.attack.mode.active){
                                    if(p2.characterinfo.hypermeter <= 100 - 1){
                                        p2.characterinfo.hypermeter += 1;
                                    } else{
                                        p2.characterinfo.hypermeter = 100;
                                    }
                                }
                            } else if(!block || p2.jump){
                                p2.characterinfo.hp -= p1.action.jab.damage*p1.attack.mode.dmgMultiplicator;
                                if(p2.characterinfo.hp < 0){
                                    p2.characterinfo.hp = 0;
                                }
                                
                                p2.attack.hitstun.gotHit = true;
                                p2.attack.hitstun.timer = new hitstunTimer(p1.action.jab.hitstun);
                                handlePush(p1,p2,"right",p1.action.jab.push,"hit");
                                
                                if(!p1.attack.mode.active){
                                    if(p1.characterinfo.hypermeter <= 100 - p1.action.jab.damage){
                                        p1.characterinfo.hypermeter += p1.action.jab.damage;
                                    } else{
                                        p1.characterinfo.hypermeter = 100;
                                    }
                                }
                                if(!p2.attack.mode.active){
                                    if(p2.characterinfo.hypermeter <= 100 - 1){
                                        p2.characterinfo.hypermeter += 1;
                                    } else{
                                        p2.characterinfo.hypermeter = 100;
                                    }
                                }
                            }
                        }
                        break;
                    case -1:
                        var block = controls[p2.sid].left;
                        if(p1hitboxX < p2hitboxX){
                            if(block && !p2.attack.hitstun.gotHit && !p2.jump){
                                p2.attack.block = true;
                                if(p2.characterinfo.hp > 1){
                                    p2.characterinfo.hp -= 1;
                                }
                                
                                p2.attack.hitstun.timer = new hitstunTimer(100);
                                handlePush(p1,p2,"left",5,"hit");

                                if(!p1.attack.mode.active){
                                    if(p1.characterinfo.hypermeter <= 100 - 1){
                                        p1.characterinfo.hypermeter += 1;
                                    } else{
                                        p1.characterinfo.hypermeter = 100;
                                    }
                                }
                                if(!p2.attack.mode.active){
                                    if(p2.characterinfo.hypermeter <= 100 - 1){
                                        p2.characterinfo.hypermeter += 1;
                                    } else{
                                        p2.characterinfo.hypermeter = 100;
                                    }
                                }
                            } else if(!block || p2.jump){
                                p2.characterinfo.hp -= p2.action.jab.damage*p1.attack.mode.dmgMultiplicator;
                                if(p2.characterinfo.hp < 0){
                                    p2.characterinfo.hp = 0;
                                }
                                
                                p2.attack.hitstun.gotHit = true;
                                p2.attack.hitstun.timer = new hitstunTimer(p1.action.jab.hitstun);
                                handlePush(p1,p2,"left",p1.action.jab.push,"hit");
                            
                                if(!p1.attack.mode.active){
                                    if(p1.characterinfo.hypermeter <= 100 - p2.action.jab.damage){
                                        p1.characterinfo.hypermeter += p2.action.jab.damage;
                                    } else{
                                        p1.characterinfo.hypermeter = 100;
                                    }
                                }
                                if(!p2.attack.mode.active){
                                    if(p2.characterinfo.hypermeter <= 100 - 1){
                                        p2.characterinfo.hypermeter += 1;
                                    } else{
                                        p2.characterinfo.hypermeter = 100;
                                    }
                                }
                            }
                        }
                        break;
                }
            }
            break;
        case "kick":
            var p1hitboxX = p1.x + vz*p1.characterinfo.w*p1.action.kick.range;
            var p1hitboxYBelow = p1.y - p1.characterinfo.h + p1.characterinfo.h*p1.action.kick.botY;
            var p1hitboxYAbove = p1.y - p1.characterinfo.h + p1.characterinfo.h*p1.action.kick.topY;
        
            var p2hitboxX = p2.x - vz*p2.characterinfo.w/2;
            var p2hitboxYBelow = p2.y;
            var p2hitboxYAbove = p2.y - p2.characterinfo.h;

            if(p1hitboxYAbove > p2hitboxYAbove && p1hitboxYBelow < p2hitboxYBelow){
                switch(vz){
                    case 1:
                        var block = controls[p2.sid].right;
                        if(p1hitboxX > p2hitboxX){
                            if(block && !p2.attack.hitstun.gotHit && !p2.jump){
                                p2.attack.block = true;
                                if(p2.characterinfo.hp > 1){
                                    p2.characterinfo.hp -= 1;
                                }
                                
                                p2.attack.hitstun.timer = new hitstunTimer(100);
                                handlePush(p1,p2,"right",5,"hit");

                                if(!p1.attack.mode.active){
                                    if(p1.characterinfo.hypermeter <= 100 - 1){
                                        p1.characterinfo.hypermeter += 1;
                                    } else{
                                        p1.characterinfo.hypermeter = 100;
                                    }
                                }
                                if(!p2.attack.mode.active){
                                    if(p2.characterinfo.hypermeter <= 100 - 1){
                                        p2.characterinfo.hypermeter += 1;
                                    } else{
                                        p2.characterinfo.hypermeter = 100;
                                    }
                                }
                            } else if(!block || p2.jump){
                                p2.characterinfo.hp -= p1.action.kick.damage*p1.attack.mode.dmgMultiplicator;
                                if(p2.characterinfo.hp < 0){
                                    p2.characterinfo.hp = 0;
                                }
                                
                                p2.attack.hitstun.gotHit = true;
                                p2.attack.hitstun.timer = new hitstunTimer(p1.action.kick.hitstun);
                                handlePush(p1,p2,"right",p1.action.kick.push,"hit");
                            
                                if(!p1.attack.mode.active){
                                    if(p1.characterinfo.hypermeter <= 100 - p1.action.kick.damage){
                                        p1.characterinfo.hypermeter += p1.action.kick.damage;
                                    } else{
                                        p1.characterinfo.hypermeter = 100;
                                    }
                                }
                                if(!p2.attack.mode.active){
                                    if(p2.characterinfo.hypermeter <= 100 - 1){
                                        p2.characterinfo.hypermeter += 1;
                                    } else{
                                        p2.characterinfo.hypermeter = 100;
                                    }
                                }
                            }
                        }
                        break;
                    case -1:
                        var block = controls[p2.sid].left;
                        if(p1hitboxX < p2hitboxX){
                            if(block && !p2.attack.hitstun.gotHit && !p2.jump){
                                p2.attack.block = true;
                                if(p2.characterinfo.hp > 1){
                                    p2.characterinfo.hp -= 1;
                                }
                                
                                p2.attack.hitstun.timer = new hitstunTimer(100);
                                handlePush(p1,p2,"left",5,"hit");

                                if(!p1.attack.mode.active){
                                    if(p1.characterinfo.hypermeter <= 100 - 1){
                                        p1.characterinfo.hypermeter += 1;
                                    } else{
                                        p1.characterinfo.hypermeter = 100;
                                    }
                                }
                                if(!p2.attack.mode.active){
                                    if(p2.characterinfo.hypermeter <= 100 - 1){
                                        p2.characterinfo.hypermeter += 1;
                                    } else{
                                        p2.characterinfo.hypermeter = 100;
                                    }
                                }
                            } else if(!block || p2.jump){
                                p2.characterinfo.hp -= p1.action.kick.damage*p1.attack.mode.dmgMultiplicator;
                                if(p2.characterinfo.hp < 0){
                                    p2.characterinfo.hp = 0;
                                }
                                
                                p2.attack.hitstun.gotHit = true;
                                p2.attack.hitstun.timer = new hitstunTimer(p1.action.kick.hitstun);
                                handlePush(p1,p2,"left",p1.action.kick.push,"hit");
                            
                                if(!p1.attack.mode.active){
                                    if(p1.characterinfo.hypermeter <= 100 - p1.action.kick.damage){
                                        p1.characterinfo.hypermeter += p1.action.kick.damage;
                                    } else{
                                        p1.characterinfo.hypermeter = 100;
                                    }
                                }
                                if(!p2.attack.mode.active){
                                    if(p2.characterinfo.hypermeter <= 100 - 1){
                                        p2.characterinfo.hypermeter += 1;
                                    } else{
                                        p2.characterinfo.hypermeter = 100;
                                    }
                                }
                            }
                        }
                        break;
                }
            }
            break;
            case "forwardhit":
                var p1hitboxX = p1.x + vz*(p1.characterinfo.w - p1.characterinfo.w/3)*p1.action.forwardhit.range;
                var p1hitboxYBelow = p1.y - p1.characterinfo.h + p1.characterinfo.h*p1.action.forwardhit.botY;
                var p1hitboxYAbove = p1.y - p1.characterinfo.h + p1.characterinfo.h*p1.action.forwardhit.topY;

                var p2hitboxX = p2.x - vz*p2.characterinfo.w/2;
                var p2hitboxYBelow = p2.y;
                var p2hitboxYAbove = p2.y - p2.characterinfo.h;

                if(p1hitboxYAbove > p2hitboxYAbove && p1hitboxYBelow < p2hitboxYBelow){
                    switch(vz){
                        case 1:
                            var block = controls[p2.sid].right;
                            if(p1hitboxX > p2hitboxX){
                                if(block && !p2.attack.hitstun.gotHit && !p2.jump){
                                    p2.attack.block = true;
                                    if(p2.characterinfo.hp > 1){
                                        p2.characterinfo.hp -= 1;
                                    }

                                    p2.attack.hitstun.timer = new hitstunTimer(100);
                                    handlePush(p1,p2,"right",5,"hit");

                                    if(!p1.attack.mode.active){
                                        if(p1.characterinfo.hypermeter <= 100 - 1){
                                            p1.characterinfo.hypermeter += 1;
                                        } else{
                                            p1.characterinfo.hypermeter = 100;
                                        }
                                    }
                                    if(!p2.attack.mode.active){
                                        if(p2.characterinfo.hypermeter <= 100 - 1){
                                            p2.characterinfo.hypermeter += 1;
                                        } else{
                                            p2.characterinfo.hypermeter = 100;
                                        }
                                    }
                                } else if(!block || p2.jump){
                                    p2.characterinfo.hp -= p1.action.forwardhit.damage*p1.attack.mode.dmgMultiplicator;
                                    if(p2.characterinfo.hp < 0){
                                        p2.characterinfo.hp = 0;
                                    }

                                    p2.attack.hitstun.gotHit = true;
                                    p2.attack.hitstun.timer = new hitstunTimer(p1.action.forwardhit.hitstun);
                                    handlePush(p1,p2,"right",p1.action.forwardhit.push,"hit");

                                    if(!p1.attack.mode.active){
                                        if(p1.characterinfo.hypermeter <= 100 - p1.action.forwardhit.damage){
                                            p1.characterinfo.hypermeter += p1.action.forwardhit.damage;
                                        } else{
                                            p1.characterinfo.hypermeter = 100;
                                        }
                                    }
                                    if(!p2.attack.mode.active){
                                        if(p2.characterinfo.hypermeter <= 100 - 1){
                                            p2.characterinfo.hypermeter += 1;
                                        } else{
                                            p2.characterinfo.hypermeter = 100;
                                        }
                                    }
                                }
                            }
                            break;
                        case -1:
                            var block = controls[p2.sid].left;
                            if(p1hitboxX < p2hitboxX){
                                if(block && !p2.attack.hitstun.gotHit && !p2.jump){
                                    p2.attack.block = true;
                                    if(p2.characterinfo.hp > 1){
                                        p2.characterinfo.hp -= 1;
                                    }

                                    p2.attack.hitstun.timer = new hitstunTimer(100);
                                    handlePush(p1,p2,"left",5,"hit");

                                    if(!p1.attack.mode.active){
                                        if(p1.characterinfo.hypermeter <= 100 - 1){
                                            p1.characterinfo.hypermeter += 1;
                                        } else{
                                            p1.characterinfo.hypermeter = 100;
                                        }
                                    }
                                    if(!p2.attack.mode.active){
                                        if(p2.characterinfo.hypermeter <= 100 - 1){
                                            p2.characterinfo.hypermeter += 1;
                                        } else{
                                            p2.characterinfo.hypermeter = 100;
                                        }
                                    }
                                } else if(!block || p2.jump){
                                    p2.characterinfo.hp -= p1.action.forwardhit.damage*p1.attack.mode.dmgMultiplicator;
                                    if(p2.characterinfo.hp < 0){
                                        p2.characterinfo.hp = 0;
                                    }

                                    p2.attack.hitstun.gotHit = true;
                                    p2.attack.hitstun.timer = new hitstunTimer(p1.action.forwardhit.hitstun);
                                    handlePush(p1,p2,"left",p1.action.forwardhit.push,"hit");

                                    if(!p1.attack.mode.active){
                                        if(p1.characterinfo.hypermeter <= 100 - p1.action.forwardhit.damage){
                                            p1.characterinfo.hypermeter += p1.action.forwardhit.damage;
                                        } else{
                                            p1.characterinfo.hypermeter = 100;
                                        }
                                    }
                                    if(!p2.attack.mode.active){
                                        if(p2.characterinfo.hypermeter <= 100 - 1){
                                            p2.characterinfo.hypermeter += 1;
                                        } else{
                                            p2.characterinfo.hypermeter = 100;
                                        }
                                    }
                                }
                            }
                            break;
                    }
                }
                break;
                case "airhit":
                    var p1hitboxX = p1.x + vz*p1.characterinfo.w*p1.action.airhit.range;
                    var p1hitboxYBelow = p1.y - p1.characterinfo.h + p1.characterinfo.h*p1.action.airhit.botY;
                    var p1hitboxYAbove = p1.y - p1.characterinfo.h + p1.characterinfo.h*p1.action.airhit.topY;

                    var p2hitboxX = p2.x - vz*p2.characterinfo.w/2;
                    var p2hitboxYBelow = p2.y;
                    var p2hitboxYAbove = p2.y - p2.characterinfo.h;

                    if(p1hitboxYAbove > p2hitboxYAbove && p1hitboxYBelow < p2hitboxYBelow){
                        switch(vz){
                            case 1:
                                var block = controls[p2.sid].right;
                                if(p1hitboxX > p2hitboxX){
                                    if(block && !p2.attack.hitstun.gotHit && !p2.jump){
                                        p2.attack.block = true;
                                        if(p2.characterinfo.hp > 1){
                                            p2.characterinfo.hp -= 1;
                                        }

                                        p2.attack.hitstun.timer = new hitstunTimer(100);
                                        handlePush(p1,p2,"right",5,"hit");

                                        if(!p1.attack.mode.active){
                                            if(p1.characterinfo.hypermeter <= 100 - 1){
                                                p1.characterinfo.hypermeter += 1;
                                            } else{
                                                p1.characterinfo.hypermeter = 100;
                                            }
                                        }
                                        if(!p2.attack.mode.active){
                                            if(p2.characterinfo.hypermeter <= 100 - 1){
                                                p2.characterinfo.hypermeter += 1;
                                            } else{
                                                p2.characterinfo.hypermeter = 100;
                                            }
                                        }
                                    } else if(!block || p2.jump){
                                        p2.characterinfo.hp -= p1.action.airhit.damage*p1.attack.mode.dmgMultiplicator;
                                        if(p2.characterinfo.hp < 0){
                                            p2.characterinfo.hp = 0;
                                        }

                                        p2.attack.hitstun.gotHit = true;
                                        p2.attack.hitstun.timer = new hitstunTimer(p1.action.airhit.hitstun);
                                        handlePush(p1,p2,"right",p1.action.airhit.push,"hit");

                                        if(!p1.attack.mode.active){
                                            if(p1.characterinfo.hypermeter <= 100 - p1.action.airhit.damage){
                                                p1.characterinfo.hypermeter += p1.action.airhit.damage;
                                            } else{
                                                p1.characterinfo.hypermeter = 100;
                                            }
                                        }
                                        if(!p2.attack.mode.active){
                                            if(p2.characterinfo.hypermeter <= 100 - 1){
                                                p2.characterinfo.hypermeter += 1;
                                            } else{
                                                p2.characterinfo.hypermeter = 100;
                                            }
                                        }
                                    }
                                }
                                break;
                            case -1:
                                var block = controls[p2.sid].left;
                                if(p1hitboxX < p2hitboxX){
                                    if(block && !p2.attack.hitstun.gotHit && !p2.jump){
                                        p2.attack.block = true;
                                        if(p2.characterinfo.hp > 1){
                                            p2.characterinfo.hp -= 1;
                                        }

                                        p2.attack.hitstun.timer = new hitstunTimer(100);
                                        handlePush(p1,p2,"left",5,"hit");

                                        if(!p1.attack.mode.active){
                                            if(p1.characterinfo.hypermeter <= 100 - 1){
                                                p1.characterinfo.hypermeter += 1;
                                            } else{
                                                p1.characterinfo.hypermeter = 100;
                                            }
                                        }
                                        if(!p2.attack.mode.active){
                                            if(p2.characterinfo.hypermeter <= 100 - 1){
                                                p2.characterinfo.hypermeter += 1;
                                            } else{
                                                p2.characterinfo.hypermeter = 100;
                                            }
                                        }
                                    } else if(!block || p2.jump){
                                        p2.characterinfo.hp -= p1.action.airhit.damage*p1.attack.mode.dmgMultiplicator;
                                        if(p2.characterinfo.hp < 0){
                                            p2.characterinfo.hp = 0;
                                        }

                                        p2.attack.hitstun.gotHit = true;
                                        p2.attack.hitstun.timer = new hitstunTimer(p1.action.airhit.hitstun);
                                        handlePush(p1,p2,"left",p1.action.airhit.push,"hit");

                                        if(!p1.attack.mode.active){
                                            if(p1.characterinfo.hypermeter <= 100 - p1.action.airhit.damage){
                                                p1.characterinfo.hypermeter += p1.action.airhit.damage;
                                            } else{
                                                p1.characterinfo.hypermeter = 100;
                                            }
                                        }
                                        if(!p2.attack.mode.active){
                                            if(p2.characterinfo.hypermeter <= 100 - 1){
                                                p2.characterinfo.hypermeter += 1;
                                            } else{
                                                p2.characterinfo.hypermeter = 100;
                                            }
                                        }
                                    }
                                }
                                break;
                        }
                    }
                    break;
                    case "crouchhit":
                        var p1hitboxX = p1.x + vz*p1.characterinfo.w*p1.action.crouchhit.range;
                        var p1hitboxYBelow = p1.y - p1.characterinfo.h + p1.characterinfo.h*p1.action.crouchhit.botY;
                        var p1hitboxYAbove = p1.y - p1.characterinfo.h + p1.characterinfo.h*p1.action.crouchhit.topY;

                        var p2hitboxX = p2.x - vz*p2.characterinfo.w/2;
                        var p2hitboxYBelow = p2.y;
                        var p2hitboxYAbove = p2.y - p2.characterinfo.h;

                        if(p1hitboxYAbove > p2hitboxYAbove && p1hitboxYBelow < p2hitboxYBelow){
                            switch(vz){
                                case 1:
                                    var block = controls[p2.sid].right;
                                    if(p1hitboxX > p2hitboxX){
                                        if(block && !p2.attack.hitstun.gotHit && !p2.jump){
                                            p2.attack.block = true;
                                            if(p2.characterinfo.hp > 1){
                                                p2.characterinfo.hp -= 1;
                                            }

                                            p2.attack.hitstun.timer = new hitstunTimer(100);
                                            handlePush(p1,p2,"right",5,"hit");

                                            if(!p1.attack.mode.active){
                                                if(p1.characterinfo.hypermeter <= 100 - 1){
                                                    p1.characterinfo.hypermeter += 1;
                                                } else{
                                                    p1.characterinfo.hypermeter = 100;
                                                }
                                            }
                                            if(!p2.attack.mode.active){
                                                if(p2.characterinfo.hypermeter <= 100 - 1){
                                                    p2.characterinfo.hypermeter += 1;
                                                } else{
                                                    p2.characterinfo.hypermeter = 100;
                                                }
                                            }
                                        } else if(!block || p2.jump){
                                            p2.characterinfo.hp -= p1.action.crouchhit.damage*p1.attack.mode.dmgMultiplicator;
                                            if(p2.characterinfo.hp < 0){
                                                p2.characterinfo.hp = 0;
                                            }

                                            p2.attack.hitstun.gotHit = true;
                                            p2.attack.hitstun.timer = new hitstunTimer(p1.action.crouchhit.hitstun);
                                            handlePush(p1,p2,"right",p1.action.crouchhit.push,"hit");

                                            if(!p1.attack.mode.active){
                                                if(p1.characterinfo.hypermeter <= 100 - p1.action.crouchhit.damage){
                                                    p1.characterinfo.hypermeter += p1.action.crouchhit.damage;
                                                } else{
                                                    p1.characterinfo.hypermeter = 100;
                                                }
                                            }
                                            if(!p2.attack.mode.active){
                                                if(p2.characterinfo.hypermeter <= 100 - 1){
                                                    p2.characterinfo.hypermeter += 1;
                                                } else{
                                                    p2.characterinfo.hypermeter = 100;
                                                }
                                            }
                                        }
                                    }
                                    break;
                                case -1:
                                    var block = controls[p2.sid].left;
                                    if(p1hitboxX < p2hitboxX){
                                        if(block && !p2.attack.hitstun.gotHit && !p2.jump){
                                            p2.attack.block = true;
                                            if(p2.characterinfo.hp > 1){
                                                p2.characterinfo.hp -= 1;
                                            }

                                            p2.attack.hitstun.timer = new hitstunTimer(100);
                                            handlePush(p1,p2,"left",5,"hit");

                                            if(!p1.attack.mode.active){
                                                if(p1.characterinfo.hypermeter <= 100 - 1){
                                                    p1.characterinfo.hypermeter += 1;
                                                } else{
                                                    p1.characterinfo.hypermeter = 100;
                                                }
                                            }
                                            if(!p2.attack.mode.active){
                                                if(p2.characterinfo.hypermeter <= 100 - 1){
                                                    p2.characterinfo.hypermeter += 1;
                                                } else{
                                                    p2.characterinfo.hypermeter = 100;
                                                }
                                            }
                                        } else if(!block || p2.jump){
                                            p2.characterinfo.hp -= p1.action.crouchhit.damage*p1.attack.mode.dmgMultiplicator;
                                            if(p2.characterinfo.hp < 0){
                                                p2.characterinfo.hp = 0;
                                            }

                                            p2.attack.hitstun.gotHit = true;
                                            p2.attack.hitstun.timer = new hitstunTimer(p1.action.crouchhit.hitstun);
                                            handlePush(p1,p2,"left",p1.action.crouchhit.push,"hit");

                                            if(!p1.attack.mode.active){
                                                if(p1.characterinfo.hypermeter <= 100 - p1.action.crouchhit.damage){
                                                    p1.characterinfo.hypermeter += p1.action.crouchhit.damage;
                                                } else{
                                                    p1.characterinfo.hypermeter = 100;
                                                }
                                            }
                                            if(!p2.attack.mode.active){
                                                if(p2.characterinfo.hypermeter <= 100 - 1){
                                                    p2.characterinfo.hypermeter += 1;
                                                } else{
                                                    p2.characterinfo.hypermeter = 100;
                                                }
                                            }
                                        }
                                    }
                                    break;
                            }
                        }
                        break;
                    case "special1":
                        var p1hitboxX = p1.x + vz*p1.characterinfo.w*p1.action.special1.range;
                        var p1hitboxYBelow = p1.y - p1.characterinfo.h + p1.characterinfo.h*p1.action.special1.botY;
                        var p1hitboxYAbove = p1.y - p1.characterinfo.h + p1.characterinfo.h*p1.action.special1.topY;

                        var p2hitboxX = p2.x - vz*p2.characterinfo.w/2;
                        var p2hitboxYBelow = p2.y;
                        var p2hitboxYAbove = p2.y - p2.characterinfo.h;

                        if(p1hitboxYAbove > p2hitboxYAbove && p1hitboxYBelow < p2hitboxYBelow){
                            switch(vz){
                                case 1:
                                    var block = controls[p2.sid].right;
                                    if(p1hitboxX > p2hitboxX){
                                        if(block && !p2.attack.hitstun.gotHit && !p2.jump){
                                            p2.attack.block = true;
                                            if(p2.characterinfo.hp > 1){
                                                p2.characterinfo.hp -= 1;
                                            }

                                            p2.attack.hitstun.timer = new hitstunTimer(100);
                                            handlePush(p1,p2,"right",5,"hit");

                                            if(!p2.attack.mode.active){
                                                if(p2.characterinfo.hypermeter <= 100 - 1){
                                                    p2.characterinfo.hypermeter += 1;
                                                } else{
                                                    p2.characterinfo.hypermeter = 100;
                                                }
                                            }
                                        } else if(!block || p2.jump){
                                            p2.characterinfo.hp -= p1.action.special1.damage*p1.attack.mode.dmgMultiplicator;
                                            if(p2.characterinfo.hp < 0){
                                                p2.characterinfo.hp = 0;
                                            }

                                            p2.attack.hitstun.gotHit = true;
                                            p2.attack.hitstun.timer = new hitstunTimer(p1.action.special1.hitstun);
                                            handlePush(p1,p2,"right",p1.action.special1.push,"hit");

                                            if(!p2.attack.mode.active){
                                                if(p2.characterinfo.hypermeter <= 100 - 1){
                                                    p2.characterinfo.hypermeter += 1;
                                                } else{
                                                    p2.characterinfo.hypermeter = 100;
                                                }
                                            }
                                        }
                                    }
                                    break;
                                case -1:
                                    var block = controls[p2.sid].left;
                                    if(p1hitboxX < p2hitboxX){
                                        if(block && !p2.attack.hitstun.gotHit && !p2.jump){
                                            p2.attack.block = true;
                                            if(p2.characterinfo.hp > 1){
                                                p2.characterinfo.hp -= 1;
                                            }

                                            p2.attack.hitstun.timer = new hitstunTimer(100);
                                            handlePush(p1,p2,"left",5,"hit");

                                            if(!p2.attack.mode.active){
                                                if(p2.characterinfo.hypermeter <= 100 - 1){
                                                    p2.characterinfo.hypermeter += 1;
                                                } else{
                                                    p2.characterinfo.hypermeter = 100;
                                                }
                                            }
                                        } else if(!block || p2.jump){
                                            p2.characterinfo.hp -= p1.action.special1.damage*p1.attack.mode.dmgMultiplicator;
                                            if(p2.characterinfo.hp < 0){
                                                p2.characterinfo.hp = 0;
                                            }

                                            p2.attack.hitstun.gotHit = true;
                                            p2.attack.hitstun.timer = new hitstunTimer(p1.action.special1.hitstun);
                                            handlePush(p1,p2,"left",p1.action.special1.push,"hit");

                                            if(!p2.attack.mode.active){
                                                if(p2.characterinfo.hypermeter <= 100 - 1){
                                                    p2.characterinfo.hypermeter += 1;
                                                } else{
                                                    p2.characterinfo.hypermeter = 100;
                                                }
                                            }
                                        }
                                    }
                                    break;
                            }
                        }
                        break;
                    case "special2":
                        var p1hitboxX = p1.x + vz*p1.characterinfo.w*p1.action.special2.range;
                        var p1hitboxYBelow = p1.y - p1.characterinfo.h + p1.characterinfo.h*p1.action.special2.botY;
                        var p1hitboxYAbove = p1.y - p1.characterinfo.h + p1.characterinfo.h*p1.action.special2.topY;

                        var p2hitboxX = p2.x - vz*p2.characterinfo.w/2;
                        var p2hitboxYBelow = p2.y;
                        var p2hitboxYAbove = p2.y - p2.characterinfo.h;

                        if(p1hitboxYAbove > p2hitboxYAbove && p1hitboxYBelow < p2hitboxYBelow){
                            switch(vz){
                                case 1:
                                    var block = controls[p2.sid].right;
                                    if(p1hitboxX > p2hitboxX){
                                        if(block && !p2.attack.hitstun.gotHit && !p2.jump){
                                            p2.attack.block = true;
                                            if(p2.characterinfo.hp > 1){
                                                p2.characterinfo.hp -= 1;
                                            }

                                            p2.attack.hitstun.timer = new hitstunTimer(100);
                                            handlePush(p1,p2,"right",5,"hit");

                                            if(!p2.attack.mode.active){
                                                if(p2.characterinfo.hypermeter <= 100 - 1){
                                                    p2.characterinfo.hypermeter += 1;
                                                } else{
                                                    p2.characterinfo.hypermeter = 100;
                                                }
                                            }
                                        } else if(!block || p2.jump){
                                            p2.characterinfo.hp -= p1.action.special2.damage*p1.attack.mode.dmgMultiplicator;
                                            if(p2.characterinfo.hp < 0){
                                                p2.characterinfo.hp = 0;
                                            }

                                            p2.attack.hitstun.gotHit = true;
                                            p2.attack.hitstun.timer = new hitstunTimer(p1.action.special2.hitstun);
                                            handlePush(p1,p2,"right",p1.action.special2.push,"hit");

                                            if(!p2.attack.mode.active){
                                                if(p2.characterinfo.hypermeter <= 100 - 1){
                                                    p2.characterinfo.hypermeter += 1;
                                                } else{
                                                    p2.characterinfo.hypermeter = 100;
                                                }
                                            }
                                        }
                                    }
                                    break;
                                case -1:
                                    var block = controls[p2.sid].left;
                                    if(p1hitboxX < p2hitboxX){
                                        if(block && !p2.attack.hitstun.gotHit && !p2.jump){
                                            p2.attack.block = true;
                                            if(p2.characterinfo.hp > 1){
                                                p2.characterinfo.hp -= 1;
                                            }

                                            p2.attack.hitstun.timer = new hitstunTimer(100);
                                            handlePush(p1,p2,"left",5,"hit");

                                            if(!p2.attack.mode.active){
                                                if(p2.characterinfo.hypermeter <= 100 - 1){
                                                    p2.characterinfo.hypermeter += 1;
                                                } else{
                                                    p2.characterinfo.hypermeter = 100;
                                                }
                                            }
                                        } else if(!block || p2.jump){
                                            p2.characterinfo.hp -= p1.action.special2.damage*p1.attack.mode.dmgMultiplicator;
                                            if(p2.characterinfo.hp < 0){
                                                p2.characterinfo.hp = 0;
                                            }

                                            p2.attack.hitstun.gotHit = true;
                                            p2.attack.hitstun.timer = new hitstunTimer(p1.action.special2.hitstun);
                                            handlePush(p1,p2,"left",p1.action.special2.push,"hit");

                                            if(!p2.attack.mode.active){
                                                if(p2.characterinfo.hypermeter <= 100 - 1){
                                                    p2.characterinfo.hypermeter += 1;
                                                } else{
                                                    p2.characterinfo.hypermeter = 100;
                                                }
                                            }
                                        }
                                    }
                                    break;
                            }
                        }
                        break;
    }
}

function checkKO(p1,p2){
    if(p1.characterinfo.hp === 0){
        p1.characterinfo.ko = true;
        player[p1.sid].user.won = false;
        player[p2.sid].user.won = true;
        endGame(player[p1.sid],player[p2.sid]);
    }else if(p2.characterinfo.hp === 0){
        p2.characterinfo.ko = true;
        player[p1.sid].user.won = true;
        player[p2.sid].user.won = false;
        endGame(player[p1.sid],player[p2.sid]);
    }
}

function handlePush(p1,p2,direction,distance,action){
    var boundaryL = p1.characterinfo.w/2 + 20;
    var boundaryR  = mapX - (p1.characterinfo.w/2) - 20;
    
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
        case "projectile":
            switch(direction){
                case "left":
                    if(p2.x !== boundaryL){
                        var push = p2.x - distance;
                        if(push >= boundaryL){
                            p2.x = push;
                        } else if(push < boundaryL){
                            p2.x = boundaryL;
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
                    }
                    break;
            }
            break;
    }
}

function handleHitstun(){
    for(var i in lobby){
        if(!lobby[i].options)
            break;
        var characterRed = lobby[i].red;
        var characterBlue = lobby[i].blue;
        
        if(characterRed.attack.hitstun.gotHit || characterRed.attack.block){
            var hitstunRed = characterRed.attack.hitstun.timer;
            hitstunRed.check(characterRed);
        }
        
        if(characterBlue.attack.hitstun.gotHit || characterBlue.attack.block){
            var hitstunBlue = characterBlue.attack.hitstun.timer;
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
        if(defender.attack.hitstun.gotHit){
            var curTime = new Date();
            if(curTime.getTime() - this.start.getTime() > this.duration){
                defender.attack.hitstun.gotHit = false;
            }
        } else if(!defender.attack.hitstun.gotHit){
            var curTime = new Date();
            if(curTime.getTime() - this.start.getTime() > this.duration){
                defender.attack.block = false;
            }
        }
    };
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
function timerHandler(characterRed, characterBlue){
    var timer;
    var prevTime;
    var enabled;
    var characterRed;
    var characterBlue;

    this.timer = 99;
    this.prevTime = new Date();
    this.enabled = true;
    this.characterRed = characterRed;
    this.characterBlue = characterBlue;

    this.update = function(){
        if(this.enabled && this.timer > 0){
                var curTime = new Date();
                if(curTime.getTime() - this.prevTime.getTime() >= 1000){
                        this.timer--;
                        this.prevTime = curTime;
                }
        } else{
                this.enabled = false;
                if(this.characterRed.hp > this.characterBlue.hp){
                    player[this.characterRed.sid].user.won = true;
                    player[this.characterBlue.sid].user.won = false;
                    endGame(player[characterRed.sid],player[characterBlue.sid]);
                } else if(this.characterRed.hp < this.characterBlue.hp){
                    player[this.characterRed.sid].user.won = false;
                    player[this.characterBlue.sid].user.won = true;
                    endGame(player[characterRed.sid],player[characterBlue.sid]);
                } else if(this.characterRed.hp === this.characterBlue.hp){
                    player[this.characterRed.sid].user.won = false;
                    player[this.characterBlue.sid].user.won = false;
                    endGame(player[characterRed.sid],player[characterBlue.sid]);
                }
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
                if(characterRed.attack.mode.active){
                    characterRed.characterinfo.hypermeter -= 5;
                    if(characterRed.characterinfo.hypermeter <= 0){
                        characterRed.characterinfo.hypermeter = 0;
                        characterRed.attack.mode.active = false;
                        characterRed.attack.mode.dmgMultiplicator = 1;
                    }
                } else{
                    if(characterRed.characterinfo.hypermeter < 100){
                        characterRed.characterinfo.hypermeter++;
                    }
                }
                
                if(characterBlue.attack.mode.active){
                    characterBlue.characterinfo.hypermeter -= 5;
                    if(characterBlue.characterinfo.hypermeter <= 0){
                        characterBlue.characterinfo.hypermeter = 0;
                        characterBlue.attack.mode.active = false;
                        characterBlue.attack.mode.dmgMultiplicator = 1;
                    }
                } else{
                    if(characterBlue.characterinfo.hypermeter < 100){
                        characterBlue.characterinfo.hypermeter++;
                    }   
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
//            console.log(lobby[lc],lc);

            lobby[lc][slot] = character[slot];
            //lobby[lc] = {blue:character["blue"],red:character["red"]};
        //} else {
        //
        //}

//        console.log(lobby[lc],slot);
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
//        console.log(lc);
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
                mapY : 600,
                playerStartDelta : 120,
                color : slot,
                nameRed:nameRed,
                eloRed:eloRed,
                nameBlue:nameBlue,
                eloBlue: eloBlue
            };
            
            var characterRed = lobby[lC].red;
            var characterBlue = lobby[lC].blue;
//            console.log("characterRed: ", characterRed.name);
//            console.log("characterBlue: ", characterBlue.name);
            
            var gameTimer = new timerHandler(characterRed, characterBlue);
            var hypermeter = new hypermeterHandler();

            lobby[lC].options = {mapX : options.mapX, mapY:options.mapY};
            lobby[lC].options.timerObj = gameTimer;
            lobby[lC].options.hypermeterObj = hypermeter;

            characterBlue.start = characterBlue.x = 150 + options.playerStartDelta;
            characterRed.start = characterRed.x = 850 - options.playerStartDelta;
            characterBlue.y=characterRed.y= options.mapY;
            characterBlue.lobby=characterRed.lobby= lC;
            characterBlue.attack.endlag.timer =  
            characterRed.attack.endlag.timer = new Date();

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
                if(slot != "observer") controls[sid] = {left:false,right:false,moveup:false,movedown:false,hit:false,special1:false,special2:false,hyper:false,mode:false,dashL:false,dashR:false};
            }
            console.log("Lobby " + lC + " starts Playing");
        }
        player[socket.id].color = slot;
        player[socket.id].lobby = lc;
}