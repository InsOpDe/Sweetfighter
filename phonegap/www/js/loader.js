window.addEventListener("load", function () {
    menu.init(); 
}, false)


var loader = {

    init: function() {
        
    },
    preload : function() {

        var color1 = game.options.color;
        var color2 = '';
        if(color1 == 'red'){
            color2 = 'blue';
        } else {
            color2 = 'red';
        }
        var charname1 = game.options.characters[color1].name;
        var charname2 = game.options.characters[color2].name;
        console.log(charname1,color1);
        console.log(charname2,color2);

        var framesinfo1 = game.options.characters[color1].framesinfo;
        var framesinfo2 = game.options.characters[color2].framesinfo;

        //game.phaser.load.script('filter', 'https://cdn.rawgit.com/photonstorm/phaser/master/filters/Fire.js');

        //game.phaser.load.spritesheet('muaythai', 'muay_thai.png', 400, 300, 14);
        game.phaser.load.spritesheet(color1, 'img/' + charname1 + 'blue.png', framesinfo1.w, framesinfo1.h, framesinfo1.count);
        game.phaser.load.spritesheet(color2, 'img/' + charname2 + 'red.png', framesinfo2.w, framesinfo2.h, framesinfo2.count);
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
        game.phaser.load.image('dmgbar', 'img/Damagebar.png');
        game.phaser.load.image('meterbar', 'img/Meterbar.png');
        
        //Have to be a spritesheet later on, with all avatar icons
        game.phaser.load.spritesheet('avatar', 'img/avatar.png', 180, 180 , 2);
        
        game.phaser.load.spritesheet('avataranimationAPlayerA', 'img/Avatar_AnimationAPlayerA_Spritesheet.png', 180, 180, 36);
        game.phaser.load.spritesheet('avataranimationAPlayerB', 'img/Avatar_AnimationAPlayerB_Spritesheet.png', 180, 180, 36);
        game.phaser.load.spritesheet('avataranimationBPlayerA', 'img/Avatar_AnimationBPlayerA_Spritesheet.png', 160, 160, 18);
        game.phaser.load.spritesheet('avataranimationBPlayerB', 'img/Avatar_AnimationBPlayerB_Spritesheet.png', 160, 160, 18);

        game.phaser.load.spritesheet('projectile', 'img/EnergySprite.png',80,120,4);
        game.phaser.load.spritesheet('projectileHyper', 'img/EnergySpriteHyper.png',200,300,4);

        //audio
        game.phaser.load.audio('punch1', 'punch1.wav');
        game.phaser.load.audio('punch2', 'punch2.wav');
        game.phaser.load.audio('punch3', 'punch3.wav');
    },
}