define('newChat',["twitchTheme",
"chatTarget",'chatUsingTmi'],
    function(twitchTheme,chatTarget,chatMethod){

    //init newChat object

    var newChat = {
        frame : null,
        chat_input : null,
        send_button : null,
        chat_input_buttons_container : null,
        chat_input_container : null,
        viewer_check_button : null,
        chat_setting_button : null,
        picker_buttons_container : null,
        picker_container : null
    }

    var attributeKeys = Object.keys(newChat);

    newChat.attribute = {};


    var xmlHttp = null;

    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", chrome.extension.getURL ("html/chat_frame.html"), false );
    xmlHttp.send(null);
    
    var chatFrameHTML = xmlHttp.responseText;
    var originFrame =(function(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild; 
      })(chatFrameHTML); 

    //private methods of newChat object

    function findFrame(){

        newChat.frame = document.getElementsByClassName('new-chat')[0];

        if(newChat.frame !== null && newChat.frame !== undefined){
            newChat.chat_input_container = newChat.frame.getElementsByClassName('new-chat-input-container')[0];
            newChat.chat_input  = newChat.frame.getElementsByClassName('new-chat-input')[0];   
            newChat.picker_buttons_container = newChat.frame.getElementsByClassName('new-chat-picker-buttons')[0];
            newChat.chat_input_buttons_container = newChat.frame.getElementsByClassName('new-chat-input-buttons-container')[0];
            newChat.chat_setting_button = newChat.frame.getElementsByClassName('nc-CS-button')[0];
            newChat.viewer_check_button = newChat.frame.getElementsByClassName('nc-VC-button')[0];
            newChat.send_button = newChat.frame.getElementsByClassName('new-chat-send-button')[0];
            newChat.picker_container = newChat.frame.getElementsByClassName('nc-picker-container')[0];

            for(var attribute of attributeKeys){

                if(newChat[attribute]  === null || newChat[attribute] === undefined){
                    newChat.clear();
                    return false;
                }
            }

            return true;
        }
        else{
            return false;
        }
    }

    function cloneChatFrame(){
        newChat.frame = originFrame.cloneNode(true);

        newChat.chat_input_container = newChat.frame.getElementsByClassName('new-chat-input-container')[0];
        newChat.chat_input  = newChat.frame.getElementsByClassName('new-chat-input')[0];   
        newChat.picker_buttons_container = newChat.frame.getElementsByClassName('new-chat-picker-buttons')[0];
        newChat.chat_input_buttons_container = newChat.frame.getElementsByClassName('new-chat-input-buttons-container')[0];
        newChat.chat_setting_button = newChat.frame.getElementsByClassName('nc-CS-button')[0];
        newChat.viewer_check_button = newChat.frame.getElementsByClassName('nc-VC-button')[0];
        newChat.send_button = newChat.frame.getElementsByClassName('new-chat-send-button')[0];
        newChat.picker_container = newChat.frame.getElementsByClassName('nc-picker-container')[0];

        newChat.attribute = {};

        for(var i =0  ; i < attributeKeys.length ; i ++)
        {
            newChat.attribute[attributeKeys[i]] = newChat[attributeKeys[i]];
        }
    }

    var onLoadFunctions = [];

    function baseOnLoad(){
        newChat.chat_input.addEventListener('keypress', sendChatEventListener);
    }

    //event listenrs 

    function clearChat()
    {
        newChat.chat_input.innerHTML = '';
    }

    function turnOffPicker(){
        var pre_pickers = newChat.picker_container.children;

        for(pre_picker of pre_pickers){
            newChat.picker_container.removeChild(pre_picker);
        }

    }

    var sendChatEventListener = function(event){
        if(event.key == 'Enter'){
            if(event.altKey == false  && event.shiftKey == false && event.ctrlKey ==false){
                event.preventDefault();
                chatMethod.sendChat(newChat.chat_input.innerText);
                turnOffPicker();
                clearChat();

                for(var i = 0 ; i < afterSendMethod.length ; i++)
                {
                    afterSendMethod[i]();
                }
            }

        }
    };

    var clickSendChatEventListener = function(event){
        chatMethod.sendChat(newChat.chat_input.innerText);
        clearChat();
        turnOffPicker();

        for(var i = 0 ; i < afterSendMethod.length ; i++)
        {
            afterSendMethod[i]();
        }
    };
    
    var clickChatSettingButtonListener = function(event)
    {
        chatMethod.pauseReadyChat();
        turnOffPicker();

        if(chatTarget.chat_setting_balloon == null)
        {
            chatTarget.chat_setting_button.click();
            var searchInterval = setInterval(function(){
                chatTarget.chat_setting_balloon = chatTarget.searchingTWDiv('tw-balloon', 'chat-settings-balloon');
                if(chatTarget.chat_setting_balloon != null)
                {
                    clearInterval(searchInterval);
                }
            },100)
        }
        else{
            var csb_classList = chatTarget.chat_setting_balloon.classList;

            for(var i = 0 ; i < csb_classList.length ; i ++)
            {
                if(csb_classList[i] == 'tw-hide' )
                {
                    chatTarget.chat_setting_button.click();
                }
            }
        }

        var stopCheck_SettingBallooon = function()
        {
            if(chatTarget.chat_setting_balloon != null)
            {
                var csb_classList = chatTarget.chat_setting_balloon.classList;
                for(var i = 0 ; i < csb_classList.length ; i ++){
                    if(csb_classList[i] == 'tw-block'){
                        return false;
                    }
                    else if(csb_classList[i] == 'tw-hide'){
                        return true;
                    }
                }

                return false;
            }
            else
                return false;
        };

        setTimeout(function(){
            chatConversionTrackingStart(stopCheck_SettingBallooon);
        },150);
        
    }

    var clickChatViewerButtonListener = function(event)
    {
        chatTarget.chat_view_list_button.click();
    }

    
    // public methods of newChat object

    /*
        설정, 비트 표시등을 위한 채팅 전환 트래킹.

        반드시 필요할 때만 start할것. (stop은 stopCheck 함수의 조건에 의해 이뤄짐.)
        stopCheck function 은 되도록 빨리 처리할수 있도록 할 것.
    */
   
    function chatConversionTrackingStart(stopCheck)
    {
        //normal mode check - 설정, 비트
        newChat.frame.style = 'display:none !important;';
        chatTarget.frame.style = 'display:block;';

        var stopCheckInterval = setInterval(function(){
            if(typeof(stopCheck) != 'function' || stopCheck() == true)
            {
                chatTarget.frame.style = 'display:none !important;';
                newChat.frame.style = 'display:block;';
                
                if(typeof(chatMethod.isPaused) != 'boolean' ||
                    (typeof(chatMethod.isPaused) == 'boolean' 
                    && chatMethod.isPaused == true)) {
                    chatMethod.restartReadyChat();
                }

                clearInterval(stopCheckInterval);
            }
        }, 100);
    }

    var afterSendMethod= [];

    newChat.addOnLoad = function(handler){
        onLoadFunctions.push(handler);
    };

    newChat.resetOnLoad = function(){
        onLoadFunctions = [];
    };

    newChat.getAttributes = function(){
        var attributes = {}

        for(var i = 0 ; i < attributeKeys.length ;i ++){
            attributes[attributeKeys[i]] = this[attributeKeys[i]];
        }

        return attributes;
    }

    //new chat integrity check
    newChat.intergrityCheck = function(){
        for(var i = 0 ; i < attributeKeys.length; i ++)
        {
            if(this[attributeKeys[i]] == null) return false;
        }

        return true;
    }

    //start of createNewChat

    newChat.create = function(){
        cloneChatFrame();

        baseOnLoad(this);

        this.viewer_check_button.addEventListener('click',clickChatViewerButtonListener);
        this.chat_setting_button.addEventListener('click', clickChatSettingButtonListener);
        this.send_button.addEventListener('click',clickSendChatEventListener);

        newChat.chat_input.addEventListener("paste", function(e){
            // cancel paste
            e.preventDefault();
            // get text representation of clipboard
            var text = e.clipboardData.getData("text/plain");
            // insert text manually
            document.execCommand("insertHTML", false, text);
        });

        newChat.chat_input.addEventListener('drop',function(e){
            // cancel paste
            e.preventDefault();
            // get text representation of clipboard
            var text = e.dataTransfer.getData("text/html");
            var tmpdiv = document.createElement('img');
            tmpdiv.innerHTML = text;
            if(tmpdiv.hasChildNodes)
            {
                var tmpimg = tmpdiv.firstChild;
                if(tmpimg.nodeName == 'IMG' && tmpimg.alt != null){
                    text = tmpimg.alt;
                    
                    // insert text manually
                    document.execCommand("insertHTML", false, text);
                }
            }
            else{
                var text = e.dataTransfer.getData("text/plain");
                document.execCommand("insertHTML", false, text)
            }
        });
        
        twitchTheme.changeThemeUI(this);
    }

    newChat.onLoadInit = function(){
        for(var i = 0 ; i < onLoadFunctions.length ; i ++)
        {
            onLoadFunctions[i](this.attribute);
        }
    }

    //delete of appendNewChat

    newChat.delete = function() {
        var deletedFrames = document.getElementsByClassName('new-chat');

        for(var i = 0 ; i < deletedFrames.length ; i ++)
        {
            deletedFrames[i].parentElement.removeChild(deletedFrames[i]);
        }
    }

    newChat.clear = function(){
        attributeKeys.forEach(function(attribute)
            {
                newChat[attribute] = null;
                newChat['attribute'][attribute] = null;
            });
    }

    newChat.setChatMethod = function(method){
        chatMethod = method;
    }

    newChat.appendPickerButton = function(pickerButton){
        newChat.picker_buttons_container.appendChild(pickerButton);
    }

    newChat.addAfterSendMethod = function(callback){
        afterSendMethod.push(callback);
    }

    newChat.resetAfterSendMethod = function(){
        afterSendMethod = [];
    }

    newChat.turnOffPicker = turnOffPicker;

    newChat.findFrame = findFrame;

    return newChat;
});
