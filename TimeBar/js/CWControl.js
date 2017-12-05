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
            "M+": this.getMonth() + 1,						//month
            "d+": this.getDate(),							//day
            "h+": this.getHours(),							//hour
            "m+": this.getMinutes(),						//minute
            "s+": this.getSeconds(),						//second
            "q+": Math.floor((this.getMonth() + 3) / 3),	//quarter
            "S": this.getMilliseconds()					//millisecond
        };
        if (/(y+)/.test(format))
            format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(format))
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
        return format;
    };
})(jQuery, window);