# mini-ali-recycle-list
支付宝小程序高性能长列表组件，virtuallist




> 为支付宝小程序开发的长列表组件，参考微信的recycle-view,由于微信、支付宝平台不一致有些使用方式会不一样

## 背景

​ 支付宝小程序有的情况下一个列表会包含非常多元素，当一个页面展示很多的UI元素的时候，会造成小程序页面的卡顿以及白屏。原因有如下几点：

1. 列表数据很大，首次 setData 的时候耗时高
2. 渲染出来的列表 DOM 结构多，每次 setData 都需要创建新的虚拟树、和旧树 diff 操作耗时都比较高
3. 渲染出来的列表 DOM 结构多，占用的内存高，造成页面被系统回收的概率变大。

而支付宝小程序没有相关的virtuallist，因此按照微信recycle-view实现长列表组件来解决这些问题。

## 实现思路

​ 核心的思路就是只渲染显示在屏幕的数据，基本实现就是监听 scroll 事件，并且重新计算需要渲染的数据。
 实现详解：
 >1、根据提供的itemsize和列表组件宽度来计算展示所有的数据所需要的列表总高度totalHeight
 
 >2、根据滚动的位置计算展示数据的位置innerBeforeHeight，并设置当前滚动位置需要展示的数据

## 包结构

长列表组件由2个自定义组件 recycle-list、recycle-item 和一组 API 组成，对应的代码结构如下

```yaml
├── mini-ali-recycle-list/
    └── recycle-list 组件
    └── recycle-item 组件
    └── index.js
```

包结构详细描述如下：

| 目录/文件          | 描述                     |
| ----------------- | ------------------------ |
| recycle-list 组件 | 长列表组件                |
| recycle-item 组件 | 长列表每一项 item 组件     |
| index.js          | 提供操作长列表数据的API    |

## 使用方法

1. 安装组件

```
npm install --save mini-ali-recycle-list
```

2. 在页面的 json 配置文件中添加 recycle-list 和 recycle-item 自定义组件的配置

   ```json
{
  "usingComponents": {
    "recycle-list": "mini-ali-recycle-list/recycle-list/recycle-list",
    "recycle-item": "mini-ali-recycle-list/recycle-list/recycle-item/recycle-item"
  }
}
   ```

