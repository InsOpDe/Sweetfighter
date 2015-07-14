var menu = {
    options : {character:'muaythai',map:'desert'},
    init : function() {
        menu.fight = $('#fight');
        menu.fight.bind('click tap',menu.clicked)
    },
    clicked : function(e){
        $('#shadow').show();
//        var element = $(e.currentTarget);
        
        var id = $(e.currentTarget).attr('id')

        console.log(id);

        switch (id) {
            case 'fight':
                $('#selectcharacter').show();
                $('#selectcharacter div')
                        .append('<div id="muaythai" style="background-image: url(\'../img/menu/muaythai.png\');' +
                            'height:' + $('#selectcharacter div').height() + 'px;'+
                            'width:' + $('#selectcharacter div').height() + 'px;'+
                            '"></div>')
                $('#muaythai').bind('click tap',menu.selectMap);
                break;
            
            
        }
        
    },
    selectMap : function(e){
        menu.options.character = $(e.currentTarget).attr('id')
        $('#selectcharacter').hide();
        $('#selectscene').show();
        
        $('#selectscene div')
                .append('<div id="desert" style="background-image: url(\'../img/menu/desert.png\');' +
                    'height:' + $('#selectscene div').height() + 'px;'+
                    'width:' + $('#selectscene div').height() + 'px;'+
                    '"></div>')
        $('#desert').bind('click tap',menu.startGame);
        
    },
    
    startGame : function(e){
        menu.options.map = $(e.currentTarget).attr('id')
        $('#selectscene').hide()
//        $('#shadow').hide()
//        $('#menu').hide()
        $('#waiting').show()
        $('#gamescreen').show()
        
        
        loader.init();
        keyboard.init();
        debug.init();
        multiplayer.init();	
        chat.init();

        //warten bis der server gameOptions schickt
        multiplayer.socket.on('gameOptions', function (data) {
            //nur einmal initialisieren (bei serverrestart oderso)
            if( typeof game.options == "undefined"){
                game.options = data;
                game.init();
            }
        });
    }
    
}