var dbName = "cliplay_dev_3_13", remoteURL = "http://admin:12341234@localhost:5984/"+dbName;
// var dbName = "cliplay", remoteURL = "http://cliplay_editor:iPhone5S@121.40.197.226:4984/"+dbName;
// var dbName = "cliplay_test", remoteURL = "http://admin:12341234@localhost:5984/"+dbName;
var db = new PouchDB(dbName);

var playerOption = "";
var moveList = [];
var existingClipList = [];
var playerList = [];
var searchResult = [];
var selectedClip = "";
var playerUI = {};
var action = "";


/** Default Document Ready Event **/
$(function()
{
    disableButton();
    // Make form do what we want
    $('#url-form').submit(getImagesFromUrl);

    dbSetup();
    //deleteDB();

    //findAndRemoveInstall();
    //syncToRemote();
    //$("#playerForm").validate();    
    //syncFromRemote();      
    //syncToRemote();
    //deleteDoc("clip100");

    $('#name_search').keypress(function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            event.preventDefault();
            searchClip();
        }
    });  

    $('#clipModal').on('shown.bs.modal', function (e) {
        // console.log("show modal");
        $("#image_url").focus();
    });

    $('#playerModal').on('shown.bs.modal', function (e) {
        // console.log("show modal");
        $("#name").focus();
    });  
});

function findAndRemoveInstall() {
    db.get("DBInstalled").then(function(doc) {
        db.remove(doc).then(function(){
            syncToRemote();
        });
    });
}

function disableButton() {
    setButtonDisable("search", true);
    setButtonDisable("addPlayer", true);
    setButtonDisable("addClip", true);
    setButtonDisable("updateClip", true);
}

function enableButton() {    
    setButtonDisable("search", false); 
    setButtonDisable("addPlayer", false);
    setButtonDisable("addClip", false);
    setButtonDisable("updateClip", false);    
}

function setButtonDisable(id, flag) {
    $('#'+id).prop('disabled', flag);   
}

function dbSetup() {

    db.destroy().then(function (response) {
        db = new PouchDB(dbName);
        return syncFromRemote().on('complete', function () {
            console.log("sync completed");
            return db.createIndex({
                index: {
                    //fields: ['image', 'local']
                    fields: ['image']
                }
            });
        }).on('error', function (err) {
            throw new Error(err);
        });
    }).then(function (result) {        
        return db.createIndex({
            index: {
                // fields: ['name', 'local']
                fields: ['name']
            }
        });    
    }).then(function(){
        console.log("index created");
        renderList();    
    }).catch(function (err) {
        console.log(err);
    });

    // syncFromRemote().on('complete', function () {
    //     console.log("sync completed");
    //     db.createIndex({
    //         index: {
    //             //fields: ['image', 'local']
    //             fields: ['image']
    //         }
    //     }).then(function (result) {        
    //         db.createIndex({
    //             index: {
    //                 // fields: ['name', 'local']
    //                 fields: ['name']
    //             }
    //         }).then(function(){
    //             console.log("index created");
    //             renderList();    
    //         });    
    //     }).catch(function (err) {
    //         console.log("index err");
    //     });
    // }).on('error', function (err) {
    //     console.log(err);
    // });
}

function renderList() {
    getPlayList().then(function(result) {        
        //var list = result.docs;
        //playerList = result.docs;
        playerList = result.rows.map(function(row) {                   
            return row.doc;
        });
        renderPlayerList();
        getMoveList();        
    }); 
}

function renderPlayerList(){
    //var option = "";

    playerOption = "";

    for(i in playerList) {
        playerOption += '<option value="'+playerList[i]._id+'">'+playerList[i].name_en+'</option>';
    }

    //return option;
}

function getMoveList() {
    return db.allDocs({
        include_docs: true,
        startkey: "move",
        endkey: "move\uffff"
    }).then(function(result){
        //moveList = result.docs;
        moveList = result.rows.map(function(row) {                   
            return row.doc;
        });
        setupClipForm();        
        enableButton();              
    });
}

function getClipByImage(image) {
    return db.find({
        selector: {image: image}
    });
}

function getPlayList() {
    return db.allDocs({
        include_docs: true,
        startkey: "player",
        endkey: "player\uffff"            
    })
}

