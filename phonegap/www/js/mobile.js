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
    //alert("onDeviceReady");
//    multiplayer.socket.emit('chat', { name: "mobile device", text: "onDeviceReady" });
    //if device pauses/gets in background/or closes
    document.addEventListener("pause", function(){
        multiplayer.socket.emit('chat', { name: "mobile device", text: "Disconnected/onPause" });
//        multiplayer.socket.emit('disconnect');
        multiplayer.socket.disconnect();
    }, false);


    //var mp3URL = getMediaURL('menu.wav');

    playMusic(false)
    
}

//Modify audio file path, if the target device is android
function getMediaURL(url) {
    //if (device.platform.toLowerCase() === "android") {
        return "/android_asset/www/" + url;
    //}

    return url;
}

function playSound(path) {
    var mp3URL = getMediaURL(path);
    var media2 = new Media(mp3URL);
    media2.play();
}

function playMusic(ingame){

    if(!ingame)
        var path = getMediaURL('menu.wav');
    else
        var path = getMediaURL('ingame.wav');

    media = new Media(path, function(){
        },function(e){
            //alert("error " + JSON.stringify(e))
        },
        function(e){
            if(e == 4 && musicPlaying){
                //media.play();
                playMusic(ingame);
                musicPlaying = true;
            }
        });
    media.play();
}