//picker 스위칭을 위해 cur_picker 를 바꾼다.

//해당 프로그램의 picker를 사용하기 위해서는 반드시 이 소스코드 상의 인터페이스 레이어를 거쳐가야한다(switchPicker).

/*
    switchPicker 
        -> destroyFrame 
        -> drawFrame -> appendPickerFrame 

    destroyFrame에서 deletePickerFrame 호출
*/

define('pickerManager',
["picker"],
    function(picker){

    var xmlHttp = null;

    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", chrome.extension.getURL("html/picker_frame.html"), false );
    xmlHttp.send(null);
    
    var chatFrameHTML = xmlHttp.responseText;
    var originFrame = (function(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild; 
      })(chatFrameHTML);

    //-----------------------------------------------------------------------

    xmlHttp = null;

    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", chrome.extension.getURL("html/picker_button_frame.html"), false );
    xmlHttp.send(null);
    
    var pickerButtonFrameHTML = xmlHttp.responseText;

    //----------------------------------------------------

    var pickers = {};

    var cur_picker = {
        type : null
    };
    
    function changeCurPicker(picker)
    {
        curPickerSetNull();
        
        cur_picker = picker;
    }
    
    function curPickerSetNull()
    {
        cur_picker = {
            type : null
        };
    }

    function turnOffPicker(){
        try{
            if(cur_picker.type != null)
                destroyFrame();
        }
        catch(e){
            
        }
        curPickerSetNull();
    }

    function drawFrame()
    {
        if(cur_picker.drawContentFrame != null)
        {
            cur_picker.contentFrame = cur_picker.drawContentFrame();
        }

        if(cur_picker.drawControlFrame != null)
        {
            cur_picker.controlFrame = cur_picker.drawControlFrame();
        }
    }
    
    function switchPicker(pickerName){

        if(!( typeof(pickerName) === "string" && pickers[pickerName] != undefined) )
        {
            return ;
        }

        var picker = pickers[pickerName];

        if(cur_picker.type != null)
        {
            if(cur_picker.type != picker.type)
            {
                destroyFrame();
                changeCurPicker(picker);
                drawFrame();
                appendPickerFrame();
            }
            else
            {
                try{
                    turnOffPicker();
                }
                catch(e){
                    curPickerSetNull();
                    changeCurPicker(picker);
                    drawFrame();
                    appendPickerFrame();
                }
            }
        }
        else{
            changeCurPicker(picker);
            drawFrame();
            appendPickerFrame();
        }
    }

    var pickerSizeInterval = null;

    var newChat = null;

    function deletePickerFrame()
    {
        clearInterval(pickerSizeInterval);
        if(newChat == null)
        {
            newChat = require('newChat');
        }
        newChat.chat_input_container.removeChild(cur_picker.pickerFrame);
    }
    
    function appendPickerFrame()
    {
        if(!(cur_picker.contentFrame == null && cur_picker.controlFrame == null) )
        {
            cur_picker.pickerFrame = originFrame.cloneNode(true);

            var pickerArea = cur_picker.pickerFrame.getElementsByClassName('nc-picker-content')[0];
            pickerArea.style['max-height'] = '271px';

            pickerSizeInterval = setInterval(
                function (){  

                    var pickerArea = cur_picker.pickerFrame.getElementsByClassName('nc-picker-content');

                    if(pickerArea.length == 0){
                        clearInterval(pickerSizeInterval);
                        pickerSizeInterval = null;
                    }else{
                        if(window.innerHeight < 498)
                        {
                            pickerArea.style['max-height'] = window.innerHeight-(498-271) + 'px';
                        }
                        else{
                            pickerArea.style['max-height'] = '271px';
                        }
                    }
                }
                ,
                100
            );

            if(cur_picker.contentFrame != null)
            {
                var scrollable_area = cur_picker.pickerFrame.getElementsByClassName('nc-picker-content scrollable-area')[0];
                var scroll_content = cur_picker.pickerFrame.getElementsByClassName('simplebar-scroll-content')[0];
                var scroll_frame = cur_picker.pickerFrame.getElementsByClassName('nc-pd-1')[0];

                scroll_frame.appendChild(cur_picker.contentFrame);
            }

            if(cur_picker.controlFrame != null){
                var controlFrameWrapper = document.createElement('div');
                controlFrameWrapper.classList.add('nc-picker-control')
                var emote_picker_frame = cur_picker.pickerFrame.getElementsByClassName('nc-picker')[0];
                emote_picker_frame.appendChild(controlFrameWrapper);
                controlFrameWrapper.appendChild(cur_picker.controlFrame);
            }

            if(newChat == null)
            {
                newChat = require('newChat');
            }
            newChat.chat_input_container.appendChild(cur_picker.pickerFrame);

            if(cur_picker.onLoad != null && cur_picker.onLoad != undefined && typeof(cur_picker.onLoad) === 'function')
                cur_picker.onLoad();
        }
    }

    var destroyFrame = function()
    {
        if(cur_picker.onDestroy != null && cur_picker.onDestroy != undefined && typeof(cur_picker.onDestroy) === 'function')
            cur_picker.onDestroy();

        if(cur_picker.pickerFrame != null && cur_picker.pickerFrame != undefined)
        {
            deletePickerFrame();
        }

        cur_picker.pickerFrame = null;
        cur_picker.contentFrame = null;
        cur_picker.controlFrame = null;
    }

    return {
        registerPicker : function(
            type,
            picker
        ){
            if(typeof(type) === "string"){
                pickers[type] = picker;

                return type;
            }
            else{
                return null;
            }
        },
        removePicker : function(type){
            if(typeof(type) === "string"){
                pickers[type] = undefined;
            }
        },
        resetPicker : function(){
            Object.keys(pickers).forEach(function(key){
                pickers[key] = undefined;
            })
        },
        getPickerButtons : function(){
            var pickerButtons = [];

            var pickers_keys = Object.keys(pickers);

            for(var i = 0 ; i< pickers_keys.length ; i ++)
            {
                if(pickers[pickers_keys[i]].pickerButton == null)
                {
                    var cur_picker = pickers[pickers_keys[i]];

                    var pickerButtonHTML = '' + pickerButtonFrameHTML;
                    pickerButtonHTML=  pickerButtonHTML.replace("\%picker_name\%",cur_picker.type);
                    pickerButtonHTML=  pickerButtonHTML.replace("\%picker_img\%",cur_picker.pickerImg);

                    var pickerButton = (function(htmlString) {
                        var div = document.createElement('div');
                        div.innerHTML = htmlString.trim();
                        return div.firstChild; 
                    })(pickerButtonHTML);
                

                    (function(_this,picker_name) {
                        pickerButton.addEventListener('click',function(){
                            _this.turnOnPicker();
                        })
                    })(this,pickers[pickers_keys[i]].type);

                    pickers[pickers_keys[i]].pickerButton = pickerButton;
                }

                pickerButtons.push( pickers[pickers_keys[i]].pickerButton );
            }

            return pickerButtons;
        },
        switchPicker : switchPicker,
        turnOffPicker : turnOffPicker 
    }
});