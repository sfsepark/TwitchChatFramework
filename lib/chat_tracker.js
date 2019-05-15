define('chatTracker',[
    "config",
    'chatUsingTmi',
    'chatTarget',
    'newChat',
    'twitchTheme'
], function(config,chatUsingTmi,chatTarget,newChat,twitchTheme){

    //--------------------------------------------------

    var pickerManager = [];

    var chatMethod = chatUsingTmi;
    
    var INIT_STOP = 0 , INIT_PENDING = 1, INIT_READY = 2, INIT_DONE = 3;
    var INIT_STATUS = INIT_STOP;
    var START_STOP = 0, START_PENDING = 1, START_READY = 2;
    var START_STATUS = START_STOP;

    //Chat Tracking start/stop

    var loadContentInterval = null;

    function startMaster(streamer){

        chatMethod.cleanUpReadyChat();                        

        newChat.create();

        chatTarget.parent_frame = chatTarget.frame.parentElement;
        chatTarget.parent_frame.appendChild(newChat.frame);
        
        twitchTheme.colorCheckStart(newChat);
        
        chatMethod.readyChat(streamer);        
                                
        START_STATUS = START_READY;
    }

    function slaveCheck(){
        setTimeout(function(){
            if(newChat.findFrame()){
                START_STATUS = START_READY;
            }
            else{
                slaveCheck();
            }
        },300);
    }


    function terminate(isMaster){        
        if(isMaster){
            try{
                newChat.turnOffPicker();
            }
            catch(e){};

            chatMethod.cleanUpReadyChat();
            twitchTheme.colorCheckStop();
            
            chatTarget.clear();
            newChat.delete();
            newChat.clear();
        }
        else{
            newChat.clear();
        }
    }

    function init(){
        newChat.onLoadInit();

        chatTarget.hideEmotePicker();

        for(var i = 0 ; i< pickerManager.length ;i  ++)
        {
            chatTarget.picker_container.appendChild(pickerManager[i].getPickerButton());    
            //newChat.appendPickerButton(pickerManager[i].getPickerButton());
        }
    }

    function chatTrackingStart(streamerInfo, isMaster)
    {
        chatTrackingStop(isMaster);
        INIT_STATUS = INIT_PENDING;
        START_STATUS = START_PENDING;

        loadContentInterval = setInterval(function() {
            var cur_frame = document.getElementsByClassName('chat-input','pd-b-2')[0];

            if(cur_frame == null) {
                terminate(isMaster);
                START_STATUS = START_PENDING;
                if(INIT_STATUS == INIT_DONE){
                    INIT_STATUS = INIT_READY;
                }
            }
            else{
                if(chatTarget.frame != cur_frame){
                    if( chatTarget.register(cur_frame) )   {
                        if(isMaster){
                            startMaster(streamerInfo);    
                        }
                        else{
                            slaveCheck();
                        }
                    }
                    else { //오류처리용 -> 대부분은 이 구간이 아니고 위에서 사건이 발생함.
                        terminate(isMaster);
                        START_STATUS = START_PENDING;
                        if(INIT_STATUS == INIT_DONE){
                            INIT_STATUS = INIT_READY;
                        }
                    }                
                } 
            }

            if(START_STATUS == START_READY && INIT_STATUS == INIT_READY){
                INIT_STATUS = INIT_DONE;
                init();
            }

        }, 300);
    }

    function chatTrackingStop(isMaster)
    {
        if(loadContentInterval != null)
            clearInterval(loadContentInterval);

        loadContentInterval = null;

        
        terminate(isMaster);

        if(isMaster === true){
            try{
                chatTarget.frame.style = 'display:block!important;';
            }catch(e){
                try{
                    chatTarget.parent_frame.getElementsByClassName('chat-input')[0].style = 'display:block!important;';
                }
                catch(e){

                }
            }
        }

        chatTarget.clear();


        INIT_STATUS = INIT_STOP;
        START_STATUS = START_STOP;
    }

    return {         
        addOnLoad : newChat.addOnLoad,
        addAfterSendMethod : newChat.addAfterSendMethod,
        start : chatTrackingStart,
        stop : chatTrackingStop,
        init : function(){
            INIT_STATUS = INIT_READY;
        },
        reset : function() {
            pickerManager = [];
            newChat.resetOnLoad();
            newChat.resetAfterSendMethod();
        },

        registerPicker : function(picker){
            pickerManager.push(picker)
        },
        removePicker : function(){
            var what, a = arguments, L = a.length, ax;
            while (L && pickerManager.length) {
                what = a[--L];
                while ((ax = pickerManager.indexOf(what)) !== -1) {
                    pickerManager.splice(ax, 1);
                }
            }
        }
    }
});
