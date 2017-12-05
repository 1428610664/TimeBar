(function ($) {
    var _this = window.Inner = {
        bizName: ""             // 业务名
        ,timeGap: null          // 比服务器时间少的毫秒数
        ,timeSpan: 15*60*1000   // 数据默认查询时段
        ,alertTimeSpan: 1*60*1000   // 数据默认查询时段
        ,changeTime: null      // 选中时间，如果是运行状态则此值为空
    };
    /**
     * 获取服务器时间
     * @param val 值（可选）
     * @returns {Date} 服务器时间
     */
    _this.getDate = function (val) {
        // 未同步时间，发起同步
        /*if (!$.isNumeric(_this.timeGap)) {
            $.ajax({
                url: base + "/opa/time.do",
                type: 'POST',
                async: false,
                data: {r: Math.random()},
                dataType: "text",
                success: function (time) { _this.timeGap = new Date(time).getTime() - new Date().getTime(); }
            });
        }*/
        // 当前本地时间
        var nowTime = val ? new Date(val) : new Date();
        return new Date(nowTime.getTime() + _this.timeGap);
    };

})(jQuery);

/**
 * 科微-控件基础包
 * @author HarsenLin
 * @since jQuery1.7
 */
(function ($, win) {
    var _this = win.CWControl = {};

    /**
     * 生成随机编号
     * @returns {String} "b1efec16-a667-eb35-bc8d-d34b80191adf"
     */
    _this.GUID = function () {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    };

    /**
     * 将函数名转为函数
     * @param fn 函数或函数名
     * @returns
     */
    _this.parseFn = function (fn) {
        if (typeof fn == 'string') {
            return eval(fn);
        } else if (typeof fn == 'function') {
            return fn;
        } else {
            return false;
        }
    };

    // 日期格式化
    Date.prototype.format = function (format) {
        var o = {
            "M+": this.getMonth() + 1,                      //month
            "d+": this.getDate(),                           //day
            "h+": this.getHours(),                          //hour
            "m+": this.getMinutes(),                        //minute
            "s+": this.getSeconds(),                        //second
            "q+": Math.floor((this.getMonth() + 3) / 3),    //quarter
            "S": this.getMilliseconds()                 //millisecond
        };
        if (/(y+)/.test(format))
            format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(format))
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
        return format;
    };
})(jQuery, window);

/**
 * 控件－自动刷新
 * @author HarsenLin
 * @copyright CoreWare 2015-03-27
 * @since jQuery1.7
 */
