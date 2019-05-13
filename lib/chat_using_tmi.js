define('chatUsingTmi',['chatTarget'],function(chatTarget) {
    var msg_KR_dict = {
        msg_banned : "이 방에서 영구히 정지당하였습니다."
    }

    var join_cache = (function(){

        var cache = [];

        return {
            join : function(channel){
                return new Promise(function(resolve, reject){

                    if(cache.includes(channel)){
                        var index = cache.indexOf(channel);
                        if (index !== -1) cache.splice(index, 1);
                    }

                    if(!chatClient.getChannels().includes('#' + channel))
                    {
                        chatClient.join(channel).then(function(data){
                            cache.push(channel);
                            resolve(channel);
                        }).catch(function(data){
                            reject(data);
                        })                          
                    }
                    else{
                        cache.push(channel);
                        resolve(channel);
                    }

                    if(cache.length > 5){
                        var victim = cache.shift();
                        chatClient.part(victim);
                    }
                       
                });
            }
        };
    })();

    var user_info;
    var connectPromise = null;
    var chatClient = null;

    var nc_before = 'nc-before';
    var nc_status = 'nc-status';

    var curLogDiv = null;

    var addChatLog = function(logDiv, message){
        var ncStatus = document.createElement('div');
        ncStatus.classList.add('chat-line__status');
        ncStatus.classList.add(nc_status);
        ncStatus.innerText = message;

        var logs = logDiv.children;

        if(logs.length > 0){
            curLogDiv = logDiv;

            logDiv.appendChild(ncStatus);

            chatLogObserver.disconnect();
            chatLogObserver.observe(logDiv,{childList : true});
        }
    }

    var chatLogObserver = new MutationObserver(function(mutations){
        mutations.forEach(function(mutation){
            if(mutation.type == "childList"){
                while(curLogDiv.firstChild.classList.contains(nc_status)){
                    curLogDiv.removeChild(curLogDiv.firstChild)   ; 
                }
            }   
        });
    })

    var connectPromise = new Promise(function(resolve, reject){

        function connect(user_info){
            var authToken = user_info.authToken;
            var userName = user_info.login;
    
            var chatClientOptions = {
                options: {
                    debug: false
                },
                connection: {
                    reconnect: true,
                    secure : true
                },
                identity: {
                    username: userName,
                    password: "oauth:" + authToken
                }
            }
    
            chatClient = new tmi.client(chatClientOptions);            
            connectPromise = chatClient.connect();
            resolve(true);

            connectPromise.then(function(result){
                chatClient.on("notice", function(channel, msgid, message){
                    if(chatTarget.frame != null){
                        console.log('notice : ',channel,msgid, message);
                        var parentFrame = chatTarget.frame.parentElement;
                        var chatLine = parentFrame.getElementsByClassName('chat-list__lines')[0];
                        var logLine = chatLine.getElementsByClassName('tw-flex-grow-1 tw-full-height tw-pd-b-1')[0];

                        if(logLine.getAttribute('role') == 'log'){
                            addChatLog(logLine,message);                            
                        }
                    }
                });
            });
            
        }

        chrome.runtime.sendMessage({type:'user_info'}, function(response)
        {      
            if(chatClient != null){
                chatClient.disconnect();
            }

            if(response != null)
            { 
                if(response.authToken != null){
                    connect(response);
                }
                else{
                    chatClient = null;
                    resolve(true); // 유저가 로그인 되어있지 않더라도 chatMethod는 작동해야한다.(단, 채팅은 보내지면 안 됨)
                }
            }
            else{
                chatClient = null;
                resolve(false);
            }
        });
    
    });


    /*

    chrome.runtime.onMessage.addListener(
        function(request){
            if(request != null && request.type == 'user_info'){
                if(chatClient != null){
                    chatClient.disconnect();
                }
                user_info = request.data;
                if(request.data != null){
                    connect(request.data);
                }
                else{
                    chatClient = null;
                }
            }
        }
    );
*/

    var chatClient = null;
    var chatClientConnected = false;
    var chatClientChannel = '';

    return {
        sendChat :
            function(message)
            {
                if(chatClientConnected && chatClientChannel != '')
                {
                    chatClient.say(chatClientChannel, message);
                }
                else{
                    if(user_info == null)
                    {
                        if(chatTarget.send_button != undefined && chatTarget.send_button != null){
                            try{
                                chatTarget.send_button.click();       
                            }
                            catch(e){};
                        }
                    }
                }
            },

        readyChat :
            function(channel)
            {
                if(chatClient != null)
                {
                    connectPromise.then(function(){
                        join_cache.join(channel).then(function(channel){
                            chatClientChannel = channel;
                            chatClientConnected = true;
                        }).catch(function(err){
                            console.log(err);
                        })
                    });
                }
            },
        
        //트위치 이모티콘을 이용한 chatMethod에서만 pause/restart 기능이 필요하다.
        pauseReadyChat : function(){ },
        restartReadyChat :  function()  { },
    
        cleanUpReadyChat :
            function()
            {
                chatClientConnected = false;
                chatClientChannel = '';
            },
        connectPromise : connectPromise
            
    }
});
