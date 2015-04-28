// ressources.js
// ========
module.exports = {
    //first give Ressources
    giveRessources: function (teamItems) {
        teamItemsArr = [];
        teamItemsArr = teamItems;
        //if(teamItemsArr) console.log(teamItems);
        for(var i in teamItems){
            var item = teamItems[i];
            //var item2 = teamItemsArr[i];
            //console.log(item.uid,item.name,item.ressources,item.storage);
            //console.log(item2.uid,item2.name,item2.ressources,item2.storage);
            
            
            if(item.name == 'mine' && item.action != "construct"){
                item.uberOil = 0;
                updateSingleMine(item);
            }
        }
        return teamItems;
     },
     isTurnOnAble : function(item, teamItems, complex){
         var returnArr = [];
         if(item.energy_prod){
             returnArr = turnOnPowerplant(item, teamItems, complex);
         } else {
             returnArr = turnOnBuilding(item, teamItems, complex);
         }
         return returnArr;
     },
     
    //then check need of oil and produce energy
    getEnergy: function (complex, teamItems) {
//        console.log(complex);

        for(var j in complex){
            getGivesAndNeeds(complex[j].buildings,teamItems)
        }

      return teamItems;
    },
    
    turnOffUnpoweredBuildings: function(complex, teamItems){
//        console.log(complex);
//        for(var j in complex){
            turnOffUnpoweredBuildings(complex, teamItems);
//        }
      return teamItems;
        
    }
    //then shut down buildings with no energy
};

var debug = false;
var updateSingleMine = function(item){
        if(item.name=='mine'){
            var material = 0;
            var oil = 0;
            var gold = 0;
            var ress = areThereRessources(item.x,item.y);
            //if(ress === false) return;
            for(var i in ress){
                switch (ress[i][0]){
                    case "oil":
                        oil += ress[i][1];
                        break;
                    case "mat":
                        material += ress[i][1];
                        break;
                    case "gold":
                        gold += ress[i][1];
                        break;
                }
            }
//            addRessToItem(item,["material",material]);
//            addRessToItem(item,["oil",oil]);
//            addRessToItem(item,["gold",gold]);
              addRessToItem(item,{"gold":gold,"material":material,"oil":oil});
            if(debug) console.log(item.ressources);
            //console.log(item.ressources);
            if(debug) console.log(material,oil,gold);
        }
    }
var getRessourcesOfComplex= function(id){
        var complex = complexTool.getComplexById(id);
        var ressArr = {material:0,oil:0,gold:0};
        for(var i = 0; i<complex.buildings.length; i++){
            var item = complex.buildings[i];
            var ress = item.ressources;
            ressArr.material+=ress.material;
            ressArr.oil+=ress.oil;
            ressArr.gold+=ress.gold;
        }
        return ressArr;
    }

var ressources = ["material","gold","oil"];
var ressourcesObj = {"material":0,"gold":0,"oil":0};
    
var addRessToItem= function(item,ress){
    item.ressources = item.ressources || ressourcesObj;
    item.storage = item.storage || [];
    var uberRess = {"material":0,"gold":0,"oil":0};;
//        item.ressources.material = item.ressources.material || 0;
//        item.ressources.oil = item.ressources.oil || 0;
//        item.ressources.gold = item.ressources.gold || 0;

//nur ress saugen wenn mine an ist  - ansonsten nur uberoil generieren
    if(item.turnOn) {
        for(var ressource in ressources){
             var r = ressources[ressource];

             item.ressources[r] = item.ressources[r] || 0;

             if(item.ressources[r]+ress[r] > item.storage[r]){
                 var excessRess = item.ressources[r]+ress[r] - item.storage[r];
                 item.ressources[r]=item.storage[r];



                 uberRess[r] = getItemInComplexWithFreeStorage(item.complexId,r,excessRess)
             } else {
                 item.ressources[r]+=ress[r];
             }
             //oil speichern damit es für energie verwertet werden kann
     //        console.log(r,uberRess);
//             if (r == "oil") item.uberOil = uberRess;

             item.uberOil = uberRess.oil;
         }
    } else {
        item.uberOil = ress["oil"];
    }
//    console.log(item.uberOil);
}

