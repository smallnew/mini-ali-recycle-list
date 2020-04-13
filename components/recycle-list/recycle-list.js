/* eslint complexity: ["error", {"max": 50}] */
/* eslint-disable indent */
const DEFAULT_SHOW_SCREENS = 4
const RECT_SIZE = 200
const systemInfo = my.getSystemInfoSync()
const DEBUG = true
const transformRpx = require('./utils/transformRpx.js').transformRpx
const throttle = require('./utils/lodash.throttle')

Component({
  /**
   * 组件的属性列表
   */
  props: {
    debug: false,
    scrollY: true,
    batch: false,// '_recycleInnerBatchDataChanged'
    batchKey: 'batchSetRecycleData',
    // 距顶部/左边多远时，触发bindscrolltoupper
    upperThreshold: 50,
    // 距底部/右边多远时，触发bindscrolltolower
    lowerThreshold: 50,
    scrollToIndex: 0,// '_scrollToIndexChanged',
    enableBackToTop: false,
    // 是否节流，默认是
    throttle: true,
    placeholderImage: '',
    screen: DEFAULT_SHOW_SCREENS
  },

  /**
   * 组件的初始数据
   */
  data: {
    width: systemInfo.windowWidth,// '_widthChanged'
    //innerBeforeHeight: 0,
    innerAfterHeight: 0,
    innerScrollTop: 0,
    innerScrollIntoView: '',
    placeholderImageStr: '',
    totalHeight: 0,
    useInPage: false
  },
  onInit() {
    if (this.props.placeholderImage) {
      this.setData({
        placeholderImageStr: transformRpx(this.data.placeholderImage, true)
      })
    }
    this.setItemSize({
      array: [],
      map: {},
      totalHeight: 0
    })
  },
  didMount() {
    this._initPosition(() => {
      this._isReady = true // DOM结构ready了
      // 有一个更新的timer在了
      if (this._updateTimerId) return

      this._scrollViewDidScroll({
        detail: {
          scrollLeft: this._pos.left,
          scrollTop: this._pos.top,
          ignoreScroll: true
        }
      }, true)
    })
  },
  didUnmount() {
    this.page = null
    // 销毁对应的RecycleContext
    if (this.context) {
      this.context.destroy()
      this.context = null
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    _log(...args) {
      if (!DEBUG && !this.data.debug) return
      const h = new Date()
      const str = `${h.getHours()}:${h.getMinutes()}:${h.getSeconds()}.${h.getMilliseconds()}`
      Array.prototype.splice.call(args, 0, 0, str)
      // eslint-disable-next-line no-console
      console.log(...args)
    },
    _scrollToUpper(e) {
      this.props.onScrollToUpper && this.props.onScrollToUpper();
    },
    _scrollToLower(e) {
      this.props.onScrollToLower && this.props.onScrollToLower();
    },
    _beginToScroll() {
      if (!this._lastScrollTop) {
        this._lastScrollTop = this._pos && (this._pos.top || 0)
      }
    },
    _clearList(cb) {
      this.currentScrollTop = 0
      this._lastScrollTop = 0
      const pos = this._pos
      pos.beginIndex = this._pos.endIndex = -1
      pos.afterHeight = pos.minTop = pos.maxTop = 0
      this.page._recycleViewportChange({
        detail: {
          data: pos,
          id: this.props.id
        }
      }, cb)
    },
    // 判断RecycleContext是否Ready
    _isValid() {
      return this.page && this.context && this.context.isDataReady
    },
    _scrollViewDidScrollThrottle(e, force) {
      if (!this.onScrollFuncTh) {
        this.onScrollFuncTh = throttle(this._scrollViewDidScroll, 800, { leading: false, trailing: true });
      }
      this.onScrollFuncTh(e, force);
    },
    // eslint-disable-next-line no-complexity
    _scrollViewDidScroll(e, force) {
      // 如果RecycleContext还没有初始化, 不做任何事情
      if (!this._isValid()) {
        return
      }
      // 监测白屏时间

      this.currentScrollTop = e.detail.scrollTop
      // 高度为0的情况, 不做任何渲染逻辑
      if (!this._pos.height || !this.sizeArray.length) {
        // 没有任何数据的情况下, 直接清理所有的状态
        this._clearList(e.detail.cb)
        return
      }

      const pos = this._pos
      const that = this
      const scrollLeft = e.detail.scrollLeft
      const scrollTop = e.detail.scrollTop
      const scrollDistance = Math.abs(scrollTop - this._lastScrollTop)
      this._lastScrollTop = scrollTop
      if (!force && (Math.abs(scrollTop - pos.top) < pos.height * 1.5)) {
        this._log('【not exceed height')
        return
      }
      const SHOW_SCREENS = this.props.screen // 固定4屏幕
      this._log('SHOW_SCREENS', SHOW_SCREENS, scrollTop)
      this._calcViewportIndexes(scrollLeft, scrollTop,
        (beginIndex, endIndex, minTop, afterHeight, maxTop) => {
          that._log('scrollDistance', scrollDistance, 'indexes', beginIndex, endIndex)
          // 渲染的数据不变
          if (!force && pos.beginIndex === beginIndex && pos.endIndex === endIndex &&
            pos.minTop === minTop && pos.afterHeight === afterHeight) {
            that._log('------------is the same beginIndex and endIndex')
            return
          }
          // 如果这次渲染的范围比上一次的范围小，则忽略
          that._log('【check】before setData, old pos is', pos.minTop, pos.maxTop, minTop, maxTop)
          that._throttle = false
          pos.left = scrollLeft
          pos.top = scrollTop
          pos.beginIndex = beginIndex
          pos.endIndex = endIndex
          // console.log('render indexes', endIndex - beginIndex + 1, endIndex, beginIndex)
          pos.minTop = minTop
          pos.maxTop = maxTop
          pos.afterHeight = afterHeight
          pos.ignoreBeginIndex = pos.ignoreEndIndex = -1
          that.page._recycleViewportChange({
            detail: {
              data: that._pos,
              id: that.props.id
            }
          }, () => {
            if (e.detail.cb) {
              e.detail.cb()
            }
          })
        })
    },
    // 计算在视窗内渲染的数据
    _calcViewportIndexes(left, top, cb) {
      const that = this
      const {
        beginIndex, endIndex, minTop, afterHeight, maxTop
      } = that.__calcViewportIndexes(left, top)
      if (cb) {
        cb(beginIndex, endIndex, minTop, afterHeight, maxTop)
      }
    },
    _getIndexes(minTop, maxTop) {
      if (minTop === maxTop && maxTop === 0) {
        return {
          beginIndex: -1,
          endIndex: -1
        }
      }
      const sizeArray = this.sizeArray;
      if (!sizeArray) {
        return {
          beginIndex: -1,
          endIndex: -1
        }
      }
      //现在只支持每个item的大小都一样
      let beginIndex
      let endIndex
      const width = this.data.width;//控件的宽度
      const itemWidth = sizeArray[0].width;
      const itemHeight = sizeArray[0].height;
      const itemsEachLine = Math.floor(width / itemWidth);
      if (width / itemWidth >= 2) {//是个表格
        beginIndex = Math.floor(minTop / itemHeight) * itemsEachLine
        endIndex = Math.ceil(maxTop / itemHeight) * itemsEachLine - 1
      } else {
        beginIndex = Math.floor(minTop / itemHeight)
        endIndex = Math.ceil(maxTop / itemHeight)
      }
      endIndex = Math.min(sizeArray.length - 1, endIndex);
      console.log('beginIndex=' + beginIndex + '  endIndex=' + endIndex);
      return {
        beginIndex,
        endIndex
      }
    },
    _isIndexValid(beginIndex, endIndex) {
      if (typeof beginIndex === 'undefined' || beginIndex === -1 ||
        typeof endIndex === 'undefined' || endIndex === -1 || endIndex >= this.sizeArray.length) {
        return false
      }
      return true
    },
    __calcViewportIndexes(left, top) {
      if (!this.sizeArray.length) return {}
      const pos = this._pos
      if (typeof left === 'undefined') {
        (left = pos.left)
      }
      if (typeof top === 'undefined') {
        (top = pos.top)
      }
      // 和direction无关了
      const SHOW_SCREENS = this.props.screen
      let minTop = top - pos.height * SHOW_SCREENS
      let maxTop = top + pos.height * SHOW_SCREENS
      // maxTop或者是minTop超出了范围
      if (maxTop > this.totalHeight) {
        minTop -= (maxTop - this.totalHeight)
        maxTop = this.totalHeight
      }
      if (minTop < 0) {
        maxTop += Math.min(0 - minTop, this.totalHeight)
        minTop = 0
      }
      // 计算落在minTop和maxTop之间的方格有哪些
      const indexObj = this._getIndexes(minTop, maxTop)
      const beginIndex = indexObj.beginIndex
      let endIndex = indexObj.endIndex
      if (endIndex >= this.sizeArray.length) {
        endIndex = this.sizeArray.length - 1
      }
      // 校验一下beginIndex和endIndex的有效性,
      if (!this._isIndexValid(beginIndex, endIndex)) {
        return {
          beginIndex: -1,
          endIndex: -1,
          minTop: 0,
          afterHeight: 0,
          maxTop: 0
        }
      }
      // 计算白屏的默认占位的区域
      const maxTopFull = this.sizeArray[endIndex].beforeHeight + this.sizeArray[endIndex].height
      const minTopFull = this.sizeArray[beginIndex].beforeHeight

      // console.log('render indexes', beginIndex, endIndex)
      const afterHeight = this.totalHeight - maxTopFull
      return {
        beginIndex,
        endIndex,
        minTop: minTopFull, // 取整, beforeHeight的距离
        afterHeight,
        maxTop,
      }
    },
    _setInnerBeforeAndAfterHeight(obj) {
      if (typeof obj.beforeHeight !== 'undefined') {
        this._tmpBeforeHeight = obj.beforeHeight
      }
      if (obj.afterHeight) {
        this._tmpAfterHeight = obj.afterHeight
      }
      // setTimeout(_ => {
      //   this._recycleInnerBatchDataChanged();
      // }, 0);
    },
    setItemSize(size) {
      this.sizeArray = size.array
      this.sizeMap = size.map
      if (size.totalHeight !== this.totalHeight) {
        // console.log('---totalHeight is', size.totalHeight);
        this.setData({
          totalHeight: size.totalHeight,
          useInPage: this.useInPage || false
        })
      }
      this.totalHeight = size.totalHeight
    },
    setList(key, newList) {
      this._currentSetDataKey = key
      this._currentSetDataList = newList
    },
    setPage(page) {
      this.page = page
    },
    forceUpdate(cb, reInit) {
      if (!this._isReady) {
        if (this._updateTimerId) {
          // 合并多次的forceUpdate
          clearTimeout(this._updateTimerId)
        }
        this._updateTimerId = setTimeout(() => {
          this.forceUpdate(cb, reInit)
        }, 10)
        return
      }
      this._updateTimerId = null
      const that = this
      if (reInit) {
        this.reRender(() => {
          that._scrollViewDidScroll({
            detail: {
              scrollLeft: that._pos.left,
              scrollTop: that.currentScrollTop || that.data.scrollTop || 0,
              ignoreScroll: true,
              cb
            }
          }, true)
        })
      } else {
        this._scrollViewDidScroll({
          detail: {
            scrollLeft: that._pos.left,
            scrollTop: that.currentScrollTop || that.data.scrollTop || 0,
            ignoreScroll: true,
            cb
          }
        }, true)
      }
    },
    _initPosition(cb) {
      const that = this
      that._pos = {
        left: that.data.scrollLeft || 0,
        top: that.data.scrollTop || 0,
        width: this.data.width,
        height: Math.max(500, this.props.height), // 一个屏幕的高度
        direction: 0
      }
      this.reRender(cb)
    },
    _widthChanged(newVal) {
      if (!this._isReady) return newVal
      this._pos.width = newVal
      this.forceUpdate()
      return newVal
    },
    _heightChanged(newVal) {
      if (!this._isReady) return newVal
      this._pos.height = Math.max(500, newVal)
      this.forceUpdate()
      return newVal
    },
    reRender(cb) {
      cb();
    },
    _recycleInnerBatchDataChanged(cb) {//todo wrp batch page setDate and innerBeforeHeight
      if (typeof this._tmpBeforeHeight !== 'undefined') {
        const setObj = {
          innerBeforeHeight: this._tmpBeforeHeight || 0
        }
        if (typeof this._tmpInnerScrollTop !== 'undefined') {
          setObj.innerScrollTop = this._tmpInnerScrollTop
        }
        const pageObj = {}
        let hasPageData = false
        if (typeof this._currentSetDataKey !== 'undefined') {
          pageObj[this._currentSetDataKey] = this._currentSetDataList
          hasPageData = true
        }
        const groupSetData = () => {
          // 如果有分页数据的话
          if (hasPageData) {
            this.page.setData(pageObj)
          }
          this.setData(setObj, () => {
            if (typeof cb === 'function') {
              cb()
            }
          })
        }
        groupSetData()
        delete this._currentSetDataKey
        delete this._currentSetDataList
        this._tmpBeforeHeight = undefined
        this._tmpAfterHeight = undefined
        this._tmpInnerScrollTop = undefined
      }
    },
    _renderByScrollTop(scrollTop) {
      // 先setData把目标位置的数据补齐
      this._scrollViewDidScroll({
        detail: {
          scrollLeft: this._pos.scrollLeft,
          scrollTop,
          ignoreScroll: true
        }
      }, true)
      this.setData({//两次设置的scrollTop一样的情况下不会滚动
        innerScrollTop: this.data.innerScrollTop == scrollTop ? scrollTop + 1 : scrollTop
      })
    },
    scrollTo(newVal) {
      if (!this._isInitScrollTop && newVal === 0) {
        this._isInitScrollTop = true
        return newVal
      }
      this.currentScrollTop = newVal
      if (!this._isReady) {
        if (this._scrollTopTimerId) {
          clearTimeout(this._scrollTopTimerId)
        }
        this._scrollTopTimerId = setTimeout(() => {
          this._scrollTopChanged(newVal)
        }, 10)
        return newVal
      }
      this._isInitScrollTop = true
      this._scrollTopTimerId = null
      if (typeof this._lastScrollTop === 'undefined') {
        this._lastScrollTop = this.data.scrollTop
      }
      // 滑动距离小于一个屏幕的高度, 直接setData
      if (Math.abs(newVal - this._lastScrollTop) < this._pos.height) {
        this.setData({////两次设置的scrollTop一样的情况下不会滚动，scroll-view滚动的时候不会主动设置innerScrollTop属性
          innerScrollTop: this.data.innerScrollTop == newVal ? newVal + 1 : newVal
        })
        return newVal
      }
      if (!this._isScrollTopChanged) {
        // 首次的值需要延后一点执行才能生效
        setTimeout(() => {
          this._isScrollTopChanged = true
          this._renderByScrollTop(newVal)
        }, 10)
      } else {
        this._renderByScrollTop(newVal)
      }
      return newVal
    },
    scrollToIndex(newVal) {
      // 首次滚动到0的不执行
      if (!this._isInitScrollToIndex && newVal === 0) {
        this._isInitScrollToIndex = true
        return newVal
      }
      if (!this._isReady) {
        if (this._scrollToIndexTimerId) {
          clearTimeout(this._scrollToIndexTimerId)
        }
        this._scrollToIndexTimerId = setTimeout(() => {
          this._scrollToIndexChanged(newVal, oldVal)
        }, 10)
        return newVal
      }
      this._isInitScrollToIndex = true
      this._scrollToIndexTimerId = null
      if (typeof this._lastScrollTop === 'undefined') {
        this._lastScrollTop = this.data.scrollTop
      }
      const rect = this.boundingClientRect(newVal)
      if (!rect) return newVal
      const calScrollTop = rect.top
      this.currentScrollTop = calScrollTop
      if (Math.abs(calScrollTop - this._lastScrollTop) < this._pos.height) {
        this.setData({
          innerScrollTop: this.data.innerScrollTop == calScrollTop ? calScrollTop + 1 : calScrollTop
        })
        return newVal
      }
      if (!this._isScrollToIndexChanged) {
        setTimeout(() => {
          this._isScrollToIndexChanged = true
          this._renderByScrollTop(calScrollTop)
        }, 10)
      } else {
        this._renderByScrollTop(calScrollTop)
      }
      return newVal
    },
    // 提供给开发者使用的接口
    boundingClientRect(idx) {
      if (idx < 0 || idx >= this.sizeArray.length) {
        return null
      }
      return {
        left: 0,
        top: this.sizeArray[idx].beforeHeight,
        width: this.sizeArray[idx].width,
        height: this.sizeArray[idx].height
      }
    },
    // 获取当前出现在屏幕内数据项， 返回数据项组成的数组
    // 参数inViewportPx表示当数据项至少有多少像素出现在屏幕内才算是出现在屏幕内，默认是1
    getIndexesInViewport(inViewportPx) {
      if (!inViewportPx) {
        (inViewportPx = 1)
      }
      const scrollTop = this.currentScrollTop
      let minTop = scrollTop + inViewportPx
      if (minTop < 0) minTop = 0
      let maxTop = scrollTop + this.data.height - inViewportPx
      if (maxTop > this.totalHeight) maxTop = this.totalHeight
      const indexes = []
      for (let i = 0; i < this.sizeArray.length; i++) {
        if (this.sizeArray[i].beforeHeight + this.sizeArray[i].height >= minTop &&
          this.sizeArray[i].beforeHeight <= maxTop) {
          indexes.push(i)
        }
        if (this.sizeArray[i].beforeHeight > maxTop) break
      }
      return indexes
    },
    getTotalHeight() {
      return this.totalHeight
    },
    setUseInPage(useInPage) {
      this.useInPage = useInPage
    },
    setPlaceholderImage(svgs, size) {
      const fill = 'style=\'fill:rgb(204,204,204);\''
      const placeholderImages = [`data:image/svg+xml,%3Csvg height='${size.height}' width='${size.width}' xmlns='http://www.w3.org/2000/svg'%3E`]
      svgs.forEach(svg => {
        placeholderImages.push(`%3Crect width='${svg.width}' x='${svg.left}' height='${svg.height}' y='${svg.top}' ${fill} /%3E`)
      })
      placeholderImages.push('%3C/svg%3E')
      this.setData({
        placeholderImageStr: placeholderImages.join('')
      })
    }
  }
})
