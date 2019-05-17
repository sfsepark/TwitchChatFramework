define('twitchTheme',function(){
    var Theme = function(
            setting,
            viewer_check,
            new_chat_css){

        this.setting_img_url = chrome.extension.getURL(setting);
        this.viewer_check_img_url = chrome.extension.getURL(viewer_check);
        this.new_chat_css = new_chat_css;

        this.pickers = {};
    };

    /*
    theme_info = {
        content : [function(){} ...],
        control : [function(){} ...]
    }
    */
    Theme.prototype.addPickerImg = function(picker,pickerImg){
        if(this.pickers[picker.type] == undefined){
            this.pickers[picker.type] = {};
            this.pickers[picker.type].picker = picker;
        }
        this.pickers[picker.type].pickerImg = pickerImg;
    }
    Theme.prototype.addPickerInfo = function(picker, theme_info)
    {
        if(this.pickers[picker.type] == undefined){
            this.pickers[picker.type] = {}; 
            this.pickers[picker.type].picker = picker;
        }
        this.pickers[picker.type].content = theme_info.content;
        this.pickers[picker.type].cotrol = theme_info.control;
    }

    Theme.prototype.deletePickerInfo = function(picker)
    {
        if(this.pickers[picker.type] != undefined && this.pickers[picker.type] != null)
            delete this.pickers[picker.type];
    }

    Theme.prototype.changeThemeUI = function(target){
        try{
            this.changePickerUI();
            if(target.frame.classList.contains(dark_theme.new_chat_css)){
                target.frame.classList.replace(dark_theme.new_chat_css,this.new_chat_css); 
            }
            else if(target.frame.classList.contains(light_theme.new_chat_css)){
                target.frame.classList.replace(light_theme.new_chat_css,this.new_chat_css); 
            }
            else{
                target.frame.classList.add(this.new_chat_css); 
            }
            
        }
        catch(e){

        }
    }    

    Theme.prototype.changePickerUI = function()
    {
        Object.values(this.pickers).forEach(function(pickerInfo){
            var contentFrame = pickerInfo.picker.contentFrame;
            if(contentFrame != undefined && contentFrame != null && typeof(pickerInfo.content) === "object")
            {
                for(var i = 0 ;i < pickerInfo.content.length ; i ++)
                {
                    if(typeof(pickerInfo.content[i]) === 'function')
                    {
                        (pickerInfo.content[i])();
                    }
                }
            }

            var controlFrame = pickerInfo.picker.controlFrame;
            if(controlFrame != undefined && controlFrame != null && typeof(pickerInfo.contorl) === "object")
            {
                for(var i = 0 ;i < pickerInfo.control.length ; i ++)
                {
                    if(typeof(pickerInfo.control[i]) === 'function')
                    {
                        (pickerInfo.control[i])();
                    }
                }
            }

            var pickerButton = pickerInfo.picker.pickerButton;
            if(pickerButton != undefined && pickerButton != null && pickerInfo.pickerImg != null && pickerInfo.pickerImg != undefined)
            {
                pickerButton.getElementsByClassName('picker_button_img')[0].src = pickerInfo.pickerImg;
            }
            pickerInfo.picker.pickerImg = pickerInfo.pickerImg;
        });
    }

    var light_theme = new Theme(
        'gear.png', //setting
        'menu.png', //viewer_check
        'nc-light' //new-chat-css
    ); 
    var dark_theme = new Theme(
        'black_gear.png', //setting
        'black_menu.png', //viewer_check
        'nc-dark'  //new-chat-css
    );

    

    var curTwitchTheme = light_theme;

    var themeCheckConfig = {attributes: true, childList: false, characterData: false};

    var themeCheckObserver = null;

    function themeCheckObserve(chatSection, target){
        themeCheckObserver = new MutationObserver(function(mutations){
            mutations.forEach(function(mutation){
                if(mutation.type == 'attributes' &&
                    mutation.attributeName == 'data-a-target'){
                        
                        var themeAttribute = mutation.target.getAttribute('data-a-target');
        
                        var cur_theme = curTwitchTheme;
        
                        if(themeAttribute.match('dark') != null){
                            cur_theme = dark_theme;
                        }
                        else if(themeAttribute.match('light') != null)  {
                            cur_theme = light_theme;
                        }
        
                        if(cur_theme != curTwitchTheme){
                            curTwitchTheme = cur_theme;
                            curTwitchTheme.changeThemeUI(target);
                        }
                }   
            });
        });

        themeCheckObserver.observe(chatSection,themeCheckConfig);
    }


    //target : chatTarget
    function colorCheckStart(target){
        var chatSectionList = document.getElementsByTagName('section');

        for(var i = 0 ;i < chatSectionList.length ; i ++)
        {
            var data_a_target = chatSectionList[i].getAttribute('data-a-target');

            if(data_a_target != null)
            {
                if(data_a_target.match('dark') != null){
                    curTwitchTheme = dark_theme;
                    themeCheckObserve(chatSectionList[i],target);
                    return curTwitchTheme;
                }
                else if(data_a_target.match('light') != null)  {
                    twitchColor = light_theme;
                    themeCheckObserve(chatSectionList[i],target);
                    return curTwitchTheme;
                }
            }
        }

        return null;
    }

    function colorCheckStop(){
        if(themeCheckObserver != null)
        {
            themeCheckObserver.disconnect();
        }
    }

    return {
        colorCheckStart : colorCheckStart,
        colorCheckStop : colorCheckStop,
        light : light_theme,
        dark : dark_theme,
        changeThemeUI : function(target){
            curTwitchTheme.changeThemeUI.call(curTwitchTheme,target);
        }
    }

});