3. WXML 文件中引用 recycle-view

   ```xml

  <recycle-list ref="saveRecycleList" scroll-with-animation="{{false}}" height="{{600}}" id="recycleId" onScrollToLower="scrollToLower" innerBeforeHeight="{{innerBeforeHeight||0}}" beforeSlotHeight="100">
    <image slot="before" style='height:100px;width:100vw;' mode="aspectFill" src="https://y.gtimg.cn/music/photo_new/T002R300x300M000001TLG053apS5S_1.jpg?max_age=2592000">
    </image>
    <recycle-item style="width:20vw;height:160px;" a:for="{{recycleList}}" a:key="{{item.id}}">
      <view class="recycle-itemsize" style="width:20vw;height:160px;position: relative; border-color:#f7f8f9;border-style:solid;border-width:1px;box-sizing: border-box;">
        <text class="recycle-text">{{item.idx}}. {{item.title}}</text>
        <image class='recycle-image' style='width:19vw;height:80px;' src="https://y.gtimg.cn/music/photo_new/T002R300x300M000001B3iTE4Y9zix_1.jpg?max_age=2592000"></image>
      </view>
    </recycle-item>
  </recycle-list>

   ```

   **recycle-view 的属性介绍如下：**

   | 字段名                | 类型    | 必填 | 描述                                      |
   | --------------------- | ------- | ---- | ----------------------------------------- |
   | id                    | String  | 是   | id必须是页面唯一的字符串                  |
   | height                | Number  | 否   | 设置recycle-list的高度，默认为页面高度    |
   | width                 | Number  | 否   | 设置recycle-list的宽度，默认是页面的宽度  |
   | innerBeforeHeight     | Number  | 是   | 内部计算位置使用，固定为innerBeforeHeight||0  |
   | ref                   | func    | 是   | 内部需要的应用，固定为(ref)=>this.recyleRef = ref;  |
   | beforeSlotHeight      | Number  | 否   | 列表头高度，有列表头时必填   |
   | enable-back-to-top    | Boolean | 否   | 默认为false，同scroll-view同名字段        |
   | scroll-top            | Number  | 否   | 默认为false，同scroll-view同名字段        |
   | scroll-y              | Number  | 否   | 默认为true，同scroll-view同名字段        |
   | scroll-to-index       | Number  | 否   | 设置滚动到长列表的项                      |
   | placeholder-image     | String  | 否   | 默认占位背景图片，在渲染不及时的时候显示，不建议使用大图作为占位。建议传入SVG的Base64格式，可使用[工具](https://codepen.io/jakob-e/pen/doMoML)将SVG代码转为Base64格式。支持SVG中设置rpx。 |
   | scroll-with-animation | Boolean | 否   | 默认为false，同scroll-view的同名字段      |
   | lower-threshold       | Number  | 否   | 默认为false，同scroll-view同名字段        |
   | upper-threshold       | Number  | 否   | 默认为false，同scroll-view同名字段        |
   | bindscroll            | 事件    | 否   | 同scroll-view同名字段                     |
   | bindscrolltolower     | 事件    | 否   | 同scroll-view同名字段                     |
   | bindscrolltoupper     | 事件    | 否   | 同scroll-view同名字段                     |

   **recycle-list 包含3个 slot，具体介绍如下：**

   | 名称      | 描述                                                      |
   | --------- | --------------------------------------------------------- |
   | before    | 默认 slot 的前面的非回收区域                              |
   | 默认 slot | 长列表的列表展示区域，recycle-item 必须定义在默认 slot 中 |
   | after     | 默认 slot 的后面的非回收区域                              |

   ​ 

   **recycle-item 的介绍如下：**

   ​  需要注意的是，recycle-item 中必须定义 a:for 列表循环，不应该通过 setData 来设置 a:for 绑定的变量，而是通过`createRecycleContext`方法创建`RecycleContext`对象来管理数据，`createRecycleContext`在 index.js 文件里面定义。建议同时设置 a:key，以提升列表的渲染性能。

4. 页面 JS 管理 recycle-view 的数据

   ```javascript
   const createRecycleContext = require('mini-ali-recycle-list/recycle-list/index')
   .....
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

itemSize为必填项，必须预先知道item的宽高，现在只支持所有item一样宽高

   ```
   使用如下方式引入
   const createRecycleContext = require('mini-ali-recycle-list/recycle-list/index')
   ```


   ​  页面必须通过 Component 构造器定义，页面引入了`mini-ali-recycle-list`包之后，`createRecycleContext`接收类型为1个 Object 的参数，Object 参数的每一个 key 的介绍如下：

   | 参数名    | 类型            | 描述                                                             |
   | -------- | --------------- | --------------------------------------------------------------- |
   | id       | String          | 对应 recycle-list 的 id 属性的值                                  |
   | dataKey  | String          | 对应 recycle-item 的 a:for 属性设置的绑定变量名                   |
   | page     | Page/Component  | recycle-view 所在的页面或者组件的实例，页面或者组件内可以直接传 this |
   | itemSize | Object/Function | 此参数用来生成recycle-item的宽和高，前面提到过，要知道当前需要渲染哪些item，必须知道item的宽高才能进行计算<br />Object必须包含{width, height}两个属性，Function的话接收item, index这2个参数，返回一个包含{width, height}的Object<br />itemSize如果是函数，函数里面`this`指向RecycleContext<br />如果样式使用了rpx，可以通过transformRpx来转化为px。<br />为Object类型的时候，还有另外一种用法，详细情况见下面的itemSize章节的介绍。 |
   
   RecycleContext 对象提供的方法有：

   | 方法                  | 参数                         | 说明                                                         |
   | --------------------- | ---------------------------- | ------------------------------------------------------------ |
   | append                | list, callback               | 在当前的长列表数据上追加list数据，callback是渲染完成的回调函数 |
   | splice                | begin, count, list, callback | 插入/删除长列表数据，参数同Array的[splice](http://www.w3school.com.cn/js/jsref_splice.asp)函数，callback是渲染完成的回调函数 |
   | update                | begin, list, callback        | 更新长列表的数据，从索引参数begin开始，更新为参数list，参数callback同splice。 |
   | destroy               | 无                           | 销毁RecycleContext对象，在recycle-view销毁的时候调用此方法   |
   | forceUpdate           | callback, reinitSlot         | 重新渲染recycle-view。callback是渲染完成的回调函数，当before和after这2个slot的高度发生变化时候调用此函数，reinitSlot设置为true。当item的宽高发生变化的时候也需要调用此方法。 |
   | getBoundingClientRect | index                        | 获取某个数据项的在长列表中的位置，返回{left, top, width, height}的Object。 |
   | getScrollTop          | 无                           | 获取长列表的当前的滚动位置。                                 |
   | transformRpx          | rpx                          | 将rpx转化为px，返回转化后的px整数。itemSize返回的宽高单位是px，可以在这里调用此函数将rpx转化为px，参数是Number，例如ctx.transformRpx(140)，返回70。注意，transformRpx会进行四舍五入，所以transformRpx(20) + transformRpx(90)不一定等于transformRpx(110) |
   | getViewportItems      | inViewportPx                 | 获取在视窗内的数据项，用于判断某个项是否出现在视窗内。用于曝光数据上报，菜品和类别的联动效果实现。参数inViewportPx表示距离屏幕多少像素为出现在屏幕内，可以为负值。 |
    | getList      |       无          | 获取到完整的数据列表 |

   ## itemSize使用

   itemSize可以为包含{width, height}的Object，所有数据只有一种宽高信息。如果有多种，则可以提供一个函数，长列表组件会调用这个函数生成每条数据的宽高信息，如下所示：

   ```javascript
   function(item, index) {
       return {
           width: 195,
           height:  130 
       }
   }
   ```

   ## Important Tips

   1.在列表性能出现问题的时候使用该组件，如果列表本身数据不多无需使用该组件优化  
   2.该列表阉割了微信recycle-view一些功能，只保留了基础的功能     
   3.innerBeforeHeight、ref属性是必须且固定的，因为微信recycle-view使用了微信小程序内部的batch更新数据的功能而支付宝没有提供该功能，只能添加属性来达到一样的效果       
   4.现在只支持item固定宽高  
   5.快速滑动可能会出现白屏，因为是根据滑动的位置实时更新需要展示的数据需要时间，可以设置screen属性来增加预先加载的数据，默认为4      

   ## Tips

   1. recycle-item的宽高必须和itemSize设置的宽高一致，否则会出现跳动的bug。
   2. recycle-list设置的高度必须和其style里面设置的样式一致。
   3. `createRecycleContext(options)`的id参数必须和recycle-list的id属性一致，dataKey参数必须和recycle-item的a:for绑定的变量名一致。
   4. 不能在recycle-item里面使用wx:for的index变量作为索引值的，请使用{{item.\_\_index\_\_}}替代。
   5. 不要通过setData设置recycle-item的a:for的变量值，建议recycle-item设置wx:key属性。
   6. 如果长列表里面包含图片，必须保证图片资源是有HTTP缓存的，否则在滚动过程中会发起很多的图片请求。
   7. transformRpx会进行四舍五入，所以`transformRpx(20) + transformRpx(90)`不一定等于`transformRpx(110)`