function renderMoveList(index) {

    var radioButton = "";

    for(i in moveList) {
        if( i == 0){
            radioButton += '<input type="radio" id="radio'+i+index+'" name="move'+index+'" checked="checked" value="'+moveList[i]._id+'"><label for="radio'+i+index+'">'+moveList[i].move_name+'</label>';    
        } else {
            radioButton += '<input type="radio" id="radio'+i+index+'" name="move'+index+'" value="'+moveList[i]._id+'"><label for="radio'+i+index+'">'+moveList[i].move_name+'</label>';    
        }        
    }

    return radioButton;
}

function getExistingClipsByImage() {
     return db.find({
        selector: {type: 'player'}
    });
}

function getDateID() {
    var currentdate = new Date();
    var datetime = "" + 
                   currentdate.getFullYear() + "_" +
                   ("0" + (currentdate.getMonth() + 1)).slice(-2) + "_" +
                   ("0" + currentdate.getDate()).slice(-2) + "_" +
                   ("0" + currentdate.getHours()).slice(-2) + "_" +
                   ("0" + currentdate.getMinutes()).slice(-2) + "_" +
                   ("0" + currentdate.getSeconds()).slice(-2); 
                   // (currentdate.getMonth() + 1) + 
                   // currentdate.getDate() +                    
                   // currentdate.getHours() +
                   // currentdate.getMinutes() + 
                   // currentdate.getSeconds();    
    return datetime;
}

function getPostID(player, move) {
    return "post_" + player + "_" + move;   
}

function generatePlayer(name, name_en, desc, image, avatar, star) {
    
    var name_id = name_en.replace(/ /g,"_");
    return {
        //"_id": "player_" + name_id + "_" + date.getTime(),
        "_id": "player_" + name_id.toLowerCase(),
        "name": name,        
        "name_en": name_en,
        "desc": desc,
        "avatar": avatar,
        "image": image,        
        //"type": "player",
        //"star": star,
        "clip_total": 0,
        "clip_moves": {}
    };
}

function generateMove(id, name, desc, image, avatar, star) {

    return {
        "_id": id,
        "move_name": name,        
        "desc": desc,
        "image": image,        
        "type": "move",
        "clip_player": {}
    };
}

function updateQty(playerID, moveID) {
    db.get(playerID).then(function(doc) {
        doc.clip_total += 1;
        if(doc.clip_moves[moveID]) {
            doc.clip_moves[moveID] += 1;
        }else{
            doc.clip_moves[moveID] = 1;
        }
        db.put(doc).then(function() {

        }).catch(function() {

        });
    }).catch(function() {

    });
}

function saveSingleClip() {

    var move = getSeletValue("move_clip"); 
    var player = getValue("player_name");
    var image = getValue("image_url");

    if(!endsWith(image, "gif")) {
        alert("图片需要gif格式");
        return;
    }

    setButtonDisable("save-clip", true);

    // var name = getValue("clip_title");
    // var desc = getValue("clip_desc");

    //putClip(name, desc, move, player, image, function(){
    putClip(player, move, image, function(image){
        setButtonDisable("save-clip", false);
        cleanClipForm();                 
        alert("保存成功！");
        addSortableItem(image);
    }, function() {        
        setButtonDisable("save-clip", false);
    });
}

function endsWith(string, suffix) {
    return string.indexOf(suffix, string.length - suffix.length) !== -1
}

function saveClip(index) {

    setButtonDisable("save"+index, true);

    var move = getSeletValue("move"+index); 
    var player = getValue("player"+index);
    var image = getValue("gif"+index);

    // var name = getValue("name"+index);
    // var desc = getValue("desc"+index);

    putClip(player, move, image, function(){
        saveSucess(index);
        setButtonDisable("save"+index, false);
    }, function() {        
        setButtonDisable("save"+index, false);
    });
}

function generatePost(player, move, list) {

    var id = getPostID(player, move);

    return {
        "_id": id,        
        "image": list,        
    };
}

function putClip(player, move, image, sCallback, fCallback) {
    
    if(move == "" || player == "" || image == "") {
        alert("请填写完整信息");
        return;
    }

    var id = getPostID(player, move);

    db.allDocs({include_docs: true, startkey: id, endkey: id}).then(function(result){

        var doc = {};
        if(result.rows.length == 0) {
            doc = generatePost(player, move, [image]);
        }else {
            doc = result.rows[0].doc;

            var list = doc.image;

            for(i in list) {
                if(image == list[i]) {
                    throw new Error('Already existed');
                }
            }

            doc.image.unshift(image);
        }        
        return db.put(doc);
            
    }).then(function() {
        return db.get(player);
    }).then(function(doc) {
        doc.clip_total += 1;
        if(doc.clip_moves[move]) {
            doc.clip_moves[move] += 1;
        }else{
            doc.clip_moves[move] = 1;
        }
        return db.put(doc);
    }).then(function() {
        console.log("player updated");
        return sync().on('complete', function () {
            console.log("sync to completed");
            sCallback(image);
        }).on('error', function (err) {
            fCallback();
            alert("同步失败: " + err);
        });
    }).catch(function(err) {
        if(err.message == "Already existed") {
            sCallback(image);
        }else {
            fCallback();
            alert("保存失败: " + err);                      
        }        
    });
}

