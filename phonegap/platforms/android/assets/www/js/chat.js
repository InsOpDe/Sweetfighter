var chat = {
    init: function(){
        //eigene Scrollpane einbinden

        $('#chatMessage').keypress(function (e) {
            if (e.which == 13) {
                chat.send();
            }
        });
    
    },
    run: function(){
        // neue Nachricht
        multiplayer.socket.on('chat', function (data) {
            chat.display(data);
        });
        
    },
    display: function (data){
        var zeit = new Date(data.tick);
            $('#chatWindow').append(
                $('<p></p>').append(
                    // Uhrzeit
                    $('<span>').text('[' +
                        (zeit.getHours() < 10 ? '0' + zeit.getHours() : zeit.getHours())
                        + ':' +
                        (zeit.getMinutes() < 10 ? '0' + zeit.getMinutes() : zeit.getMinutes())
                        + '] '
                    ),
                    // Name
                    $('<b>').text(typeof(data.player) != 'undefined' ? data.player + ': ' : ''),
                    // Text
                    $('<span>').text(typeof(data.text) != 'undefined' ? data.text : data.action))  
            );
    },
    send: function (){
        // Eingabefelder auslesen
        var name = game.team;//$('#name').val();
        var text = $('#chatMessage').val();
        // Socket senden
        multiplayer.socket.emit('chat', { player: name, text: text });
        // Text-Eingabe leeren
        $('#chatMessage').val('');
    },
//    gotMessage: function(){
//        
//    }
};
