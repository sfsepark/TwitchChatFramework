define('tcf',
    ['chatTracker','tcfConfig','picker','observer'],
    function(
        chatTracker, tcfConfig,picker,observer
    ){
        var startCheckers = [];
        var stopHandlers = [];

        
        var isMaster;
        var extension_id;

        var chat_header_class = [['chat__header', 'chat__header-channel-name'], ['chat-room__header', 'chat-room__header-channel-name']];

        function searchCurrentStreamer()
        {
            var cur_streamer = '';

            //chat_header
            var chat_header = [];
            
            for(var index = 0 ; index < chat_header_class.length ; index ++)
            {
                chat_header = document.getElementsByClassName(chat_header_class[index][0]);

                if(chat_header.length != 0)
                {
                    var len = chat_header[0].children.length

                    for(var i = 0 ;i < len ; i ++)
                    {
                        if(chat_header[0].children[i].getAttribute('data-a-target') == chat_header_class[index][1])
                        {
                            cur_streamer = chat_header[0].children[i].innerText;
                            break;
                        }
                    }
                }
            }

            //channel_header
            if(cur_streamer == '')
            {
                var channel_header = document.getElementsByClassName('channel-header');
            
                if(channel_header.length != 0)
                {
                    var channel_header_user = channel_header[0].getElementsByClassName('channel-header__user')[0];
                    var channel_user_name = channel_header_user.getAttribute('href');
                    try{
                        cur_streamer = channel_user_name.substring(1);
                    } catch(err){}
                }

            }

            // from URL
            if(cur_streamer == '')
            {
                var url = location.href;
                var path_name_regex = /(^[^&?#]+)/g;
                var res = url.match(path_name_regex);
                var url_regex = /\/([^\/]+)/g;
                res = res[0].match(url_regex);

                try{
                    if(res.length > 0)
                        if(res[1] == '/popout')
                        {
                            cur_streamer = res[2].substring(1);
                        }
                        else{
                            cur_streamer = res[1].substring(1);
                        }   
                } catch(err){}
            }

            return cur_streamer;
        }

        var channelDectectInterval = null;

        var config = {
            observeFunctions : [],
            pickers : [],
            onLoads : [],
            onReset : [],
            afterSendMethods : []
        }

        function tcfReset(){
            observer.stop();
            observer.reset();

            chatTracker.stop(isMaster); 
            chatTracker.reset();

            config.onReset.forEach(function(onReset){
                onReset();
            })

            config = {
                observeFunctions : [],
                pickers : [],
                onLoads : [],
                onReset : [],
                afterSendMethods : []
            }
        }

        function tcfStart(isMaster,extension_id){
            var streamer;
            var detectClear = true;

            channelDectectInterval = setInterval(function() {  

                var cur_streamer = searchCurrentStreamer();

                if(cur_streamer == '')
                {
                    if(detectClear == false)
                    {                            
                        tcfReset();

                        detectClear = true;
                    }
                }
                else
                {
                    if(cur_streamer != streamer)
                    {
                        tcfReset();
                        
                        streamer = cur_streamer;
                        
                        chatTracker.start(streamer,isMaster);
                        detectClear = false;

                        (function(streamerOnPromise){

                            var startPromises = [];

                            for(var i = 0 ; i < startCheckers.length ;i ++){
                                startPromises.push(startCheckers[i](streamerOnPromise, isMaster)); 
                            }

                            Promise.all(startPromises).then(function(startConfigs){

                                if(detectClear == true || streamerOnPromise != searchCurrentStreamer())
                                {
                                    return;
                                }

                                startConfigs.forEach(function(startConfig){
                                    if(startConfig.pickers != undefined)
                                        config.pickers = config.pickers.concat(startConfig.pickers);
                                    if(startConfig.observeFunctions != undefined)
                                        config.observeFunctions = config.observeFunctions.concat(startConfig.observeFunctions);
                                    if(startConfig.onLoads != undefined)
                                        config.onLoads = config.onLoads.concat(startConfig.onLoads);
                                    if(startConfig.afterSendMethods != undefined)
                                        config.afterSendMethods = config.afterSendMethods.concat(startConfig.afterSendMethods)
                                    if(startConfig.onReset != undefined)
                                        config.onReset = config.onReset.concat(startConfig.onReset);
                                });

                                //chatTracker
                                if(config.pickers.length == 0 && config.onLoads.length == 0 && config.afterSendMethods.length == 0){
                                    chatTracker.stop(isMaster);
                                    chatTracker.reset();
                                }
                                else{
                                    for(var j= 0 ; j < config.onLoads.length ; j ++)
                                    {
                                        chatTracker.addOnLoad(config.onLoads[j]);
                                    }
                                    for(var j = 0 ; j < config.pickers.length ; j ++)
                                    {
                                        chatTracker.registerPicker(config.pickers[j]);
                                    }                                  
                                    for(var j = 0 ; j < config.afterSendMethods.length ; j ++)
                                    {
                                        chatTracker.addAfterSendMethod(config.afterSendMethods[j]);
                                    }      

                                    chatTracker.init();                                                                  
                                }

                                //observer
                                if(config.observeFunctions.length == 0){
                                    observer.stop();
                                    observer.reset();
                                }
                                else{
                                    for(var j = 0 ; j < config.observeFunctions.length ; j ++)
                                    {                                        
                                        observer.registerFunction(config.observeFunctions[j]);
                                    }
                                    observer.start(extension_id);
                                }
                                                        
                            });
                        })(cur_streamer);

                    }
                }
                
            }, 300)
            
        }

        return {
            /*
                startChecker : function 
                - input : streamer name
                - output : new Promise (
                    성공했을 때 resolve(tcfConfig)를 호출하는 promise
                )
            */
            addTextToChatInput : function(txt){
                chatTracker.chatText = chatTracker.chatText + txt;
            },
            
            get chatCursor(){
                delete chatCursor;
                return chatTracker.chatCursor;
            },
            set chatCursor(pos){
                chatTracker.chatCursor = pos;
            },
            get chatText(){
                delete chatText;
                return chatTracker.chatText;
            },
            set chatText(txt){
                chatTracker.chatText = txt;
            },
            addStartChecker : function(startChecker){
                startCheckers.push(startChecker);
            },
            start : function(){
                var timerPromise = new Promise(function(resolve, reject){
                    setTimeout(function(){
                        resolve({result : false , data : "Twitch chat framework TIME OUT"});
                    }
                    ,10000);
                });

                var statusPromise = new Promise(function(resolve){
                    chrome.runtime.sendMessage({type:'tcf_status_get'},function(result){
                        if(result != null && result.data !== undefined){
                            resolve(result.data);
                        }   
                        else{
                            reject('tcf_status_get Failed');
                        }
                    });
                });


                var masterCheckPromise = new Promise(function(resolve){
                    chrome.runtime.sendMessage({type:'master_check'},function(result){
                        if(result != null && result.data !== undefined){
                            
                            isMaster = result.isMaster;
                            resolve(result.data);
                        }   
                        else{
                            reject('master_check_get Failed');
                        }
                    });
                })

                var getIdPromise = new Promise(function(resolve){
                    chrome.runtime.sendMessage({type:'get_extension_id'},function(result){
                        if(result != null && result.data !== undefined){
                            
                            extension_id = result.extension_id;
                            resolve(result.data);
                        }   
                        else{
                            reject('get_id Failed');
                        }
                    });
                })

                var connectPromise = new Promise(function(resolve){
                    Promise.all([statusPromise,masterCheckPromise,getIdPromise]).then(function(values){
                        resolve({result : true , data : values});
                    });
                } );

                Promise.race([timerPromise, connectPromise]).then(function(value){
                    if(value.result == true){
                        for(var i = 0 ; i < value.data.length ; i ++)
                        {
                            if(value.data[i] !== true) return;
                        }

                        tcfStart(isMaster,extension_id); //mastercheck
                    }
                    else{
                        console.log(values.data);
                    }
                }).catch(function(err){console.log(err)});
            },
            stop : function() {

                stopHandlers.forEach(function(stopHandler){
                    stopHandler();
                });
                
                observer.stop();
                clearInterval(observeInterval);

                chatTracker.stop(isMaster); 

                if(channelDectectInterval != null)
                {
                    clearInterval(channelDectectInterval);
                    channelDectectInterval = null;
                }

                chatTracker.reset();
                observer.reset();
            },
            picker : picker ,
            config : tcfConfig,
            refresh : function(){
                chrome.runtime.sendMessage({type:'refresh'},function(result){
                    
                });
            }
        }
    }
);