function savePlayer() {    

    setButtonDisable("save-player", true);

    var name = getValue("name"); 
    var name_en = getValue("name_en");
    var desc = getValue("desc");
    var image = "";
    var avatar = getValue("avatar");
    var star = false;

    //var obj = generatePlayer("乔丹", "Michael Jordan", "最伟大的球员", "http://abc.com/1.jpg", "http://abc.com/1.jpg", true);

    if(name == "" || name_en == "" || desc == "" || avatar == "") {
        alert("请填写完整信息");
        setButtonDisable("save-player", false);
        return;
    }

    var player = generatePlayer(name, name_en, desc, image, avatar, star);

    db.put(player).then(function(){
        console.log("player created");     
        sync().on('complete', function () {
            regeneratePlayeList(player);
            cleanForm();
            console.log("sync to completed");
            alert("保存成功！");
            setButtonDisable("save-player", false);
        }).on('error', function (err) {
            console.log(err);
            alert("同步失败！");
            setButtonDisable("save-player", false);
        });       
    }).catch(function(err) {
        alert("保存失败！");
        console.log("player create err");
        setButtonDisable("save-player", false);
    });
}

function searchClip() {

    $("#clipUpdateForm").hide();

    var name = $("#name_search").val();

    db.find({
        selector: {
            name: name,           
        },        
    }).then(function (result) {          
        searchResult = result.docs;
        renderSearchResult(searchResult);
    }).catch(function (err) {
        alert(err);
    });

    // var image = name;

    // db.find({
    //     selector: {
    //         image: image            
    //     }
    // }).then(function (result) {
    //     console.log(result.docs.length);
    // }).catch(function (err) {
    //     console.log(err);
    // });
}

function renderSearchResult(list) {

    if(list.length == 0) {        
        $("#searchResult").html('');
        alert("没有查询结果");
        return;
    }

    var header = '<thead>' +
                    '<tr>' +
                        //'<th>#</th>' +
                        '<th>球员</th>' +
                        '<th>动作</th>' +
                        '<th>描述</th>' +
                        //'<th>图片</th>' +
                        '<th>选择</th>' +
                    '</tr>' +
                 '</thead>';

    var body = '<tbody>';

    for(i in list) {

        var item = list[i];

        var moveName = moveList[findIndex(moveList, item.move)].move_name;

        var playerName = playerList[findIndex(playerList, item.player)].name;    

        body +=  '<tr id="update_row_'+i+'">' +
                    '<th scope="row">'+playerName+'</th>' +
                    //'<td>'+playerName+'</td>' +
                    '<td>'+moveName+'</td>' +
                    '<td>'+item.desc+'</td>' +
                    //'<td>'+item.image+'</td>' +
                    // '<td><a href="#" onclick="updateClip(\''+item._id+'\');return false;">修改</a></td>' +
                    '<td><a href="#" onclick="selectClip('+i+');return false;">修改</a></td>' +
                  '</tr>';
    }

    body += '</tbody>';

    $("#searchResult").html('<table class="table">' + header + body + '</table>');
}

function findIndex(array, id) {  
    var low = 0, high = array.length, mid;
    while (low < high) {
        mid = (low + high) >>> 1;
        if(array[mid]._id == id) {
            return mid;
        }else{
            array[mid]._id < id ? low = mid + 1 : high = mid    
        }
    }
    return -1;
}

function selectClip(index) {
    //console.log(clipID);

    selectedClip = index;
    cleanActive(searchResult.length);

    var clip = searchResult[index];

    setInputValue('image_url_update', clip.image);
    setInputValue('clip_title_update', clip.name);
    setInputValue('clip_desc_update', clip.desc);
    playerUI.update(findIndex(playerList, clip.player));
    var moveIndex = findIndex(moveList, clip.move);
    $('input:radio[id=radio'+moveIndex+'_update]').prop('checked', true);
    $("#clip_move_update").buttonset( "refresh" );
    $("#update_row_"+index).addClass("success"); 

    $("#clipUpdateForm").show();
}

