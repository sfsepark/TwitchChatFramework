/*
    TWITCH CHAT FRAMEWORK.js
    version : 1.0
    developer : sfsepark@gmail.com
*/

chrome.runtime.sendMessage({type:'refresh'},function(result){
    
});

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        //Allow using this built library as an AMD module
        //in another project. That other project will only
        //see this AMD call, not the internal modules in
        //the closure below.
        define([], factory);
    } else {
        //Browser globals case. Just assign the
        //result to a property on the global.
        root.tcf = factory();
    }
}(this, function () {
/**
 * @license almond 0.3.3 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, http://github.com/requirejs/almond/LICENSE
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part, normalizedBaseParts,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name) {
            name = name.split('/');
            lastIndex = name.length - 1;

            // If wanting node ID compatibility, strip .js from end
            // of IDs. Have to do this here, and not in nameToUrl
            // because node allows either .js or non .js to map
            // to same file.
            if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
            }

            // Starts with a '.' so need the baseName
            if (name[0].charAt(0) === '.' && baseParts) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that 'directory' and not name of the baseName's
                //module. For instance, baseName of 'one/two/three', maps to
                //'one/two/three.js', but we want the directory, 'one/two' for
                //this normalization.
                normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                name = normalizedBaseParts.concat(name);
            }

            //start trimDots
            for (i = 0; i < name.length; i++) {
                part = name[i];
                if (part === '.') {
                    name.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    // If at the start, or previous value is still ..,
                    // keep them so that when converted to a path it may
                    // still work when converted to a path, even though
                    // as an ID it is less than ideal. In larger point
                    // releases, may be better to just kick out an error.
                    if (i === 0 || (i === 1 && name[2] === '..') || name[i - 1] === '..') {
                        continue;
                    } else if (i > 0) {
                        name.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
            //end trimDots

            name = name.join('/');
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    //Creates a parts array for a relName where first part is plugin ID,
    //second part is resource ID. Assumes relName has already been normalized.
    function makeRelParts(relName) {
        return relName ? splitPrefix(relName) : [];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relParts) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0],
            relResourceName = relParts[1];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relResourceName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relResourceName));
            } else {
                name = normalize(name, relResourceName);
            }
        } else {
            name = normalize(name, relResourceName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i, relParts,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;
        relParts = makeRelParts(relName);

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relParts);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, makeRelParts(callback)).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());
define("../almond", function(){});

define('config',[],function(){
    //Config

    function config(configObj){
        this.configObj = configObj;
    }

    //config 를 클래스처럼 이용하고자 prototype을 사용했다

    config.prototype.setConfig = function(replaced){
        if(typeof(replaced) === Object){
            Object.keys(replaced).forEach(function(key){
                if(this.configObj[key] != undefined){

                    this.configObj[key][value] = replaced[key];
                    if(typeof(this.configObj[key].method) === "function")
                    {
                        this.configObj[key].method(replaced[key]);
                    }

                }
            });
        }
    };
        
    config.prototype.getConfig = function(keys){
        var returnValue = {};

        if(keys.length <= 0)
        {
            Object.keys(this.configObj).forEach(function(key){
                returnValue[key] = this.configObj[key][value];
            });
        }
        else{
            for(var i = 0 ; i < keys.length ; i ++)
            {
                var key = keys[i];
                returnValue[key] = this.configObj[key][value];
            }
        }

        return returnValue;
    }

    return config;
});
define('twitchTheme',[],function(){
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
        if(target.intergrityCheck() == true){
            target.chat_setting_button.getElementsByClassName('chat_setting_img')[0].src =
                this.setting_img_url;
            target.viewer_check_button.getElementsByClassName('view_check_img')[0].src = 
                this.viewer_check_img_url;
            target.frame.setAttribute('class','new-chat ' + this.new_chat_css);
    
            this.changePickerUI();
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


    //target : newChat
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
define("twitch_theme", function(){});

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

    var newChat = null;

    var disableCheckObserver = function(cur_picker){
        var target;
        var observer ;
        var disableCheckCallback = function(mutationsList, observer){
            for(var mutation of mutationsList){
                if(mutation.type == 'childList'){
                    var picker_frame = target.getElementsByClassName('nc-picker-frame');

                    if(picker_frame.length == 0){
                        cur_picker.turnOff();
                    }
                    else{
                        if(!(picker_frame[0].getAttribute('picker-type') == cur_picker.type))
                        {
                            cur_picker.turnOff();
                        }
                    }
                }
            }
        }

        observer = new MutationObserver(disableCheckCallback);

        return {
            observe : function(){
                if(newChat == null){
                    newChat = require('newChat');
                }
                target = newChat.picker_container;

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

            if(newChat == null)
            {
                newChat = require('newChat');
            }
            newChat.picker_container.appendChild(this.pickerFrame);

            if(this.onLoad != null && this.onLoad != undefined && typeof(this.onLoad) === 'function')
                this.onLoad();

        }

        this.disableCheckObserver.observe();

        this.state = true;
    }

    picker.prototype.turnOff = function(){

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

            if(newChat == null){
                newChat = require('newChat');
            }

            if(pre_picker.length > 0){
                if(pre_picker[0].getAttribute('picker-type') == picker.type){
                    newChat.picker_container.removeChild(pre_picker[0]);
                }
                else{
                    newChat.picker_container.removeChild(pre_picker[0]);
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
;
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



define("chat_target", function(){});

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

define("chat_using_tmi", function(){});

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

define("new_chat", function(){});

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

        for(var i = 0 ; i< pickerManager.length ;i  ++)
        {
            newChat.appendPickerButton(pickerManager[i].getPickerButton());
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

define("chat_tracker", function(){});

define('tcfConfig',[],function(){
    function tcfInfo(
        observeFunctions,
        pickers,
        onLoads,
        onReset,
        afterSendMethods
    ){
        if(typeof(observeFunctions) === 'object')
            this.observeFunctions = observeFunctions;
        if(typeof(pickers) === 'object')
            this.pickers = pickers;
        if(typeof(onLoads) === 'object')
            this.onLoads = onLoads;
        if(typeof(afterSendMethods) === 'object')
            this.afterSendMethods = afterSendMethods;
        if(typeof(onReset) === 'object')
            this.onReset = onReset;
    }

    return tcfInfo;
});

define("tcf_config", function(){});

define('observer',[],function(){

    var cur_li_id = 'emberXXXX';
    var next_li_id = 'emberXXXX';

    var observeInterval = null;

    //dummy target
    var target = document;
    //dummy observer
    var observer = new MutationObserver(function(){});
        
    // configuration of the observer:
    var config = { attributes: true, childList: true, characterData: true };

    var observeFunction = [];
    var chatMessage = '';
    var emoteName = 'emote-name';


    var TCF_CHANGED_ATTR = 't_';

    var addChatDetectObserver = function(extension_id)
    {
        TCF_CHANGED_ATTR = 't_' + extension_id;

        var chatDectectObserve = function(){
            //origin(regacy)
            target_lists = document.getElementsByClassName('chat-lines');
        
            if(target_lists.length != 0)
            {
                chatMessage = 'message';
            }
            else
            {
                //twitch(new) 
                target_lists = document.getElementsByClassName('chat-list__lines');

                if(target_lists.length != 0)
                { 
                    target_lists = target_lists[0].getElementsByClassName('simplebar-content');
                    target_lists = target_lists[0].getElementsByClassName('full-height');
                    
                    if(target_lists.length == 0)
                    {
                        target_lists = document.getElementsByClassName('chat-list__lines');
                        target_lists = target_lists[0].getElementsByClassName('simplebar-content');
                        target_lists = target_lists[0].getElementsByClassName('tw-full-height');
                    }
                    chatMessage = 'chat-message-text';
                }
                else
                {
                    //clip,video chatting
                    target_lists = document.getElementsByClassName('qa-vod-chat');
                    if(target_lists.length != 0)
                    {
                        target_lists = target_lists[0].getElementsByClassName('tw-align-items-end');
                        chatMessage = 'qa-mod-message';
                    }
                    else
                    {
                        chatMessage = '';
                    }
                }
            }

            if(target_lists.length != 0)
            {
                if(target != target_lists[0])
                {
                    observer.disconnect();  

                    target = target_lists[0];
                    
                    // create an observer instance
                    observer = new MutationObserver(function(mutations) {
                        chat_detect();  
                    });
            
                    observer.observe(target, config);
                }  
            }
        
        }

        observeInterval = setInterval(chatDectectObserve, 2000);
    }

    var chat_detect = function(){
        if(chatMessage == 'message')
        {
            var cur_li = target.lastElementChild;
            next_li_id = cur_li.id;
        
            var len = target.children.length;

            for(var i = len - 1 ; i >= 0 ; i --)
            {
                var child =  target.children[i];

                if(cur_li_id != child.id)
                {
                    var is_admin = false;

                    for(var c in child.classList)
                    {
                        if(child.classList[c] == "admin")
                            is_admin = true;
                    }
                    if(!is_admin)
                        edit_chating(child);
                }
                else{
                    break;
                }
            }

            cur_li_id = next_li_id;
        }
        else if(chatMessage == 'chat-message-text')
        {
            var child = target.children;
            var len = child.length;

            for(var i = len - 1 ; i >= 0 ; i --)
            {
                if(child[i].getAttribute(TCF_CHANGED_ATTR) == 'true')
                {
                    break;
                }
                else{
                    child[i].setAttribute(TCF_CHANGED_ATTR,'true');

                    for(var c in child[i].classList)
                    {
                        if(child[i].classList[c] == "chat-line__message")
                            edit_chating(child[i]);              
                            break;
                    }
                }            
            }  

        }
        else if(chatMessage == 'qa-mod-message')
        {
            for(var i = target.children.length - 1; i >= 0; i --)
            {
                var child = target.children[i];

                if(child.getAttribute(TCF_CHANGED_ATTR) == 'true')
                {
                    break;
                }
                else{
                    child.setAttribute(TCF_CHANGED_ATTR,'true');
                    edit_chating(child);              
                }               
            }
        }
    }

    var edit_chating = function(chatLI)
    {
        var chatMessageSpan = [] ;
        var emoteSpan = [];

        if(chatMessage == 'message')
        {
            chatMessageSpan.push(chatLI.getElementsByClassName(chatMessage)[0]);
        }
        else if(chatMessage == 'chat-message-text')
        {
            var len = chatLI.children.length

            for(i = 0 ; i < len ; i ++)
            {
                if(chatLI.children[i].getAttribute('data-a-target') == chatMessage)
                {
                    chatMessageSpan.push(chatLI.children[i]);
                }
                else if(chatLI.children[i].getAttribute('data-a-target') == emoteName)
                {
                    emoteSpan.push(chatLI.children[i]);
                }
            }
            
        }
        else if(chatMessage == 'qa-mod-message')
        {
            var tmpSpan = chatLI.getElementsByClassName(chatMessage)[0].children;
            for(i = 0 ;i < tmpSpan.length; i ++){
                if(tmpSpan[i].getAttribute('data-a-target') != 'emote-name')
                {
                    chatMessageSpan.push(tmpSpan[i]);
                }
                else{
                    emoteSpan.push(chatLI.children[i]);
                }
            }
        }

        for(j = 0 ; j < observeFunction.length ; j ++)
        {
            for(i = 0 ; i < chatMessageSpan.length ; i ++)
            {
                observeFunction[j]('text',chatMessageSpan[i]);         
            }
        }

        for(j = 0 ; j < observeFunction.length ; j ++)
        {
            for(i = 0 ; i < emoteSpan.length ; i ++)
            {
                observeFunction[j]('emote',emoteSpan[i]);         
            }
        }

        
    }


    return {
        start : addChatDetectObserver,
        stop : function(){
            if(clearInterval != null)
                clearInterval(observeInterval);

            observeFunction = [];
            observeInterval = null;
            observer.disconnect();  
        },
        registerFunction : function(obf){
            observeFunction.push(obf);
        },
        reset : function()
        {
            observeFunction = [];
        }
    }
});
define('tcf',
    ['newChat','chatTracker','tcfConfig','picker','observer','chatUsingTmi'],
    function(
        newChat,chatTracker, tcfConfig,picker,observer,chatMethod
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
            addTextToChatInput : function(html){
                newChat.chat_input.innerHTML += html;
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
                    Promise.all([chatMethod.connectPromise,statusPromise,masterCheckPromise,getIdPromise]).then(function(values){
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
require.config = {
    baseUrl: './',
    paths : {
        config : 'config',
        twitchTheme : 'twitch_theme',
        picker : 'picker',
        //pickerManager : 'picker_manager',
        chatUsingTmi : 'chat_using_tmi',
        chatTarget : 'chat_target',
        newChat : 'new_chat',
        chatTracker : 'chat_tracker',       

        tcfConfig : 'tcf_config',
        observer : 'observer',
        tcf : 'tcf'
    }
};
define("main", function(){});

    return require('tcf');
}));