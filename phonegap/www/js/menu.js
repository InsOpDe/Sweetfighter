musicPlaying = true;
var menu = {
    options : {character:'muaythai',map:'desert'},
    uiTemp:true,
    blink: false,
    init : function() {

        setInterval(function(){
            //console.log("++++");
            //var rand = Math.random();
            //var ui;
            //if(rand <0.5){
            //    ui = $('#fight');
            //} else {
            //    ui = $('#ranking')
            //}
            //if(menu.uiTemp) menu.uiTemp.removeClass('animation');
            //menu.uiTemp = ui;
            //ui.addClass('animation');
            $('#ranking').removeClass('animation');
            $('#fight').removeClass('animation');
            if(menu.uiTemp && menu.blink){
                $('#ranking').addClass('animation');
                $('#fight').addClass('animation');
                menu.uiTemp = false;
            } else {
                menu.uiTemp = true;
            }

        },2000);
        menu.onResize();
        menu.fight = $('#fight');
        menu.fight.bind('click tap',menu.clicked)


        $('#back').bind('click tap',function(){
            $('#rankingtable').hide();
            $('#shadow').hide();
            $('#gameover').hide();
            $('#back').hide();
            menu.blink = true;
        });

        $('#menumusicbutton').bind('click tap',function(){

            if(!musicPlaying){
                $('#menumusic').trigger("play");
                musicPlaying = true;
                if(app)media.play();
            } else {
                $('#menumusic').trigger("pause");
                musicPlaying = false;
                if(app)media.pause();
            }

        });



        multiplayer.init();
        $('#loginbutton').click(function(){
            menu.blink = true;
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
            menu.blink = false;
            $('#shadow').show();
            $('#rankingtable').show();
            $('#back').show();
            multiplayer.socket.emit('ranking');
        });

        multiplayer.socket.on('ranking', function (data) {
            var counter = 1;
            $('#rankingtable tbody > tr').remove();
            for(var i in data){
                $('#rankingtable tbody').append('<tr><td>' + (counter++) +'</td><td>' + data[i].name +'</td><td>' + data[i].elo +'</td><td>' + data[i].favChar +'</td></tr>');
            }
        });
    },
    clicked : function(e){
        menu.blink = false;
        $('#shadow').show();
//        var element = $(e.currentTarget);

        var id = $(e.currentTarget).attr('id')

        console.log(id);

        switch (id) {
            case 'fight':
                $('#selectcharacter div').empty();
                $('#selectcharacter').show();
                $('#selectcharacter>div')
                        .append('<div id="muaythai" style="' +
                            'height:' + $('#selectcharacter div').height() + 'px;'+
                            'width:' + $('#selectcharacter div').height() + 'px;'+
                            '"></div>');
                $('#selectcharacter>div')
                        .append('<div id="frau" style="' +
                            'height:' + $('#selectcharacter div').height() + 'px;'+
                            'width:' + $('#selectcharacter div').height() + 'px;'+
                            '"></div>');
                $('#muaythai').bind('click tap',menu.selectMap);
                $('#frau').bind('click tap',menu.selectMap);
                break;


        }

    },
    gameover : function(data){
        keyboard.block = true;
        setTimeout(function(){
            try{
                game.phaser.destroy();
            } catch(e){
                console.log(e);
            }
            console.log(data);
            var text = "";
            $('#gameover').removeClass('youwin');
            $('#gameover').removeClass('youlose');
            if(data.won){
                $('#gameover').addClass('youwin');
                text = "Elo dazugewonnen: " ;
            } else {
                $('#gameover').addClass('youlose');
                text = "Elo verloren: " ;
            }
            text += data.diff + "<br> Jetztiges Elo: " + data.elo + "<br> Aktueller Platz: " + data.rank;
            game.options = undefined;
            $('#gameover div').html(text);
            $('#gamescreen').hide();
            $('#gameover').show();
            $('#back').show();
            $('#menumusicbutton').show();
            removeTouchInterface();
            removeShake();
            musicPlaying = false;
            if(app)media.pause();

            $('#menumusic').trigger("play");
            musicPlaying = true;
            if(app)media.play();
        },3000);

    },
    selectMap : function(e){
        menu.options.character = $(e.currentTarget).attr('id');

        $('#selectscene div').empty();
        $('#selectcharacter').hide();
        $('#selectscene').show();
        $('#selectscene>div')
                .append('<div id="desert" style="' +
                    'height:' + $('#selectscene div').height() + 'px;'+
                    'width:' + $('#selectscene div').height() + 'px;'+
                    '"></div>');
        $('#selectscene>div')
                .append('<div id="jungle" style="' +
                'height:' + $('#selectscene div').height() + 'px;'+
                'width:' + $('#selectscene div').height() + 'px;'+
                '"></div>');
        $('#desert').bind('click tap',menu.startGame);
        $('#jungle').bind('click tap',menu.startGame);

    },

    startGame : function(e){
        menu.options.map = $(e.currentTarget).attr('id');
        $('#selectscene').hide();
        $('#menumusicbutton').hide();
//        $('#shadow').hide()
//        $('#menu').hide()
        $('#waiting').show();
        $('#gamescreen').show();


        loader.init();
        keyboard.init();
        multiplayer.startGame();
        debug.init();
        chat.init();

        //warten bis der server gameOptions schickt
        multiplayer.socket.on('gameOptions', function (data) {
            //nur einmal initialisieren (bei serverrestart oderso)
            if( typeof game.options == "undefined"){
                console.log("init");
                game.options = data;
                game.init();
            }
        });
    },
    onResize : function(){
        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight;
        var ratio = windowHeight/windowWidth;
        var standard = 0.36;
        console.log(ratio/standard, (standard/ratio));
        var diff = standard/ratio;
        var boxring = $('#fight');
        var ranking = $('#ranking');
        boxring.css({top: windowHeight*0.3, left: (-1)*windowWidth*0.07});
        boxring.height(windowHeight*(0.57*(diff*1.5)));
        boxring.width(boxring.height()*1.5);

        ranking.css({top: windowHeight*0.1, right: windowWidth*(0.05*(diff))});
        ranking.height(windowHeight*(0.35*diff));
        ranking.width(ranking.height());
    },


}

window.onresize = menu.onResize;