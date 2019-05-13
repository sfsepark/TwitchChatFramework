({
    baseUrl: './lib',
    name: '../almond',
    include: ['config',
        'twitch_theme',
        'picker',
        //'picker_manager',
        'chat_using_tmi',
        'chat_target',
        'new_chat',
        'chat_tracker','tcf_config',
        'observer',
        'tcf', 
        'main'      
    ],
    out: './twitchChatframe.js',
    wrap: {
        startFile: './wrap.start',
        endFile: './wrap.end'
    }
    //,optimize: "none"
})