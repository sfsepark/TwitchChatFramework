define('observer',function(){

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
		//twitch(new) 
               	target_lists = document.getElementsByClassName('chat-scrollable-area__message-container');
			chatMessage = 'chat-message-text';

		if(target_lists.length == 0)
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

            var isTerminate = false;


            for(var i = len - 1 ; i >= 0 ; i --)
            {
                for(var c in child[i].classList)
                {
                    if(child[i].classList[c] == "chat-line__message")
                    {
                        if(child[i].getAttribute(TCF_CHANGED_ATTR) == 'true')
                        {
                            isTerminate = true;
                        }
                        else{
                            child[i].setAttribute(TCF_CHANGED_ATTR,'true');
                            edit_chating(child[i]);   
                        }                
                        break;
                    }
                }  

                if(isTerminate) break;
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
                else if(
                    chatLI.children[i].firstChild != null &&
                    chatLI.children[i].firstChild.nodeName == 'SPAN' &&
                    chatLI.children[i].firstChild.getAttribute('data-a-target') == emoteName)
                {
                    emoteSpan.push(chatLI.children[i].firstChild);
                }
            }
            
        }
        else if(chatMessage == 'qa-mod-message')
        {
            var tmpSpan = chatLI.getElementsByClassName(chatMessage)[0].children;
            for(i = 0 ;i < tmpSpan.length; i ++){
                if(tmpSpan[i].getAttribute('data-a-target') == 'emote-name')
                {
                    emoteSpan.push(chatLI.children[i]);
                }
                else{
                    if(tmpSpan[i].firstChild.getAttribute('data-a-target') == 'emote-name')
                    {
                        emoteSpan.push(tmpSpan[i].firstChild);
                    }
                    else{
                        chatMessageSpan.push(tmpSpan[i]);
                    }
                    
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