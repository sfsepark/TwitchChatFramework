define('tcfConfig',function(){
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
