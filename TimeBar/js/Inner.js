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