(function ($, win, cw) {

    var autoTimeout;            // 自动刷新定时器对象
    var callFnMap = {};         // 回调函数集合(存放所有需要回调的函数)

    var _this = cw.AutoRefresh = {
        logLevel: "error",      // 日志级别[error, warm, info, debug]
        interval: 1000          // 自动刷新心跳率，此值会影响callFn的设置，有可能调用不到
    };

    var _runCount = 0;

    /**
     * CallFnItem 日志器
     * @param cfm CallFnItem值
     * @param mesg 提示信息
     */
    var CFILogger = {
        debug: function (cfm, mesg) {
            if (_this.logLevel.match(/debug/)) {
                console.log(mesg);
            }
        }, info: function (cfm, mesg) {
            if (_this.logLevel.match(/debug|info/)) {
                console.log(mesg);
            }
        }, warm: function (cfm, mesg) {
            if (_this.logLevel.match(/debug|info|warm/)) {
                console.log(mesg);
            }
        }, error: function (cfm, mesg) {
            if (_this.logLevel.match(/error|info|warm|error/)) {
                console.log(mesg);
            }
        }
    };

    /**
     * 执行回调
     * @param funName 回调函数
     * @param times 时间
     * @param callItem 回调项
     * @param isCheck 是否验证规则
     */
    var runFn = function(funName, times, callItem, isCheck){
        //console.log('%c running:'+ new Date(times).format("hh:mm:ss"),'color: green; font-weight: bold;');
        // 回调状态
        if (!callItem.status) {
            // 获取回调函数
            var unStatusFn = cw.parseFn(callItem.unStatusFn);
            if (!unStatusFn) {
                CFILogger.warm(callItem, "没有unStatusFn回调方法！");
                return;
            }
            callItem.status = unStatusFn(callItem);
            return;
        }

        // 获取回调函数
        var fn = cw.parseFn(callItem[funName]);
        if (!fn) { CFILogger.warm(callItem, "没有回调方法！"); return; }

        // 判断调用规则
        if (isCheck && !matchRegex(times, callItem.interval, callItem.regex)) {
            /*CFILogger.warm(callFnMap[id], "规则匹配不成功！");*/
            return;
        }
        //console.log('%c isRun:  '+ new Date(times).format("hh:mm:ss"),'color: #5AA3E8; font-weight: bold;');
        callItem.counts++;          // 记录调用次数
        callItem.nowTimes = times;  // 修改当前时间
        // 回调函数
        if(fn(callItem)){
            callItem.status = true;
            callItem.lastTimes = times;
        }
    };

    /**
     * 配置调用间隔设置
     * @param times 时间
     * @param interval 回调间隔
     * @param regex 匹配规则
     */
    var matchRegex = function (times, interval, regex) {
        var nowTime = parseInt(times / _this.interval);
        return (nowTime % interval == regex);
    };

    /**
     * 添加回调方法
     * @param params 自定义参数（至少包含fn回调函数）
     * @returns {id,fn,status,counts,params}
     */
    _this.addCallFn = function (params) {
        var defRegex = (20 > params.interval) ? 0 : 20; // 设置默认规则
        var callFnItem = $.extend({
            id: cw.GUID()               // 唯一识别编号
            ,counts: 0                  // 执行次数
            ,nowTimes: 0                // 当前时间
            ,lastTimes: 0               // 最后刷新时间
            ,interval: 60               // 回调间隔，为‘心跳率’的倍数（如：心跳1000+间隔60=一分钟执行1次）
            ,regex: defRegex            // 回调规则，间隔中的第N个心跳触发（如：心跳1000+间隔60+规则20=每分钟第20秒执行）
            ,initFn: null              // 初始化函数
            ,fn: null                   // 回调函数
            ,status: true               // 回调状态
            ,unStatusFn: null           // 状态为false时回调此函数
            ,params: null               // 自定义参数
            ,start: function(){ this.status = false; } // 开始运行
            ,stop: function(){ this.status = true; } // 停止运行
            ,destroy: function(){ delete callFnMap[this.id]; } // 销毁
        }, params);
        callFnMap[callFnItem.id] = callFnItem;
        return callFnItem;
    };

    /**
     * 根据ID移除回调方法
     * @param id
     */
    _this.removeCallFn = function (id) {
        delete callFnMap[id];
    };

    /**
     * 停止执行
     */
    _this.stop = function () {
        window.clearTimeout(autoTimeout);
    };

    /**
     * 开始执行
     */
    _this.start = function (state) {
        _this.stop();
        var nowTimes = new Date();
        if(state !== 'refresh'){
            _runCount = 0;
            _this.startTime = nowTimes.getTime();
        }
        var offset = nowTimes.getTime() - (_this.startTime + _runCount * _this.interval),
            next = Math.max(1000 - offset,0);
        // 遍历所有回调函数
        for (var id in callFnMap) {
            runFn("fn", nowTimes.getTime(), callFnMap[id], true);
        }
        //console.log(offset,_runCount,new Date(_this.startTime).format('hh:mm:ss:S')+'-'+nowTimes.format('hh:mm:ss:S'));
        _runCount++;
        // 设置回调间隔逻辑
        autoTimeout = window.setTimeout(function () {
            _this.start('refresh');
        }, next);

    };

    /**
     * 初始化
     */
    _this.init = function () {
        CFILogger.debug(null, "重新初始化所有回调");
        // 遍历所有回调函数
        for (var id in callFnMap) {
            runFn("initFn", new Date().getTime(), callFnMap[id], false);
        }
    };

    // 应用实例
//  CWControl.AutoRefresh.start();
//  CWControl.AutoRefresh.addCallFn({
//      fn: function(params){
//          console.log(params.mesg);
//          return true;
//      },
//      mesg: "根据默认配置执行"
//  });
//  CWControl.AutoRefresh.addCallFn({
//      interval: 20,
//      regex: 2,
//      fn: function(params){
//          console.log(params.mesg);
//          return true;
//      },
//      mesg: "每20秒第2个心跳执行"
//  });

})(jQuery, window, CWControl);


