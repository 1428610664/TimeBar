/**
 * 控件－自动刷新
 * @author HarsenLin
 * @copyright CoreWare 2015-03-27
 * @since jQuery1.7
 */
(function ($, win, cw) {

    var autoTimeout;			// 自动刷新定时器对象
    var callFnMap = {};			// 回调函数集合(存放所有需要回调的函数)

    var _this = cw.AutoRefresh = {
        logLevel: "error",		// 日志级别[error, warm, info, debug]
        interval: 1000			// 自动刷新心跳率，此值会影响callFn的设置，有可能调用不到
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
            id: cw.GUID()				// 唯一识别编号
            ,counts: 0					// 执行次数
            ,nowTimes: 0				// 当前时间
            ,lastTimes: 0				// 最后刷新时间
            ,interval: 60				// 回调间隔，为‘心跳率’的倍数（如：心跳1000+间隔60=一分钟执行1次）
            ,regex: defRegex			// 回调规则，间隔中的第N个心跳触发（如：心跳1000+间隔60+规则20=每分钟第20秒执行）
            ,initFn: null              // 初始化函数
            ,fn: null					// 回调函数
            ,status: true				// 回调状态
            ,unStatusFn: null			// 状态为false时回调此函数
            ,params: null				// 自定义参数
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
//	CWControl.AutoRefresh.start();
//	CWControl.AutoRefresh.addCallFn({
//		fn: function(params){
//			console.log(params.mesg);
//			return true;
//		},
//		mesg: "根据默认配置执行"
//	});
//	CWControl.AutoRefresh.addCallFn({
//		interval: 20,
//		regex: 2,
//		fn: function(params){
//			console.log(params.mesg);
//			return true;
//		},
//		mesg: "每20秒第2个心跳执行"
//	});

})(jQuery, window, CWControl);