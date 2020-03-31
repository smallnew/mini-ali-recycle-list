const testData = {
  "response": {
    "data": [
      {
        "goods": [
          {
            "id": 0,
            "title": "test测试数据",
            "picture": '',
            "status": 1,
            "description": 'asndasdjaksdhttps://img.yzcdn.cn/u',
            "skus": [{
              "price": 100,
              "promotion_info": 'dsadada',
            }],
            "unit": "zhuo",
            "attrs": [],
            "image_url": "https://img.yzcdn.cn/upload_files/2018/01/13/FioO3zv7ENB_7uqptCyHuFf6dRdU.png",
          }
        ]
      }
    ]
  }
};
let j = 0
let data = testData.response.data
const systemInfo = my.getSystemInfoSync()

// 提交wx.createRecycleContext能力
const createRecycleContext = require('../../components/recycle-list/index')
Page({
  data: {},
  onLoad() {
    var ctx = createRecycleContext({
      id: 'recycleId',
      dataKey: 'recycleList',
      page: this,
      itemSize: function (item, index) {
        return {
          width: systemInfo.windowWidth,
          height: 160
        }
      }
    })
    this.ctx = ctx;
  },
  onReady: function () {
    this.showView()
    const compSel = my.createSelectorQuery().select('#content').boundingClientRect().exec((ret) => {
      console.log('compSel ret', ret);
    });
    console.log('compSel', compSel);
  },
  genData: function () {
    let newData = []
    data.forEach((item, i) => {
      // 构造270份数据
      var item = item.goods[0]
      for (var i = 0; i < 500; i++) {
        var newItem = Object.assign({}, item)
        newData.push(newItem)
      }

    })
    const newList = []
    j += 10000;
    newData.forEach((item, i) => {
      item.idx = i + j
      item.id = i + j
      newList.push(item)
    })
    return newList
  },
  showView: function () {
    const ctx = this.ctx
    const newList = this.genData()
    // console.log('recycle data is', newList)
    // API的调用方式
    console.log('len', newList.length)
    const st = Date.now()
    // ctx.splice(0, 0, newList, function() {
    //   // 新增加的数据渲染完毕之后, 触发的回调
    //   console.log('【render】use time', Date.now() - st)
    // })
    ctx.splice(newList, () => {
      // 新增加的数据渲染完毕之后, 触发的回调
      console.log('【render】deleteList use time', Date.now() - st)
      // this.setData({
      //   scrollTop: 1000
      // })
    })
  },
  onPageScroll: function () { }, // 一定要留一个空的onPageScroll函数
  scrollToLower: function (e) {
    // 延迟1s，模拟网络请求
    if (this.isScrollToLower || true) return
    this.isScrollToLower = true
    setTimeout(() => {
      const newList = this.genData()
      this.ctx.append(newList, () => {
        this.isScrollToLower = false
      })
    }, 1000)
  },
  scrollTo2000: function (e) {
    this.setData({
      scrollTop: 5000
    })
  },
  scrollTo0: function () {
    this.setData({
      scrollTop: 0
    })
  },
  newEmptyPage: function () {
    wx.navigateTo({
      url: './empty/empty'
    })
  },
  scrollToid: function () {
    this.setData({
      index: 100
    })
  },
  getScrollTop: function () {
    console.log('getScrollTop', this.ctx.getScrollTop())
  },
  saveRecycleList(ref) {
    this.recyleRef = ref;
  }
});