var freeStorageDebug = false;
var getItemInComplexWithFreeStorage = function(complexId,ressType,ress){
//    for(var i in teamItemsArr){
//        console.log(i,teamItemsArr[i].uid,teamItemsArr[i].name,teamItemsArr[i].ressources,teamItemsArr[i].storage);
//    }
    for(var i in teamItemsArr){
        var item = teamItemsArr[i];

        if(item.storage && ress > 0 && item.action != "construct"){
//        if(ress > 0 && item.action != "construct"){
            if(item.complexId == complexId){
//                item.storage = item.storage || {"material":0,"gold":0,"oil":0};
                item.ressources = item.ressources || {"material":0,"gold":0,"oil":0};
                if(item.storage[ressType] == 0){
                    //hier passiert nichts weil das item keine storage dafür hat
                }else if(item.ressources[ressType]+ress > item.storage[ressType]){
                    var housedRess = item.storage[ressType] - item.ressources[ressType];
                    item.ressources[ressType]=item.storage[ressType];
                    ress -= housedRess;
                    if(freeStorageDebug) console.log(item.uid+": speichert "+housedRess+" "+ressType+". Es sind "+ress+" übrig");
                }else {
                    item.ressources[ressType]+=ress;
                    if(freeStorageDebug) console.log(item.uid+": speichert "+ress+" "+ressType+". Alles untergebracht!");
                    ress=0;
                    return 0;
                }
            }
        } else if( item.storage  && item.action != "construct" ){
            if(freeStorageDebug) console.log(ressType+": Alles irgendwo untergebracht :) ");
            return 0;
        }
    }
    if(freeStorageDebug) console.log("Soviel ress gingen verloren "+ressType+" : "+ress);
    return ress;
}
var areThereRessources= function(x,y){
        var ressArr = [];
        var ress = isThereARessource(x,y)
        if (ress[0]!="") ressArr.push(ress);
        ress = isThereARessource(x+1,y)
        if (ress[0]!="") ressArr.push(ress);
        ress = isThereARessource(x,y+1)
        if (ress[0]!="") ressArr.push(ress);
        ress = isThereARessource(x+1,y+1)
        if (ress[0]!="") ressArr.push(ress);
        if(ressArr.length < 1) return false;
        return ressArr;
    }
var isThereARessource= function(x,y){
    var ress = GLOBAL.mapData.map[y][x]
    if (ress.ressource){ 
        return [Object.keys(ress.ressource)[0],ress.ressource[Object.keys(ress.ressource)[0]]]
    }
    return ["",0]
}

var getItemByUid = function(uid,teamItems){
    for(var i in teamItems){
        if(teamItems[i].uid==uid)
            return teamItems[i];
    }
    return false;
}

