var loadingscreen = {
    debug:false,
    init:function(){
        $('#loadingscreen').show();
        $('#loadingmessage').html('Initializing Canvas');
        $('#progressbar').width("0%")
        loadingscreen.proc = 0;
        
        var stillLoading = setInterval(function(){
            if ( game.hasInitializedCanvas ){
                loadingscreen.setProgressbar('Initializing Map Grid',15);
                game.hasInitializedCanvas = false;
            }
            if ( game.hasInitializedMapGrid ){
                loadingscreen.setProgressbar('Loading Game items',15);
                game.hasInitializedMapGrid = false;
            }
            if ( game.hasLoadedItems ){
                loadingscreen.setProgressbar('Loading Map Information',20);
                game.hasLoadedItems = false;
            }
            if ( game.hasLoadedMap ){
                loadingscreen.setProgressbar('Loading Map Sprites',20);
                game.hasLoadedMap = false;
            }
            if ( game.hasLoadedMapSprites ){
                loadingscreen.setProgressbar('Initializing Map',20);
                game.hasLoadedMapSprites = false;
            }
            if ( game.hasInitializedMap ){
                loadingscreen.setProgressbar('Finished Loading',10);
                game.hasInitializedMap = false;
            }
            
            if(loadingscreen.proc==100){
                $('#loadingscreen').hide();
                clearInterval(stillLoading);
            }
       },100);
        
    },
    setProgressbar:function(msg,pro){
      $('#loadingmessage').html(msg);
      loadingscreen.proc += pro;
      if(loadingscreen.debug) console.log(msg,loadingscreen.proc);
      $('#progressbar').width(loadingscreen.proc+"%")  
    },
}