/**
 * 头部脚本
 */
(function ($, Inner, AutoRefresh) {
    var _this = Inner.Header = {
        timeChooser: null
        ,autoRefreshTime: null
    };
    /**
     * 改变日期
     * @param selectedDate 日期
     */
    _this.changeDate = function(selectedDate){
        selectedDate = (selectedDate instanceof Date) ? selectedDate : new Date(Date.parse(selectedDate.replace(/-/g, "/")));
        Inner.changeTime = selectedDate;
        _this.timeChooser.selectedDate(selectedDate);
        $("#timeTip").find(">span").html(selectedDate.format("MM-dd<br/>hh:mm:ss"));
        $("#timeTipInput").attr("value", selectedDate.format("yyyy/MM/dd hh:mm:ss"));

        _this.stop();
        AutoRefresh.init();
        $("#timePanel").trigger('time.change',selectedDate);
    };

    /** 开始自动刷新 */
    _this.start = function(){
        $("#refreshBtn").removeClass("stop").addClass("start");
        // 选中的分钟不一样时需要初始化
        if(null == Inner.changeTime
            || Inner.changeTime.format("yyyy-MM-dd hh:mm") != Inner.getDate().format("yyyy-MM-dd hh:mm")){
            Inner.changeTime = null;
            AutoRefresh.init();
        }else{
            Inner.changeTime = null;
        }

        AutoRefresh.start();
        $("#timePanel").trigger('time.start.refresh');
    };

    /** 停止自动刷新 */
    _this.stop = function(){
        Inner.changeTime = Inner.changeTime || Inner.getDate();
        $("#refreshBtn").removeClass("start").addClass("stop");
        AutoRefresh.stop();
        $("#timePanel").trigger('time.stop.refresh');
    };

    /** 初始化头部脚本 */
    _this.init = function(changeCB){
        var nowDate = Inner.getDate();
        // 时间选择器
        _this.timeChooser = $("#timePanel").TimeChooser({
            selectedDate: nowDate
            , change: function(selectedDate){
                _this.changeDate(selectedDate);
                if(changeCB)changeCB(selectedDate)
            }
        }).data("CWTimeChooser");
        // 刷新当前时间
        window.setInterval(function(){
            _this.timeChooser.nowDate(Inner.getDate());
        }, 1000);
        // 自动刷新对象
        _this.autoRefreshTime = AutoRefresh.addCallFn({
            interval: 1,
            regex: 0,
            fn: function () {
                var tempNowDate = Inner.getDate();
                _this.timeChooser.selectedDate(tempNowDate);
                $("#timeTip").find(">span").html(tempNowDate.format("MM-dd<br/>hh:mm:ss"));
                return true;
            }
        });

        $("#timeTip").find(">span").html(nowDate.format("MM-dd<br/>hh:mm:ss"))
            .bind("click", [this], function(){
                WdatePicker({
                    skin:'twoer'
                    ,el: 'timeTipInput'
                    ,isShowClear: false
                    ,dateFmt:"yyyy/MM/dd HH:mm:ss"
                    ,maxDate:'%y-%M-%d %H:%m:%s'
                    ,position:{left:-45,top:0}
                    ,onpicked: function(){ _this.changeDate($dp.cal.getDateStr()); }
                });
            });
        AutoRefresh.start();
    };

    // $(function(){
    //     _this.init();
    // });

})(jQuery, Inner, CWControl.AutoRefresh);