var getGivesAndNeeds = function(complexBuildings, teamItems){

    var oilInComplex = 0;
    var uberOilInComplex = 0;
    var energyConsumption = 0;
    var energyConsumption2 = 0;
    var giveEnergyInComplex = 0;
    var oilConsumption = 0;
    var oilInComplexTuple = [];
    var energyConsumptionTuple = [];
    var oilEnergyRelation = [];
    
    for(var i in complexBuildings){
        var uid = complexBuildings[i];
        var item = getItemByUid(uid,teamItems);
        
        item.turnOn = item.turnOn || false;
        
        if(item.ressources && (item.ressources.oil > 0)){
            oilInComplex += item.ressources.oil;
            oilInComplexTuple.push([item.uid, item.ressources.oil])
        }
        if(item.uberOil && item.uberOil > 0){
            uberOilInComplex += item.uberOil;
        }
        if(item.energy_need && (item.energy_need > 0)){
            energyConsumption += item.energy_need;
            energyConsumption2 += item.energy_need;
            energyConsumptionTuple.push([item.uid, item.energy_need])
        }
        

    }
    
    for(var i in complexBuildings){
        var uid = complexBuildings[i];
        var item = getItemByUid(uid,teamItems);
        
        // was energy prodded brauch auch oil
        if(item.oil_need) item.turnOn = false;
        if(item.oil_need && item.oil_need > 0 && energyConsumption2 > 0){
            giveEnergyInComplex += item.energy_prod;
            energyConsumption2 -= item.energy_prod;
            oilConsumption += item.oil_need;
            oilEnergyRelation.push([item.uid, item.oil_need, item.energy_prod])
        }
    }
    

    //oilconsumption sortieren
    oilEnergyRelation.sort(function(a, b){
        var valA=a[2]; var valB=b[2];
        if (valA < valB)
         return 1 
        if (valA > valB)
         return -1
        return 0 
    });

    //sortieren danach was on und was off ist
    energyConsumptionTuple.sort(function(a, b){
        var valA = getItemByUid(a[0],teamItems).turnOn;
        var valB = getItemByUid(b[0],teamItems).turnOn;
        if (valA < valB)
         return 1 
        if (valA > valB)
         return -1
        return 0 
    });
    
    
    
    var energyAvailable = 0;
    //erst uberoil aufbrauchen
    if(uberOilInComplex > 0){
        for(var i in oilEnergyRelation){
            var item = getItemByUid(oilEnergyRelation[i][0],teamItems);
            if(uberOilInComplex >= item.oil_need){
                oilConsumption -= item.oil_need;
                uberOilInComplex -= item.oil_need;
                item.turnOn = true;
                energyAvailable += item.energy_prod;
            } else {
                item.turnOn = false;
            }
        }
    }

    //restliches oil verbrauchen
    if(oilConsumption > 0){
        var oilAvailable = uberOilInComplex;
         //oil in storage aufbrauchen
        for(var i in oilInComplexTuple){
            var oilItem = getItemByUid(oilInComplexTuple[i][0],teamItems);
            if(0 < oilItem.ressources.oil && oilConsumption > 0 ){
                var diffOil = oilItem.ressources.oil - oilConsumption;
                if(diffOil >= 0){
                    oilItem.ressources.oil -= oilConsumption;
                    oilAvailable += oilConsumption;
                    oilConsumption = 0;
                } else {
                    oilConsumption -= oilItem.ressources.oil;
                    oilAvailable += oilItem.ressources.oil;
                    oilItem.ressources.oil = 0;
                }
            }
            
        }

        //oil auf kraftwerke verteilen
        for(var i in oilEnergyRelation){
            var item = getItemByUid(oilEnergyRelation[i][0],teamItems);
            if(!item.turnOn && oilAvailable >= item.oil_need && energyConsumption > 0){
                oilConsumption -= item.oil_need;
                oilAvailable -= item.oil_need;
                item.turnOn = true;
                energyAvailable += item.energy_prod;
                energyConsumption -= item.energy_prod;
            } else if(item.turnOn) {
                energyConsumption -= item.energy_prod;
            } else {
                item.turnOn = false;
            }
        }
        
        //rollback oil (reverse)
        for(var j = oilInComplexTuple.length-1; j>=0; j--){
            var oilItem = getItemByUid(oilInComplexTuple[j][0],teamItems);
            if( oilAvailable > 0 && (oilItem.storage.oil - oilItem.ressources.oil) > 0){
                var diffOil = oilAvailable - (oilItem.storage.oil - oilItem.ressources.oil);
                if(diffOil >= 0){
                    oilItem.ressources.oil += diffOil;
                    oilAvailable -= diffOil;
                } else {
                    oilItem.ressources.oil += oilAvailable;
                    oilAvailable = 0;
                }
            }

        }
    }
       
    //energy auf restliche gebäude verteilen
    for(var i in energyConsumptionTuple){
        var item = getItemByUid(energyConsumptionTuple[i][0],teamItems); 
        //todo wird noch mehr oder weniger zufällig gemacht. sollte nach oilprod prio gemacht werden
        if(energyAvailable >= item.energy_need){
            energyAvailable -= item.energy_need;
            item.turnOn = true;
        } else {
            item.turnOn = false;
        }
    }
    
//    return teamItems;
}


