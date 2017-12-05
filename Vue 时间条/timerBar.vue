<style scoped>

  .timerbar{display:table;width: 100%;height: 60px;text-align: left;line-height: normal;}
  div{-webkit-box-sizing: border-box;-moz-box-sizing: border-box; box-sizing: border-box;}

  .timerbar{display:table;position:relative;z-index:1002;width:100%;height:60px;line-height:60px;background: rgba(0,173,255, .1)}
  .timerbar{ line-height: normal!important; }
  .timerbar .htime { display:table-cell;}
  .timerbar>div{ vertical-align: middle; display: table-cell; }
  .inner-head-tip{color:rgba(255,255,255,0.9);width:70px;font-size:14px;line-height:20px;text-align:center;position:relative;}
  .inner-head-btn{width:50px;text-align:center;}
  .split{font-size: 12px}
  .inner-head-tip{color: #000}

</style>

<template>
  <div class="timerbar">
    <div id="timePanel" class="htime CW-TimeChooser" style="">
      <div class="hour" style="font-size: 0;">
        <template v-for="(item, index) in 24">
          <div class="split" v-if="index == 0"><span>0</span></div>
          <div class="status" @click="clickHour(index)" :class="{now: index == hour1 && isSameDay, selected: index == hour}" :title="index"><span class="img"></span></div>
          <div class="split"><span>{{item}}</span></div>
        </template>
      </div>
      <div class="minute" style="font-size: 0;">
        <template v-for="(item, index) in 60">
          <div class="split" v-if="index == 0"><span>0</span></div>
          <div class="status" @click="clickMinute(index)" :class="{now: index == minute1 && isSameHour, selected: index == minute}" :title="index"><span class="img"></span></div>
          <div class="split"><span>{{item}}</span></div>
        </template>
      </div>
    </div>
    <div id="timeTip" class="inner-head-tip" style="">
      <input id="timeTipInput" type="hidden">
      <span id="time" style="color: #ccc">{{date.format("MM-dd")}}<br>{{date.format("hh:mm:ss")}}</span>
      <DatePicker  v-model="selecteDate" :options="datePickerOpts" type="date" style="width: 50px;position: absolute;top: 50%;left: 50%;margin: -15px 0 0 -25px;"></DatePicker>
    </div>
    <div id="refreshBtn" rel="refreshBtn" class="inner-head-btn" :class="clz" style="">
      <span class="btn-stop" title="暂停" @click="stop"><Icon type="pause" style="color: #ccc;font-size: 20px;"></Icon></span>
      <span class="btn-start" title="开始" @click="start"><Icon type="play" style="color: #ccc;font-size: 20px;"></Icon></span>
    </div>
  </div>
</template>

<script>
  import '../css/TimeChooser.css'

  export default {
    data() {
      return {
        clz: "start",
        date: new Date(),
        timer: null,
        hour: new Date().getHours(),
        minute: new Date().getMinutes(),
        selecteDate: null,
        datePickerOpts: {
          disabledDate(date) {
            return date && date.valueOf() > Date.now()
          }
        }
      }
    },
    computed: {
      hour1() {
        let h = new Date().getHours()
        let h1 = this.date.getHours()
        return h != h1 ? h : h1
      },
      minute1() {
        let m = new Date().getMinutes()
        let m1 = this.date.getMinutes()
        return m != m1 ? m : m1
      },
      isSameDay() {
        return this.date.getDate() === new Date().getDate()
      },
      isSameHour() {
        return this.isSameDay && this.hour === new Date().getHours()
      }
    },
    created() {
      this.run()
    },
    methods: {
      stop() {
        this.clz = "stop"
        clearInterval(this.timer)
        this.$emit("on-stop")
      },
      start() {
        this.clz = "start"
        this.run()
        this._change()
        this.$emit("on-start")
      },
      run(date) {
        this.date = new Date()
        this.hour = new Date().getHours()
        this.minute = new Date().getMinutes()
        this.timer = setInterval(() => {
          this.date = new Date()
          this.hour = new Date().getHours()
          this.minute = new Date().getMinutes()
        }, 1000)
      },
      clickHour(index) {
        if (this.isSameDay && index > this.hour1) {
          return
        }
        if (index === new Date().getHours() && this.minute > new Date().getMinutes()) {
          this.minute = new Date().getMinutes()
        }
        this.stop()
        this.hour = index

        this._change()
      },
      clickMinute(index) {
        if (this.isSameDay && this.isSameHour && index > this.minute1) {
          return
        }
        this.stop()
        this.minute = index

        this._change()
      },
      _change() {
        let d = this.date
        let y = d.getFullYear(), M = d.getMonth(), D = d.getDate()
        let date = new Date(y, M, D, this.hour, this.minute)
        this.date = date
        this.$emit("on-change", date)
      }
    },
    watch: {
      selecteDate(n, o) {
        if (!n) return
        this.stop()
        let d = new Date(n)
        let y = d.getFullYear(), M = d.getMonth(), D = d.getDate()
        let date = new Date(y, M, D, this.hour, this.minute)
        if (date.getDate() === new Date().getDate()) {
          this.hour = new Date().getHours()
          this.minute = new Date().getMinutes()
          this.date = new Date(y, M, D, new Date().getHours(), new Date().getMinutes())
        } else {
          this.date = date
        }
        this._change()
      }
    }
  }
</script>