function cleanActive(length) {
    for(var i=0; i<length; i++) {
        $("#update_row_"+i).removeClass("success"); 
    }
}

function setInputValue(id, val) {
    $("#"+id).val(val);
}

function performUpdate() {
    if(action == 'delete') {
        deleteClip();
    }else {
        updateClip();
    }
}

function deleteClip() {

    var clip = searchResult[selectedClip];

    if(!clip) return;

    var player = clip.player;
    var move = clip.move;

    db.remove(clip).then(function() {
        return db.get(player);        
    }).then(function(player) {
        player.clip_total -= 1;
        player.clip_moves[move] -= 1;
        return db.put(player);
    }).then(function() {
        sync().on('complete', function () {
            alert("删除成功");
            resetUpdateForm();
        }).on('error', function (err) {                    
            alert("删除成功，同步失败，请检查网络后重试");
        });
    }).catch(function(){
        alert("删除失败");
    });
}

function updateClip() {

    var clip = searchResult[selectedClip];

    if(!clip) return;

    var recreate = false;

    var move = getSeletValue("move_update"); 
    var player = getValue("player_name_update");

    var image = getValue("image_url_update");
    var name = getValue("clip_title_update");
    var desc = getValue("clip_desc_update");

    console.log(clip._id);

    if(move != clip.move) {
        recreate = true;
    }

    if(player != clip.player) {        
        recreate = true;
    }

    if(recreate) {
        db.remove(clip).then(function() {
            return db.get(clip.player);        
        }).then(function(player) {
            player.clip_total -= 1;
            player.clip_moves[clip.move] -= 1;
            return db.put(player);
        }).then(function() {
            putClip(name, desc, move, player, image, function(){            
                alert("更新成功");
                resetUpdateForm();
            }, function() {        
                alert("旧数据删除成功，新数据增加失败");
            });
        }).catch(function(){
            alert("旧数据删除失败");
        });
    }else {
        clip.image = image;
        clip.name = name;
        clip.desc = desc;

        db.put(clip)
        .then(sync)
        .then(function() {
            alert("更新成功");
            resetUpdateForm();
        }).catch(function() {
            alert("更新失败");
        });
    }
}

function isChanged(index) {

    var move = getSeletValue("move_update"); 
    var player = getValue("player_name_update");
    
    var image = getValue("image_url_update");
    var name = getValue("clip_title_update");
    var desc = getValue("clip_desc_update");

    if(move != searchResult[index].move) {
        console.log("move changed");
    }

    if(player != searchResult[index].player) {
        console.log("player changed");   
    }
}

function prepareUpdate(_action) {
    action = _action;
    $(".alert-danger").removeClass("hide");
    $(".alert-danger").show();

    if(action == 'delete') {
        $("#alert-message").html("请确认是否删除?");
    }else {
        $("#alert-message").html("请确认是否修改?");
    }
}
 
function resetUpdateForm() {
    $("#searchResult").html('');    
    $(".alert-danger").hide();
    $("#clipUpdateForm").hide();
    $("#name_search").focus();
}

function dimissAlert() {
    $(".alert-danger").fadeOut();
}

function regeneratePlayeList(player) {

    playerList.push(player);

    renderPlayerList();

    var player = '<select class="form-control" id="player_name" data-theme="bootstrap">' +                                   
                    playerOption +   
                 '</select>';

    $("#player_list").html(player);

    $("#player_name").comboSelect();   

    var list = $(".form-group-player");

    if(list.length > 0) {
        var id_list = [];
    
        for(var i=0; i< list.length; i++) {
           id_list.push($(list[i]).attr("data-id"));
        }

        list = [];

        for(l in id_list) {
            var i = id_list[l];
            var player = '<label for="player'+i+'">球员</label>' +    
                     '<select class="form-control" id="player'+i+'" data-theme="bootstrap">' +                                   
                        playerOption +   
                     '</select>';

            $("#form-group-player"+i).html(player);

            $("#player"+i).comboSelect();   
        }
    }
}

function cleanForm() {
    $("#name").val("");
    $("#name_en").val("");
    $("#desc").val("");
    $("#avatar").val("");
    $('#playerModal').modal('hide');
}

