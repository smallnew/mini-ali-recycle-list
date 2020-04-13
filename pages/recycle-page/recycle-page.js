let j = 0
const systemInfo = my.getSystemInfoSync()

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
          width: systemInfo.windowWidth * 0.2,
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
    var item = { "title": "エロマンガ先生" }
    for (var i = 0; i < 500; i++) {
      var newItem = Object.assign({}, item)
      newData.push(newItem)
    }
    const newList = []
    j += 10000;//分页加载区分id，实际应用真实的id
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

    console.log('len', newList.length)
    const st = Date.now()

    ctx.splice(newList, () => {
      console.log('【render】showList use time', Date.now() - st)
    })
  },
  onPageScroll: function () { }, // 一定要留一个空的onPageScroll函数
  scrollToLower: function (e) {
    // 延迟1s，模拟网络请求
    if (this.isScrollToLower) return
    this.isScrollToLower = true
    setTimeout(() => {
      const newList = this.genData()
      this.ctx.append(newList, () => {
        this.isScrollToLower = false
      })
    }, 1000)
  },
  scrollTo1000: function (e) {
    console.log('scrollTo1000');
    this.recyleRef.scrollTo(1000);

  },
  scrollTo0: function () {
    console.log('scrollTo0');
    this.recyleRef.scrollTo(0);
  },
  scrollToid: function () {
    this.recyleRef.scrollToIndex(110);
  },
  getScrollTop: function () {
    console.log('getScrollTop', this.ctx.getScrollTop())
  },
  saveRecycleList(ref) {
    this.recyleRef = ref;
  }
});
