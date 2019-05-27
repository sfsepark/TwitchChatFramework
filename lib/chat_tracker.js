define('chatTracker',[
    "config",
    'chatTarget',
    'twitchTheme'
], function(config,chatTarget,twitchTheme){

    //--------------------------------------------------
    
    var onLoadFunctions = [];
    var afterSendMethod = [];

    //--------------------------------------------------

    var pickerManager = [];
    
    var INIT_STOP = 0 , INIT_PENDING = 1, INIT_READY = 2, INIT_DONE = 3;
    var INIT_STATUS = INIT_STOP;
    var START_STOP = 0, START_PENDING = 1, START_READY = 2;
    var START_STATUS = START_STOP;

    //Chat Tracking start/stop

    var loadContentInterval = null;

    function startMaster(streamer){
       
        twitchTheme.colorCheckStart(chatTarget);   
                                
        START_STATUS = START_READY;
    }

    function slaveCheck(){

        START_STATUS = START_READY;

    }


    function terminate(isMaster){        
        if(isMaster){
            try{

            }
            catch(e){};

            twitchTheme.colorCheckStop();
            
            chatTarget.clear();

            for(var picker of pickerManager){
                picker.turnOff();
            }
    
        }
        else{
        }
    }

    

    function init(isMaster){

        function onLoadInit(){
            for(var i = 0 ; i < onLoadFunctions.length ; i ++)
            {
                onLoadFunctions[i](chatTarget);
            }
        }

        function appendCustomPickers(){
            if(chatTarget.emote_picker != null){
                for(var i = pickerManager.length - 1 ; i>=0; i --)
                {
                    chatTarget.picker_container.insertBefore(pickerManager[i].getPickerButton(),chatTarget.emote_picker);  
                }
            }
            else{
                for(var i =  0 ; i < pickerManager.length  ; i ++)
                {
                    chatTarget.picker_container.appendChild(pickerManager[i].getPickerButton());  
                }
            }    
        }

        function startBitButtonChecker(){
            chatTarget.chat_input.style = "padding-right : " + (pickerManager.length * 30) + 'px';

            var bitButtonChecker = new MutationObserver(
                function(mutationList,observer){

                    var terminate = false;

                    for(var mutation of mutationList){
                        if(mutation.type == 'childList' && mutation.target == chatTarget.picker_container){
                            for(var addedNode of mutation.addedNodes){

                                if(addedNode.getAttribute('data-a-target') == 'bits-button'){

                                    var firstChild = chatTarget.picker_container.firstChild;
                                    chatTarget.picker_container.insertBefore(addedNode,firstChild);
        
                                    chatTarget.chat_input.style = "padding-right : " + (pickerManager.length * 30 + 30) + 'px';
                                    bitButtonChecker.disconnect();
    
                                    terminate = true;
                                    break;
                                }

                            }
                        }

                        if(terminate == true){
                            break;
                        } 
                    }
                }
            )

            bitButtonChecker.observe(chatTarget.picker_container, { childList: true });
        }

        //main routine of chat_tracker.init()

        onLoadInit();

        var isHide = false;

        for(var picker of pickerManager){
            if(picker.type == 'emote_picker'){
                isHide = true;
                break;
            }
        }

        if(isHide) chatTarget.hideEmotePicker();

        appendCustomPickers();

        if(isMaster){
            startBitButtonChecker();
        }


        chatTarget.chat_input.addEventListener('keydown',function(event){
            if (event.keyCode === 13) {
                setTimeout(function(){
                    if(chatTarget.chat_input.value == '')
                    {
                        for(var method of afterSendMethod){
                            method();
                        }
                    }
                },100);
            }
        });

        chatTarget.send_button.addEventListener('click',function(){
            setTimeout(function(){
                if(chatTarget.chat_input.value == '')
                {
                    for(var method of afterSendMethod){
                        method();
                    }
                }
            },100);   
        });

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
                init(isMaster);
            }

        }, 300);
    }

    function chatTrackingStop(isMaster)
    {
        if(loadContentInterval != null)
            clearInterval(loadContentInterval);

        loadContentInterval = null;

        terminate(isMaster);

        chatTarget.clear();

        for(var picker of pickerManager){
            picker.turnOff();
        }


        INIT_STATUS = INIT_STOP;
        START_STATUS = START_STOP;
    }

    return {     
        chatTarget : chatTarget,    
        addOnLoad : function(handler){
            onLoadFunctions.push(handler);
        },
        addAfterSendMethod : function(callback){
            afterSendMethod.push(callback);
        },    
        start : chatTrackingStart,
        stop : chatTrackingStop,
        init : function(){
            INIT_STATUS = INIT_READY;
        },
        reset : function() {

            function resetOnLoad(){
                onLoadFunctions = [];
            };

            function resetAfterSendMethod(){
                afterSendMethod = [];
            }

            pickerManager = [];
            resetOnLoad();
            resetAfterSendMethod();
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
        },

        get chatCursor(){
            delete chatCursor;
            return chatTarget.chat_input.selectionEnd;
        },
        set chatCursor(pos){
            chatTarget.chat_input.selectionEnd = pos;
        },
        get chatText(){
            delete chatText;
            return chatTarget.chat_input.value;
        },
        set chatText(txt){
            var f = Object.getOwnPropertyDescriptor(chatTarget.chat_input.__proto__,'value').set;
            f.call(chatTarget.chat_input,txt);
            var ev2 = new Event('input', { bubbles: true});
            chatTarget.chat_input.dispatchEvent(ev2);
        },
    }
});
