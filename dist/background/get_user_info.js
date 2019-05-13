// In twitch chat framework 

var userInfo = (function(){

    cookieData = null;

    function renew(callback){
        chrome.cookies.get(
            {url:"https://twitch.tv", name: "twilight-user"},
            function(cookie){
                if(cookie != null & cookie.value != null)
                {
                    cookieData = JSON.parse(decodeURIComponent(cookie.value));
                }
                else{
                    cookieData = null;
                }
                
                callback(cookieData);
        });

        return true;
    }

    return {
        renew : renew,
        get : function(callback){
            if(cookieData == null){
                renew(callback);
            }
            else{
                callback(cookieData);
            }

            return true;
        }
    }
                

})();