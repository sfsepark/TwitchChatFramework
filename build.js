({
    baseUrl: './lib',
    name: '../almond',
    include: ['config',
        'twitch_theme',
        'picker',
        //'picker_manager',
        'chat_target',
        'chat_using_tmi',
        'new_chat',
        'chat_tracker','tcf_config',
        'observer',
        'tcf', 
        'main'      
    ],
    out: './dist/TwitchChatFramework/content_scripts/twitchChatframe.js',
    wrap: {
        startFile: './wrap.start',
        endFile: './wrap.end'
    }
    //,optimize: "none"
})