function cleanClipForm() {       
    //$("#clip_move").val("");
    //$("#player_name").val("");
    $("#image_url").val("");
    $("#clip_title").val("");
    $("#clip_desc").val("");
    $('#clipModal').modal('hide');
}

function deleteDB() {      
    db.destroy().then(function (response) {
        console.log(response);
    }).catch(function (err) {
        console.log(err);
    });
}

function saveSucess(index) {    

    $("#clip"+index)
    .parents(".clip")
    .animate({opacity: 0})
    .toggle();
    alert("保存成功！");
}

function getValue(id) {
    return $("#"+id).val();
}

function getSeletValue(id) {
    return $('input[name='+id+']:checked').val();
}

function setupClipForm() {
    $("#player_name").html(playerOption);
    $("#player_name").comboSelect();
    $("#clip_move").html(renderMoveList("_clip"));
    $("#clip_move").buttonset();

    $("#player_name_update").html(playerOption);
    playerUI = $("#player_name_update").comboSelect();
    $("#clip_move_update").html(renderMoveList("_update"));
    $("#clip_move_update").buttonset();

    $("#clipUpdateForm").hide();
}

function renderNewsForm() {
    $('.row').empty();

    var info = '<div class="col-xs-8 col-md-4">' +
                    '<form class="form-horizontal" id="playerForm">' +
                        '<div class="form-group">' +
                            '<label for="news_thumb" class="col-sm-2 control-label">小图</label>' +
                            '<div class="col-sm-10">' +
                                '<input type="url" class="form-control" id="news_thumb" placeholder="http://" required>' +
                            '</div>' +
                        '</div>' +                      
                        '<div class="form-group">' +
                            '<label for="news_title" class="col-sm-2 control-label">名称</label>' +
                            '<div class="col-sm-10">' +
                                '<input class="form-control" id="news_title" required>' +
                            '</div>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="news_desc" class="col-sm-2 control-label">描述</label>' +
                            '<div class="col-sm-10">' +
                                '<input class="form-control" id="news_desc" required>' +
                            '</div>' +
                        '</div>' +
                        '<div class="form-group">' +
                             '<button type="button" class="btn btn-primary save" onclick="saveNews()">保存</button>' +
                        '</div>' +
                    '</form>' +
                '</div>';
    var list = '<div class="col-xs-16 col-md-8">' +              
                    '<ul id="sortable2" class="connectedSortable">' +
                        '<li class="ui-state-default ui-state-disabled">已选短片</li>' +               
                    '</ul>' +
                    '<ul id="sortable1" class="connectedSortable">' +
                        '<li class="ui-state-default ui-state-disabled">备选短片</li>' +               
                    '</ul>' +                                                                       
                '</div>';

    $(".row").append(info + list);

    $( "#sortable1, #sortable2" ).sortable({
        connectWith: ".connectedSortable"
    }).disableSelection();

    $( "#sortable1, #sortable2" ).sortable({
        cancel: ".ui-state-disabled",
        items: "li:not(.ui-state-disabled)",
        placeholder: "ui-state-highlight"
    });
}

function addSortableItem(url) {

    // url = "http://i2.hoopchina.com.cn/blogfile/201603/11/BbsImg145768045563810_425x237.gif";

    if(!$("#news_title").length) {
        renderNewsForm();
    }

    if(!url) {
        return;
    }

    var id = CryptoJS.SHA1(url);

    if($("#"+id).length) {
        alert("此短片已添加，不需重复");
        return;
    }

    var item = '<li class="ui-state-default imageList" url="'+url+'">' +
                    '<div class="thumbnail order" id="'+id+'">' +                  
                    '</div>' +
               '</li>';
    // var html = $("#sortable1").html();

    // $("#sortable1").html(html + item);

    $("#sortable2").append(item);
        
    var img = $('<img>')
        .attr("data-gifffer", url)                
        .attr("id", "img_"+id)
        .appendTo("#"+id)
        .parents(".ui-state-default")                
        .css({opacity: 0, display: 'none'});    

    Gifffer(finishAdd);
}

function finishAdd(image) {

    $("#"+$(image).attr("id"))
        .addClass("playing")
        .parents(".ui-state-default")
        .toggle()      
        .animate({opacity: 1});
}

