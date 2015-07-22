var menu = {
    options : {character:'muaythai',map:'desert'},
    init : function() {
        menu.fight = $('#fight');
        menu.fight.bind('click tap',menu.clicked)


        $('#back').bind('click tap',function(){
            $('#rankingtable').hide();
            $('#shadow').hide();
        });



        multiplayer.init();
        $('#loginbutton').click(function(){
            var name = $('#name').val();
            var pass = $('#pass').val();
            multiplayer.socket.emit('login', {name:name,pass:pass} );
        });

        multiplayer.socket.on('login', function (data) {
           if (data === false){
               $('#shadow').hide();
               $('#login').hide();
           } else {
               $('#loginerror').show();
           }
        });


        $('#ranking').click(function(){
            $('#shadow').show();
            $('#rankingtable').show();
            $('#back').show();
            multiplayer.socket.emit('ranking');
        });

        multiplayer.socket.on('ranking', function (data) {
            var counter = 1;
            for(var i in data){
                $('#rankingtable tr:last').after('<tr><td>' + (counter++) +'</td><td>' + data[i].name +'</td><td>' + data[i].elo +'</td><td>' + data[i].favChar +'</td></tr>');
            }
        });
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
        multiplayer.startGame();
        debug.init();
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