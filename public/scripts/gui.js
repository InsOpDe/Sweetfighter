
/**
 * The gui for pioneer/constructors
 */
var buildgui = {
    selection: 0,
    pioneerBuildings : ['Storage Unit', 'Gun-Turret', "Oil Tank"],
    constructorBuildings : ['Mine', 'Big Energy', 'Bigfac'],
    bigfacUnits : ['Constructor'],
    init : function(buildingTypeSelection){
        
        var buildingArray = [];
        switch(buildingTypeSelection){
            case 1:
                buildingArray = buildgui.pioneerBuildings;
                break;
            case 2:
                buildingArray = buildgui.constructorBuildings;
                break;
            case 3:
                buildingArray = buildgui.bigfacUnits;
                break;
                
        }
        
        
        //make the list
        var list = $("#buildguilist");
        list.empty();
        for(var i in buildingArray){
            var building = buildingArray[i];
            var item = $('<li>'+building+'</li>');
            item.val(i);
            (function(i){
                item.click(function(){
                    buildgui.selection = i;
                    list.children().each(function(){
                        $(this).removeClass("active");
                    })
                    $(this).addClass("active");
                })
            })(i)
            list.append(item);
        }
        
        //buttons
        $("#buildguidone").unbind( "click" );
        $("#buildguidone").click(function(){
            $("#buildgui").hide();
            if(buildingTypeSelection == 1){
                mouse.deploy(buildingArray[buildgui.selection].replace(/\s/g, '').toLowerCase());
            } else if (buildingTypeSelection == 3){
                mouse.buildUnit(buildingArray[buildgui.selection].replace(/\s/g, '').toLowerCase(),1);//todo speed 1-3 einbauen
            }
        })
        $("#buildguiabort").click(function(){
            $("#buildgui").hide();
            if(buildingTypeSelection <= 2){
                mouse.mouseBuild = false;
                game.fgContainer.removeChild(mouse.spriteObject);
            }
        })
        
        $("#buildgui").show();
        
    },
    
}


//piemenu


var piemenu = {
    piemenuentries:[["Power On","Power Off"],"Info","Self-Destruct"],
    handleClick:function(i){
       console.log(piemenu.piemenuentries[i]);  
    },
    init: function(itemname){
        $("#circle").toggleClass('open');
        $("#circle").empty();
        
        $("#circular-menu").css("top",mouse.screenY-125);
        $("#circular-menu").css("left",mouse.screenX-125);
        
//        $("#circle").append("<div >Power-On</div>");
        for(var i in piemenu.piemenuentries){
            
            if(i==0 && mouse.menuToggled.hasOwnProperty("turnOn")){
                if(mouse.menuToggled.turnOn == false){
                    var item = $('<div>'+piemenu.piemenuentries[i][0]+'</div>');
                } else {
                    var item = $('<div>'+piemenu.piemenuentries[i][1]+'</div>');
                }
                (function(i){
                    item.click(function(){
//                        mouse.menuToggled.turnOn ^= true;
                        game.turnOn(mouse.menuToggled);
                    })
                })(i)
            } else {
                 var item = $('<div>'+piemenu.piemenuentries[i]+'</div>');
                
                (function(i){
                    item.click(function(){
                        piemenu.handleClick(i);
                    })
                })(i)
            }
            $("#circle").append(item);
            
//            item.val(i);
//            (function(i){
//                item.click(function(){
//                    buildgui.selection = i;
//                    list.children().each(function(){
//                        $(this).removeClass("active");
//                    })
//                    $(this).addClass("active");
//                })
//            })(i)
        }
        

        var items = $("#circle").children();
        for(var i = 0, l = items.length; i < l; i++) {
          items[i].style.left = (50 - 35*Math.cos(-0.5 * Math.PI - 2*(1/l)*i*Math.PI)).toFixed(4) + "%";
          items[i].style.top = (50 + 35*Math.sin(-0.5 * Math.PI - 2*(1/l)*i*Math.PI)).toFixed(4) + "%";
        }
        
        
        //document.querySelector('.menu-button').onclick = function(e) {
        $("#circle").click( function(e) {
             mouse.menuToggled = undefined;
           e.preventDefault(); 
           $("#circle").removeClass('open')
//           $("#circle").toggleClass('open')

        })
        
    }
}