var turnOnBuilding = function(oItem, teamItems, complexBuildings){
    var giveEnergyInComplex = 0;
    var energyConsumption = 0;
    
    energyConsumption += oItem.energy_need;
//    console.log(complexBuildings);
    for(var i in complexBuildings){
        var uid = complexBuildings[i];
        var item = getItemByUid(uid,teamItems);
//         console.log(uid,item.turnOn);
        //energy bedarf
        if(item.turnOn && item.energy_need && (item.energy_need > 0)){
            energyConsumption += item.energy_need;
        }
        
        // rechnet energy aus die zur verfügung ist
//        console.log(item.turnOn, item.energy_prod);
        if(item.turnOn && item.energy_prod && (item.energy_prod > 0)){
            giveEnergyInComplex += item.energy_prod;
        }
    }
//    console.log(giveEnergyInComplex,energyConsumption);
    if(giveEnergyInComplex>=energyConsumption){
        return [true, "Building "+oItem.name+"("+oItem.uid+")"+" turned on."]
    } else {
        return [false, "Building "+oItem.name+"("+oItem.uid+"):"+" not enough energy."]
    }
}

var turnOnPowerplant = function(oItem, teamItems, complexBuildings){
    var oilInComplex = 0;
    var oilConsumption = 0;
    
    oilConsumption += oItem.oil_need;
//    console.log(complexBuildings);
    for(var i in complexBuildings){
        var uid = complexBuildings[i];
        var item = getItemByUid(uid,teamItems);
//         console.log(uid,item.turnOn);
        //oil bedarf
        if(item.turnOn && item.oil_need && (item.oil_need > 0)){
            oilConsumption += item.oil_need;
        }
        
        // oil das zur verfügung ist
        if(item.ressources && (item.ressources.oil > 0)){
            oilInComplex += item.ressources.oil;
        }
//        console.log(item.uberOil);
        if(item.uberOil && (item.uberOil > 0)){
            oilInComplex += item.uberOil;
        }
    }
//    console.log(oilInComplex,oilConsumption);
    if(oilInComplex>=oilConsumption){
        return [true, "Building "+oItem.name+"("+oItem.uid+")"+" turned on."]
    } else {
        //WIP shutdown until you have less enough energy to support all structures
        return [false, "Building "+oItem.name+"("+oItem.uid+"):"+" not enough oil."]
    }
}

var turnOffUnpoweredBuildings = function(complexBuildings, teamItems){
    var giveEnergyInComplex = 0;
//    console.log("sup");
    //energie einsammeln
    for(var i in complexBuildings){
        var uid = complexBuildings[i];
        var item = getItemByUid(uid,teamItems);
        if(item.turnOn && item.energy_prod && (item.energy_prod > 0)){
            giveEnergyInComplex += item.energy_prod;
        }
    }
    //energie verteilen
    for(var i in complexBuildings){
        var uid = complexBuildings[i];
        var item = getItemByUid(uid,teamItems);
//        if(item.complexId == 12 )console.log(item.name, item. energy_need, item.oil_need,(item.energy_need && (item.energy_need > 0) && giveEnergyInComplex >= item.energy_need));
        if(item.energy_need && (item.energy_need > 0) && giveEnergyInComplex >= item.energy_need){
//            console.log("IF ",item.name, item.uid);
            giveEnergyInComplex -= item.energy_need;
            item.turnOn = true;
        }
        //powerplants ausschließen
        
        else if(!item.oil_need) {
//            console.log("ELSEIF ",item.name, item.uid);
            item.turnOn = false;
        } else {
//            console.log("ELSE ", item.name, item.uid);
        }
    }
    return teamItems;
}