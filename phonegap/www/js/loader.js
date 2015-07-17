window.addEventListener("load", function () {
    menu.init(); 
}, false)


var loader = {

    init: function() {
        
    },
    preload : function() {
        game.phaser.load.script('filter', 'https://cdn.rawgit.com/photonstorm/phaser/master/filters/Fire.js');

        game.phaser.load.spritesheet('muaythai', 'muay_thai.png', 400, 300, 14);
        game.phaser.load.spritesheet('muaythaiblue', 'img/mt.png', 400, 300, 42);
        game.phaser.load.spritesheet('muaythaired', 'img/mt2.png', 400, 300, 42);
        game.phaser.load.spritesheet('fx1', 'img/fx1.png', 70, 70, 4);
        game.phaser.load.image('bgtrans', 'img/bgtrans.png');
        game.phaser.load.image('ebene1', 'Pyramiden/Ebene1.png');
        game.phaser.load.image('ebene2', 'Pyramiden/Ebene2.png');
        game.phaser.load.image('ebene3', 'Pyramiden/Ebene3.png');
        game.phaser.load.image('ebene4', 'Pyramiden/Ebene4.png');
        game.phaser.load.image('interface', 'img/Interface.png');
        game.phaser.load.image('interface_background', 'img/Interface_Background.png');
        game.phaser.load.image('healthbar_p1', 'img/Healthbar_P1.png');
        game.phaser.load.image('healthbar_p2', 'img/Healthbar_P2.png');
        game.phaser.load.image('meterbar_p1', 'img/Meterbar_P1.png');
        game.phaser.load.image('meterbar_p2', 'img/Meterbar_P2.png');
        
        game.phaser.load.spritesheet('avataranimationAPlayerA', 'img/Avatar_AnimationAPlayerA_Spritesheet.png', 180, 180, 36);
        game.phaser.load.spritesheet('avataranimationAPlayerB', 'img/Avatar_AnimationAPlayerB_Spritesheet.png', 180, 180, 36);
        game.phaser.load.spritesheet('avataranimationBPlayerA', 'img/Avatar_AnimationBPlayerA_Spritesheet.png', 160, 160, 18);
        game.phaser.load.spritesheet('avataranimationBPlayerB', 'img/Avatar_AnimationBPlayerB_Spritesheet.png', 160, 160, 18);
    },
}