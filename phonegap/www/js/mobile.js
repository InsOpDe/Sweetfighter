var media;
function initMobile() {
//    alert("initMobile");
    
    window.onerror = function(message, url, lineNumber) {  
        alert(message + " " + url + " " + lineNumber);
        return true;
    }; 
    
    
    document.addEventListener("deviceready", onDeviceReady, false);

}

function onDeviceReady(){
    alert("onDeviceReady");
//    multiplayer.socket.emit('chat', { name: "mobile device", text: "onDeviceReady" });
    //if device pauses/gets in background/or closes
    document.addEventListener("pause", function(){
        multiplayer.socket.emit('chat', { name: "mobile device", text: "Disconnected/onPause" });
//        multiplayer.socket.emit('disconnect');
        multiplayer.socket.disconnect();
    }, false);


    media = new Media('menu.wav', function(){ alert("success")
    },function(e){alert("error " + JSON.stringify(e))});
    media.play();
    
}