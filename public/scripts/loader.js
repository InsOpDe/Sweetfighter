var main = {}

window.addEventListener("load", function () {
	loader.init();
        keyboard.init();
	debug.init();
        multiplayer.init();	
        chat.init();
        game.init();
        
}, false)


var loader = {
    loaded: true,
    loadedCount: 0,
    totalCount: 0,
    init: function() {
        
    },
    preload : function() {

        game.phaser.load.image('player', 'bunny.png');
//        game.phaser.load.image('sky', 'assets/skies/sunset.png');

    },
    
    loadImage: function(url) {
        
        //console.log(url);
//        this.totalCount++;
//        this.loaded = false;
        //$('#loadingscreen').show();
        var image = new Image();
        image.src = url;
        image.onload = loader.itemLoaded(url);
        return image;
    },
    itemLoaded: function(url) {
        
        game.loadedCount++;
        //if(url)console.log("loaded: "+url+"("+loader.loadedCount+"/"+loader.totalCount+")");
        //$('#loadingmessage').html('loaded ' + game.loadedCount + ' of ' + game.hasToLoadCount);
        //console.log(game.loadedCount,game.hasToLoadCount);
        if (game.loadedCount === game.hasToLoadCount) {
//            loader.loaded = true;
            //$('#loadingscreen').hide();
//            if (loader.onload) {
//                loader.onload();
//                loader.onload = undefined;
//            }
        }
    }
}