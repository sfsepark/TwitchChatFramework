define('config',function(){
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