function saveNews() {

    var list = [];

    var name = getValue("news_title"), 
        desc = getValue("news_desc"),
        thumb = getValue("news_thumb");

    // $(".imageList").each(function(index, element){
    //     //console.log($(element).attr("url"));
    //     list.push($(element).attr("url"));
    // });

    $("#sortable2").find('li').each(function(index, element){        

        var url = $(element).attr("url");
        if(url) {
            // console.log($(element).attr("url"));
            list.push(url);    
        }        
    });

    if (name == "" || desc == "" || thumb == "" || list.length == 0) {
        alert("请填写完整信息并选择至少一个图片");
        return;
    }   

    var news = {
        _id: "news_" + getDateID(),
        image: list,
        name: name,
        desc: desc,
        thumb: thumb,
    }

    putNews(news);
}

function putNews(news) {
    db.put(news).then(function(){
        sync().on('complete', function () {
            alert("保存成功");
            $('.row').empty();
        }).on('error', function (err) {            
            alert("保存成功，同步失败");
            $('.row').empty();
        });
    }).catch(function() {
        alert("保存失败");
    })
}

function getImagesFromUrlDone(data)
{
    $('.row').empty();

    if(data && data.images) {

        for(var i in data.images)
        {
            if (!data.images[i].src.match(/gif$/)) continue;


            var col = '<div class="clip col-sm-12 col-md-6"><div class="thumbnail" id="clip'+i+'"></div></div>';                
            $(".row").append(col);       
            
            var img = $('<img>')
                .attr("data-gifffer", data.images[i].src)                
                .attr("id", 'img'+i)
                .appendTo("#clip"+i)
                .parents(".clip")                
                .css({opacity: 0, display: 'none'});                
                    

            var caption = '<div class="caption"><form id="form'+i+'"></form></div>';

            $("#clip"+i).append(caption);        
                       
            var player = '<div class="form-group form-group-player" data-id="'+i+'" id="form-group-player'+i+'"><label for="player'+i+'">球员</label>' +    
                            '<select class="form-control" id="player'+i+'" data-theme="bootstrap">' +                                   
                                playerOption +   
                            '</select>' +
                         '</div>';

            var form = $("#form"+i);                 
            
            var image = '<input style="display:none" value="'+data.images[i].src+'" id="gif'+i+'">';   

            form.append(player);
            form.append(image);
            $("#player"+i).comboSelect();

            // var name = '<div class="form-group">' +
            //                 '<input type="text" class="form-control" placeholder="名称" id="name'+i+'">' +
            //            '</div>';

            // form.append(name);

            // var desc = '<div class="form-group">' +
            //                 '<input type="text" class="form-control" placeholder="描述" id="desc'+i+'">' +
            //            '</div>';

            // form.append(desc);


            var moveRadio = renderMoveList(i);

            var move = '<div class="form-group">' +
                          '<label for="move'+i+'">动作</label>' +
                          '<div id="move'+i+'">' +
                              moveRadio +
                          '</div>' +
                       '</div>';


            form.append(move);
            $("#move"+i).buttonset();

            // var select = '<div class="form-group">' +
            //                 '<div class="checkbox">' +
            //                     '<label>' +
            //                         '<input type="checkbox">不选择此短片'+
            //                     '</label>' +
            //                 '</div>' +
            //              '</div>';

            var save = '<button id="save'+i+'" onclick="saveClip('+i+'); return false;">保存</button>';

            form.append(save);
            
            //if(i==3) break;
        }
    }

    Gifffer(display);
}

function display(image) {

   if(image.width > 100 && image.height > 100) {
        $("#"+$(image).attr("id"))
        .addClass("playing")
        .parents(".clip")
        .toggle()        
        .animate({opacity: 1});
   }
}

function deleteDoc(id) {
    db.get(id).then(function (doc) {
        return db.remove(doc);
    });
}

function syncFromRemote() {
    return db.replicate.from(remoteURL);
}

function syncToRemote() {
    return db.replicate.to(remoteURL);
}

function sync() {
    return db.sync(remoteURL);
}

/**
 * Sends request for images.
 */
 function getImagesFromUrl()
 {
    $( "#dialog" ).dialog("open");
    // Make object out of form data
    var data = $(this).serializeObject();
    
    // Create request
    $.post($(this).attr('action'), data, getImagesFromUrlDone);

    // Return false so the form doesn't actually submit
    return false;
}

/**
 * Serializes a form into an object.
 */
$.fn.serializeObject = function()
{
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
                if (o[this.name]) {
                        if (!o[this.name].push) {
                                o[this.name] = [o[this.name]];
                        }
                        o[this.name].push(this.value || '');
                } else {
                        o[this.name] = this.value || '';
                }
        });
        return o;
};