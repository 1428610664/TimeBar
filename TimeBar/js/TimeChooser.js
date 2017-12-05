(function (win, $) {
    /**
     * 时间段展示、选择控件
     * @desc 用于快速确定一个时间段，直观展示
     * @author Harsen Lin
     * @version 1.0.0
     * @example 示例代码
     * @requires jQuery,jQuery UI
     */
    $.widget("CW.TimeChooser", {
        /** 默认配置 */
        options: {
            /** 选中时间 */
            selectedDate: Inner.getDate()
            ,nowDate: Inner.getDate()
            ,change: function(selectedDate){ }
        }
        , _alertControl: null
        /**
         * 初始化创建方法
         * @private
         */
        ,_create: function () {
            this.element.addClass(this.widgetFullName);
            this._alertControl = new AlertControl(this);

            // 设置 小时控制器
            var $hourView = this.element.find(".hour");
            for (var hourIndex = 0; hourIndex < 24; hourIndex++) {
                if (0 == hourIndex) {
                    $hourView.append("<div class='split'><span>" + hourIndex + "</span></div>");
                }
                $hourView.append("<div class='status' title='" + hourIndex + "'><span class='img'></span></div><div class='split'><span>" + (hourIndex + 1) + "</span></div>");
            }
            // 设置 分钟控制器
            var $minuteView = this.element.find(".minute");
            for (var minIndex = 0; minIndex < 60; minIndex++) {
                if (0 == minIndex) {
                    $minuteView.append("<div class='split'><span>" + minIndex + "</span></div>");
                }
                $minuteView.append("<div class='status' title='" + minIndex + "'><span/></div><div class='split'><span>" + (minIndex + 1) + "</span></div>");
            }

            // 初始化时间展示
            this.selectedDate();

            // 设置控制事件
            var _this = this;
            $hourView.find(".status").bind("click", function(event){
                if($(this).prevAll(".now").length > 0){ return false; }
                _this.options.selectedDate.setHours(($(this).index()-1)/2);
                _this._updateHour();
                _this.options.change(_this.options.selectedDate); // 值改变，回调
            });
            $minuteView.find(".status").bind("click", function(event){
                if($(this).prevAll(".now").length > 0){ return false; }
                _this.options.selectedDate.setMinutes(($(this).index()-1)/2);
                _this._updateMinute();
                _this.options.change(_this.options.selectedDate); // 值改变，回调
            });
        }
        /**
         * 选中时间
         * @param dateObj 时间
         * @returns {Date} 时间
         */
        , selectedDate: function(dateObj){
            if(dateObj){
                this.options.selectedDate = dateObj;
            }else{
                dateObj = this.options.selectedDate;
            }

            this._updateHour();
            this._updateMinute();
            this.nowDate(); // 更新当前时间状态
//            this._alertControl.loadCounts(null);

            return dateObj;
        }
        /**
         * 设置当前时间
         * @param dateObj 当前时间（可选）
         */
        , nowDate: function(dateObj){
            if(dateObj){
                this.options.nowDate = dateObj;
            }else{
                dateObj = this.options.nowDate;
            }
            var $thisElem = this.element;

            // 未来的小时：置灰
            $thisElem.find(".hour .status").removeClass("now");
            var $chooseElem = $thisElem.find(".hour .status:eq("+dateObj.getHours()+")");
            if(this.options.selectedDate.format("yyyyMMdd") == dateObj.format("yyyyMMdd")){
                $chooseElem.addClass("now").siblings(".status");
            }
            // 未来的分钟：置灰
            $thisElem.find(".minute .status").removeClass("now");
            $chooseElem = $thisElem.find(".minute .status:eq("+dateObj.getMinutes()+")");
            if(this.options.selectedDate.format("yyyyMMddhh") == dateObj.format("yyyyMMddhh")){
                $chooseElem.addClass("now").siblings(".status");
            }
            // 刷新异常状态
            this._alertControl.refreshStatus();

            return dateObj;
        }
//        /**
//         * 获取开始时间
//         * @param dateObj 截止时间（可选）
//         * @returns {Date}
//         */
//        , timeSpanDate: function(dateObj){
//            if(dateObj){
//                this.options.selectedDate = dateObj;
//            }else{
//                dateObj = this.options.selectedDate;
//            }
//
//            return new Date(dateObj.getTime() - this.options.timeSpan);
//        }
        , _updateHour: function(){
            var hour = this.options.selectedDate.getHours();
            var $oldChooseElem = this.element.find(".hour>.status.selected");
            var $chooseElem = this.element.find(".hour .status:eq("+hour+")");
            if($chooseElem.index() != $oldChooseElem.index()){
                $oldChooseElem.removeClass("selected");
                $chooseElem.addClass("selected");

                $oldChooseElem.find(".img").css({ width: "", height: "", margin: "" });
                var $statusIcon = $chooseElem.find(".img");
                var size = Math.min($statusIcon.width(), $statusIcon.height()) * 0.8;
                $statusIcon.css({ width: size, height: size, margin: (($statusIcon.height()-size - 2)/2)+"px "+(($statusIcon.width()-size - 2)/2)+"px" });
            }
        }
        , _updateMinute: function(){
            var minute = this.options.selectedDate.getMinutes();
            var $oldChooseElem = this.element.find(".minute>.status.selected");
            var $chooseElem = this.element.find(".minute .status:eq("+minute+")");
            if($chooseElem.index() != $oldChooseElem.index()){
                $oldChooseElem.removeClass("selected");
                $chooseElem.addClass("selected");
            }
        }
        /**
         * 销毁组件
         */
        ,destroy: function () {
            this.element.removeClass(this.widgetFullName);
            $.Widget.prototype.destroy.call(this);
        }
    });

    /**
     * 异常处理类
     * @param timeChooser {TimeChooser} 时间选择器
     * @constructor
     */
    var AlertControl = function(timeChooser){
        // 最后更新时间
        this.lastRefreshTimes = null;
        // 异常统计列表
        this.dataCountsList = [];
        // 时间选择器
        this.timeChooser = timeChooser;
    };

    /**
     * 获取更新粒度
     * @param time 选择时间
     * @returns {"Day", "Minute", ""} 粒度
     * @private
     */
    AlertControl.prototype._parseParticle = function(time){
        var size = 0;       // 匹配位数
        var timeSpan = 0;   // 时差（毫秒）
        if(this.lastRefreshTimes){
            timeSpan = time.getTime() - this.lastRefreshTimes.getTime();
            var lastStr = this.lastRefreshTimes.format("yyyyMMddhhmmss");
            var timeStr = time.format("yyyyMMddhhmmss");
            for(var i = 0; i < lastStr.length; i ++){
                if(lastStr.charAt(i) == timeStr.charAt(i)){
                    size++;
                }else{
                    break;
                }
            }
        }

        if(size >= 12){
            // 刷新间隔不能低于10秒
            if(timeSpan >= 1000*10){
                return "Minute";
            }else{
                return "";
            }
        }          // 秒
        else if (size >= 10){ return "Minute"; }    // 分
        else if (size >= 8){ return "Day"; }        // 时
        else if (size >= 6){ return "Day"; }        // 天
        else if (size >= 4){ return "Day"; }        // 月
        else { return "Day" }                       // 年
    };
    /**
     * 加载统计数据
     * @param particle 粒度（为空时自动根据当前选中时间计算）
     */
    AlertControl.prototype.loadCounts = function(particle){
        var _this = this;
        var time = new Date(this.timeChooser.options.selectedDate.getTime());
        var bTime, eTime;
        particle = particle || this._parseParticle(time);
        switch(particle){
            case "Minute": {
                time.setMilliseconds(0);
                time.setSeconds(0);
                bTime = time.getTime() - 1000*60*4; // 更新最近5分钟的数据
                time.setMilliseconds(999);
                time.setSeconds(59);
                eTime = time.getTime();
            }break;
            case "Day": {
                time.setMilliseconds(0);
                time.setSeconds(0);
                time.setMinutes(0);
                time.setHours(0);
                bTime = time.getTime();
                time.setMilliseconds(999);
                time.setSeconds(59);
                time.setMinutes(59);
                time.setHours(23);
                eTime = time.getTime();
            }break;
            default : return; // 为空时不刷新
        }
        _this.lastRefreshTimes = new Date(_this.timeChooser.options.selectedDate.getTime());
        $.ajax({url: base + "/bs/alert/countByMinute.do"
            , type: 'post'
            , data: { bizName: bizName, bTime: bTime, eTime: eTime }
            , dataType: 'json'
            , success: function (result) {
                AjaxStatus(result, { fail: null, success: function(data){
                    // 更新异常数据
                    _this.refreshCounts(data, bTime, eTime, particle);
                    Inner.refreshAlert && Inner.refreshAlert(bTime, eTime, particle, _this);
                } });
            }
        });
    };
    /**
     * 刷新异常统计
     * @param data {Object} 数据
     * @param bTime {Number} 开始时间
     * @param eTime {Number} 结束时间
     * @param particle {"Day"|"Hour"|"Minute"} 数度
     */
    AlertControl.prototype.refreshCounts = function(data, bTime, eTime, particle){
        var oldList = this.dataCountsList;
        var newList = this.dataCountsList = [];
        if("Day" != particle){
            $(oldList).each(function(i, alertObj){
                if(bTime > alertObj.time.getTime() || eTime < alertObj.time.getTime()){
                    newList.push(alertObj);
                }
            });
        }
        for(var i = 0; i < data.length; i ++){
            newList.push({ counts: data[i].counts, time: new Date(data[i].time.time) });
        }
        // 刷新异常状态
        this.refreshStatus();
    };
    /**
     * 刷新状态
     */
    AlertControl.prototype.refreshStatus = function(){
        var _timeChooser = this.timeChooser;
        var $thisElem = _timeChooser.element;
        var selectedDate = _timeChooser.options.selectedDate;
        $thisElem.find(".hour .status").removeClass("alarm-red");
        $thisElem.find(".minute .status").removeClass("alarm-red");
        $(this.dataCountsList).each(function(i, alertObj){
            var alertTime = alertObj.time;
            if(selectedDate.format("yyyyMMdd") == alertTime.format("yyyyMMdd")){
                $thisElem.find(".hour .status:eq("+alertTime.getHours()+")").addClass("alarm-red");
            }
            if(selectedDate.format("yyyyMMddhh") == alertTime.format("yyyyMMddhh")){
                $thisElem.find(".minute .status:eq("+alertTime.getMinutes()+")").addClass("alarm-red");
            }
        });
    }
})(window, jQuery);