/* eslint complexity: ["error", {"max": 50}] */
const recycleData = require('./recycle-data.js')

module.exports = function (e, cb) {
  const detail = e.detail
  // console.log('data change transfer use time', Date.now() - e.detail.timeStamp)
  let newList = []
  const item = recycleData[detail.id]
  // 边界值判断, 避免造成异常, 假设先调用了createRecycleContext, 然后再延迟2s调用append插入数据的情况
  if (!item || !item.list) return
  const dataList = item.list
  const pos = detail.data
  const beginIndex = pos.beginIndex
  const endIndex = pos.endIndex
  item.pos = pos
  // 加ignoreBeginIndex和ignoreEndIndex
  if (typeof beginIndex === 'undefined' || beginIndex === -1 || typeof endIndex === 'undefined' || endIndex === -1) {
    newList = []
  } else {
    let i = -1
    for (i = beginIndex; i < dataList.length && i <= endIndex; i++) {
      if (i >= pos.ignoreBeginIndex && i <= pos.ignoreEndIndex) continue
      newList.push(dataList[i])
    }
  }
  const obj = {
    // batchSetRecycleData: !this.data.batchSetRecycleData
  }
  obj[item.key] = newList
  const comp = this.recyleRef//selectComponent('#' + detail.id)
  //debugger
  obj[comp.data.batchKey] = !this.data.batchSetRecycleData
  comp._setInnerBeforeAndAfterHeight({
    beforeHeight: pos.minTop,
    afterHeight: pos.afterHeight
  })
  this.setData(obj, () => {
    if (typeof cb === 'function') {
      cb()
    }
  })
}
