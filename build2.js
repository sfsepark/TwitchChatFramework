({
    baseUrl: './lib',
    name: '../almond',
    include: ['config',
        'twitch_theme',
        'picker',
        'chat_target',
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