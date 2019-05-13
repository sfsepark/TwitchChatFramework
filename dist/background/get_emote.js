// In twitch chat framework

var emoteInfo = (function(){

    var client_id = 'irgj4khs9whj1xx3vw4sdv7fdjp10f';
    var EmoteAvailableList = null;

    function callbackError(callback, error){
        EmoteAvailableList = null;
        if(error === undefined){
            callback({error : 'err'});
        }
        else{
            callback({error : error});
        }
    }

    function getUserInfo(){
        return new Promise(function(resolve, reject){
            userInfo.get(function(response){
                if(response != null)
                {
                    resolve(response); // cookiedata
                }
                else{
                    reject();
                }
            })
        });
    }

    function sortEmoteAvailableList(){
        var emoticon_sets = EmoteAvailableList['emoticon_sets'];

        var emoticon_sets = Object.keys(emoticon_sets);

        for(var i= 0 ; i < emoticon_sets.length ; i ++)
        {
            var emoticon_set = EmoteAvailableList['emoticon_sets'][emoticon_sets[i]];

            emoticon_sets.sort(function(a,b){
                return b['id'] - a['id'];
            });
        }
    }

    function replaceRegexEmote(){
        var regex_array =[':)',':(',':D', '>(', ':|', 'O_o', 'B)', ':O', '<3', ':/', ";)", ":P",";P",  "R)"];

        for(var i = 0 ; i < EmoteAvailableList['emoticon_sets'][0].length ; i ++)
        {
            var curId = EmoteAvailableList['emoticon_sets'][0][i]['id'];
            if(curId <= regex_array.length)
            {
                EmoteAvailableList['emoticon_sets'][0][i]['code'] = regex_array[curId - 1];
            }
            
        }
    }

    function renewEmoteAvailable(callback)
    {
        getUserInfo().then(function(cookieData){
            if(cookieData != null){
                var userID = cookieData.id;
                var authToken = cookieData.authToken;
                var url = 'https://api.twitch.tv/kraken/users/' + userID + '/emotes';
                var xhttp = new XMLHttpRequest();

                xhttp.onload = function() {
                    try{
                        EmoteAvailableList = JSON.parse(xhttp.responseText);

                        sortEmoteAvailableList();
                        replaceRegexEmote();

                        callback(EmoteAvailableList);
                    }
                    catch(exception){                    
                        callbackError(callback);
                    }
                };
                xhttp.onerror = function() {                    
                    callbackError(callback);
                };
                xhttp.open('GET', url, true);
                xhttp.setRequestHeader('Accept', 'application/vnd.twitchtv.v5+json');
                xhttp.setRequestHeader('Client-ID', client_id);
                xhttp.setRequestHeader('Authorization', 'OAuth ' + authToken);
                xhttp.send(null);
            }
            
        }).catch(function(err){
            callbackError(callback);
        })

        return true;
    }

    return {
        get : function(callback){
            if(EmoteAvailableList == null){
                this.renew(callback);
            }
            else{
                callback(EmoteAvailableList);
            }
        },
        renew : renewEmoteAvailable
    }

})();