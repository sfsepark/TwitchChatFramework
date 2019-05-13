define('chatTarget',['chat_using_tmi'],function(chatMethod){
    function searchingTWDiv(className , data_a_target , frame)
    {
        var target = null;
        
        if(typeof(frame) === undefined)
            frame = document;
    
        var target_list = document.getElementsByClassName(className);
        for(var i = 0 ; i < target_list.length ; i ++) {
            if(target_list[i].getAttribute('data-a-target') == data_a_target)  {
                target = target_list[i];
                break;
            }
        }
    
        return target;
    }

    var clear = function (){
        this.frame = null;
        this.emote_picker = null;
        this.send_button = null;
        this.chat_setting_button = null;
        this.chat_view_list_button = null;
        this.chat_setting_balloon = null;
        this.chat_input = null;
    }

    /*
        registerChatTarget은 기존 채팅입력창(chatTarget) 제어를 위해 각 요소들을 찾아서 저장하고
        하나라도 찾을 수 없으면 거짓, 모두 찾았다면 true를 반환합니다.
    */

    var register = function(cur_frame){
        var cur_emote_picker = null, 
            cur_send_button = null ,
            cur_chat_setting_button = null,
            cur_chat_view_list_button = null,
            cur_chat_input = null;
    
        cur_emote_picker = searchingTWDiv('tw-button-icon--secondary', 'emote-picker-button',cur_frame);
        cur_send_button = searchingTWDiv('tw-core-button', 'chat-send-button',cur_frame);
        cur_chat_setting_button = searchingTWDiv('tw-core-button', 'chat-settings',cur_frame);
        cur_chat_view_list_button = searchingTWDiv('tw-core-button', 'chat-viewer-list',cur_frame);
        cur_chat_input = searchingTWDiv('tw-textarea','chat-input',cur_frame);
    
        if(cur_emote_picker == null || 
            cur_send_button == null ||
            cur_chat_setting_button == null ||
            cur_chat_view_list_button == null ||
            cur_chat_input == null){
            return false;
        }
        else{
            this.frame = cur_frame;
            this.emote_picker = cur_emote_picker;
            this.send_button = cur_send_button;        
            this.chat_setting_button = cur_chat_setting_button;
            this.chat_view_list_button = cur_chat_view_list_button;
            this.chat_input = cur_chat_input;
    
            var cur_style = this.frame.getAttribute('style');
            if(cur_style == null)  {
                this.frame.setAttribute('style','display:none !important;');
            }
            else{
                this.frame.setAttribute('style', cur_style + ';display:none !important;');
            }
            return true;
        }
    }


    return {
        parent_frame : null,
        frame : null,
        emote_picker : null,
        send_button : null,
        chat_view_list_button : null,
        chat_setting_button : null,
        chat_input : null,
        chat_setting_balloon : null, // lazySearching

        clear : clear,
        register : register,
        searchingTWDiv : searchingTWDiv
    }

});


