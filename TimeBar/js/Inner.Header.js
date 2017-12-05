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
    _this.init = function(){
        var nowDate = Inner.getDate();
        // 时间选择器
        _this.timeChooser = $("#timePanel").TimeChooser({
            selectedDate: nowDate
            , change: function(selectedDate){


                // 选择时间出发
                console.log(selectedDate.format("MM-ddhh:mm:ss"))
                _this.changeDate(selectedDate);
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

    $(function(){
        _this.init();
    });

})(jQuery, Inner, CWControl.AutoRefresh);