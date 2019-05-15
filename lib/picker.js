define('picker',['twitchTheme'],function(twitchTheme){

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

    var chatTarget = null;

    var disableCheckObserver = function(cur_picker){
        var target;
        var observer ;
        var disableCheckCallback = function(mutationsList, observer){
            for(var mutation of mutationsList){
                if(mutation.type == 'childList' && mutation.target == target){
                    for(var addedNode of mutation.addedNodes){
                        if(addedNode.getAttribute('data-a-target') == 'bits-card'){
                            cur_picker.turnOff();
                        }
                    }            
                }
            }
        }

        observer = new MutationObserver(disableCheckCallback);

        return {
            observe : function(){
                if(chatTarget == null){
                    chatTarget = require('chatTarget');
                }
                target = chatTarget.picker_container.parentElement;

                observer.observe(target, { childList: true });
            },
            disconnect : function(){
                observer.disconnect();
            }
        }
    };

    function picker(
        type,
        pickerImg,
        drawContentFrame,
        drawControlFrame,
        onLoad,
        onDestroy
    ){
        this.type = type;

        this.pickerImg = pickerImg;
        
        this.drawContentFrame = drawContentFrame;
        this.drawControlFrame = drawControlFrame;

        this.onLoad = onLoad;
        this.onDestroy = onDestroy;

        this.pickerFrame = null;
        this.contentFrame = null;
        this.controlFrame = null;

        this.state = false;

        this.disableCheckObserver = disableCheckObserver(this);
    }

    picker.prototype.turnOn = function(){

        if(this.state == false){
            //draw Frame
            if(this.drawContentFrame != null)
            {
                this.contentFrame = this.drawContentFrame();
            }

            if(this.drawControlFrame != null)
            {
                this.controlFrame = this.drawControlFrame();
            }

            //append picker frame

            if(!(this.contentFrame == null && this.controlFrame == null) )
            {
                this.pickerFrame = originFrame.cloneNode(true);

                var pickerArea = this.pickerFrame.getElementsByClassName('nc-picker-content')[0];
                this.pickerFrame.setAttribute('picker-type', this.type);
                pickerArea.style['max-height'] = '271px';

                var cur_picker = this;

                this.pickerSizeInterval = setInterval(
                    function (){  
                        try{
                            var pickerArea = cur_picker.pickerFrame.getElementsByClassName('nc-picker-content');

                            if(pickerArea.length == 0){
                                cur_picker.turnOff();
                            }else{
                                pickerArea = pickerArea[0];

                                if(window.innerHeight < 498)
                                {
                                    pickerArea.style['max-height'] = window.innerHeight-(498-271) + 'px';
                                }
                                else{
                                    pickerArea.style['max-height'] = '271px';
                                }
                            }
                        }
                        catch(e){
                            cur_picker.turnOff();
                        }
                        
                    }
                    ,
                    100
                );

                if(this.contentFrame != null)
                {
                    var scrollable_area = this.pickerFrame.getElementsByClassName('nc-picker-content scrollable-area')[0];
                    var scroll_content = this.pickerFrame.getElementsByClassName('simplebar-scroll-content')[0];
                    var scroll_frame = this.pickerFrame.getElementsByClassName('nc-pd-1')[0];

                    scroll_frame.appendChild(this.contentFrame);
                }

                if(this.controlFrame != null){
                    var controlFrameWrapper = document.createElement('div');
                    controlFrameWrapper.classList.add('nc-picker-control')
                    var emote_picker_frame = this.pickerFrame.getElementsByClassName('nc-picker')[0];
                    emote_picker_frame.appendChild(controlFrameWrapper);
                    controlFrameWrapper.appendChild(this.controlFrame);
                }

                if(chatTarget == null)
                {
                    chatTarget  = require('chatTarget ');
                }
                chatTarget .picker_container.appendChild(this.pickerFrame);

                if(this.onLoad != null && this.onLoad != undefined && typeof(this.onLoad) === 'function')
                    this.onLoad();

            }

            this.disableCheckObserver.observe();

            this.state = true;
        }
        
    }

    picker.prototype.turnOff = function(){

        if(this.state == true)
        {
            clearInterval(this.pickerSizeInterval);
            this.pickerSizeInterval = null;
    
            this.disableCheckObserver.disconnect();
    
            if(this.onDestroy !== null && this.onDestroy !== undefined && typeof(this.onDestroy) === 'function')
                this.onDestroy();
    
            this.pickerFrame = null;
            this.contentFrame = null;
            this.controlFrame = null;
    
            this.state = false;
        }

    }

    picker.prototype.setPickerImg = function(light, dark){
        if(light != undefined)
            twitchTheme.light.addPickerImg(this, light);
        if(dark != undefined){
            twitchTheme.dark.addPickerImg(this, dark);
        }
    }

    picker.prototype.getPickerButton = function(){

        function switchPicker(picker){
            var pre_picker = document.getElementsByClassName('nc-picker-frame');

            if(chatTarget == null){
                chatTarget = require('chatTarget');
            }

            if(pre_picker.length > 0){
                if(pre_picker[0].getAttribute('picker-type') == picker.type){
                    chatTarget.picker_container.removeChild(pre_picker[0]);
                }
                else{
                    chatTarget.picker_container.removeChild(pre_picker[0]);
                    picker.turnOn();
                }
            }
            else{
                picker.turnOn();
            }
        }

        if(this.pickerButton == null){

            var pickerButtonHTML = '' + pickerButtonFrameHTML;
            pickerButtonHTML=  pickerButtonHTML.replace("\%picker_name\%",this.type);
            pickerButtonHTML=  pickerButtonHTML.replace("\%picker_img\%",this.pickerImg);
    
            var pickerButton = (function(htmlString) {
                var div = document.createElement('div');
                div.innerHTML = htmlString.trim();
                return div.firstChild; 
            })(pickerButtonHTML);
    
            (function(_this){
                pickerButton.addEventListener('click',function(){
                    switchPicker(_this);
                });
            })(this)


            this.pickerButton = pickerButton;
        }

        return this.pickerButton;

    }

    return picker;
})
