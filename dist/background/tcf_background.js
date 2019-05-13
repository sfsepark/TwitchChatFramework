var tcfBackground = (function() {

    //--------------------- MESSAGE LISTENER -----------------------------------

    /*
        content script -> background -> content script
        user_info 
        emote_list
    */

    chrome.runtime.onMessage.addListener(
        function(request, sender, callback)
        {
            if(request.type == 'user_info'){
                userInfo.get(callback);
            }
            else if(request.type == 'emote_list'){
                emoteInfo.get(callback);
            }

            return true;
        }
    );

    //-------------------------- WHEN COOKIE CHANGED --------------------------------
    /*
        when cookie changed 
        1. background script -> content script
            1) user_info
            2) emote_list
        2. 등록된 callback
    */

    var cookieChangeListeners = [];

    /*
    chrome.cookies.onChanged.addListener(function(changeInfo){
        if(changeInfo.cookie.domain == '.twitch.tv'){
            if(changeInfo.cookie.name == 'twilight-user' && changeInfo.cause == 'explicit')
            {
                userInfo.renew(function(response){
                    chrome.tabs.query({}, function(tabs) {
                        for(var i = 0 ; i < tabs.length ; i ++)
                        {
                            chrome.tabs.sendMessage(
                                tabs[i].id, 
                                {type : 'user_info',
                                data : response.data}, 
                                function(callback) {}
                            ) ;
                        }
                    });
                })

                emoteInfo.renew(function(emoteAvailableList){
                    chrome.tabs.query({}, function(tabs) {
                        for(var i = 0 ; i < tabs.length ; i ++)
                        {
                            chrome.tabs.sendMessage(
                                tabs[i].id, 
                                {type : 'emote_list',
                                data : emoteAvailableList}, 
                                function(callback) {}
                            ) ;
                        }
                    });
                })

                cookieChangeListeners.forEach(function(cookieChangeListener){
                    cookieChangeListener(changeInfo);
                })
            
            }
        }
    });
    */

    //-------------------------- CHANNEL EMOTES ------------------------------

    chrome.runtime.onMessage.addListener(
        function(request, sender, callback)
        {
            if(request.type == 'channel_product')
            {
                getChannelProduct(request.channel_name , callback);
                return true;
            }
        }
    );

    function getChannelProduct(channel_name, callback){
        var url = 'https://api.twitch.tv/api/channels/' + channel_name + '/product';
        var xhttp = new XMLHttpRequest();

        xhttp.onload = function() {
            callback({data:xhttp.responseText});
        };
        xhttp.onerror = function() {
            callback({data:'err'});
        };
        xhttp.open('GET', url, true);
        xhttp.setRequestHeader('Accept', 'application/vnd.twitchtv.v5+json');
        xhttp.setRequestHeader('Client-ID', client_id);
        xhttp.send(null);
        return true;
    }

    //-------------------------------------------------------------------------

    return {
        registerCookieListener : function(callback){
            cookieChangeListeners.push(callback);
        }
    }
    
})();

//------------------------
