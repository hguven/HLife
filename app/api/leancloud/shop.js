/**
 * Created by zachary on 2016/12/24.
 */
import AV from 'leancloud-storage'
import {Map, List, Record} from 'immutable'
import ERROR from '../../constants/errorCode'
import {
  ShopInfo,
  ShopAnnouncement,
  ShopComment,
  Up
} from '../../models/shopModel'

export function getShopList(payload) {
  let shopCategoryId = payload.shopCategoryId
  let sortId = payload.sortId // 0-智能,1-按好评,2-按距离
  let distance = payload.distance
  let geo = payload.geo
  let geoName = payload.geoName
  let isRefresh = payload.isRefresh
  let lastScore = payload.lastScore
  let lastGeo = payload.lastGeo
  let query = new AV.Query('Shop')
  if(shopCategoryId){
    //构建内嵌查询
    let innerQuery = new AV.Query('ShopCategory')
    innerQuery.equalTo('shopCategoryId', shopCategoryId)
    //执行内嵌查询
    query.matchesQuery('targetShopCategory', innerQuery)
  }

  //用 include 告知服务端需要返回的关联属性对应的对象的详细信息，而不仅仅是 objectId
  query.include(['targetShopCategory', 'owner'])

  if(sortId == 1) {
    if(!isRefresh) { //分页查询
      query.skip(1)
      query.lessThanOrEqualTo('score', lastScore)
    }
    query.addDescending('score')
  }else if(sortId == 2) {
    if(!isRefresh) { //分页查询
      query.skip(1)
      query.lessThanOrEqualTo('geo', lastGeo)
    }
    query.addDescending('geo')
    query.addDescending('score')
  }else{
    if(!isRefresh) { //分页查询
      query.skip(1)
      query.lessThanOrEqualTo('score', lastScore)
    }
    query.addDescending('score')
    query.addDescending('geo')
  }
  query.limit(5) // 最多返回 5 条结果
  if(distance) {
    if (Array.isArray(geo)) {
      let point = new AV.GeoPoint(geo)
      query.withinKilometers('geo', point, distance)
    }
  }else {
    query.contains('geoName', geoName)
  }
  return query.find().then(function (results) {
    // console.log('getShopList.results=', results)
    return AV.GeoPoint.current().then(function(geoPoint){
      let shopList = []
      results.forEach((result) => {
        result.userCurGeo = geoPoint
        shopList.push(ShopInfo.fromLeancloudObject(result))
      })
      return new List(shopList)
    })
  }, function (err) {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function getShopAnnouncement(payload) {
  let shopAnnouncements = []
  let shopId = payload.id //店铺id
  let shop = AV.Object.createWithoutData('Shop', shopId)
  let relation = shop.relation('containedAnnouncements')
  let query = relation.query()
  query.addDescending('createdAt')
  return query.find().then(function(results) {
    // console.log('getShopAnnouncement.results=====', results)
    results.forEach((result)=>{
      shopAnnouncements.push(ShopAnnouncement.fromLeancloudObject(result))
    })
    return new List(shopAnnouncements)
  }, function(err) {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function isFollowedShop(payload) {
  let shopId = payload.id
  let shop = AV.Object.createWithoutData('Shop', shopId)
  let currentUser = AV.User.current()

  let query = new AV.Query('ShopFollower')
  query.equalTo('follower', currentUser)
  query.equalTo('shop', shop)

  return query.find().then((result)=>{
    if(result && result.length) {
      return {
        shopId: shopId,
        code: '10001',
        message: '您已关注过该店铺,请不要重复关注'
      }
    }
    return {
      shopId: shopId,
      code: '10000',
      message: '未关注'
    }
  }, function (err) {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function followShop(payload) {

  return isFollowedShop(payload).then((result) =>{
    if(result && '10001' == result.code) {
      return result
    }

    let shopId = payload.id
    let shop = AV.Object.createWithoutData('Shop', shopId)
    let currentUser = AV.User.current()

    let ShopFollower = AV.Object.extend('ShopFollower')
    let shopFollower = new ShopFollower()
    shopFollower.set('follower', currentUser)
    shopFollower.set('shop', shop)

    let ShopFollowee = AV.Object.extend('ShopFollowee')
    let shopFollowee = new ShopFollowee()
    shopFollowee.set('user', currentUser)
    shopFollowee.set('followee', shop)

    return shopFollower.save().then(function(shopFollowerResult){
      return shopFollowee.save()
    }).then(()=>{
      return {
        shopId: shopId,
        code: '10002',
        message: '关注成功'
      }
    }).catch((err) =>{
      err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
      throw err
    })
  }).catch((err) =>{
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function submitShopComment(payload) {
  let shopId = payload.id
  let score = payload.score
  let content = payload.content
  let blueprints = payload.blueprints
  let shop = AV.Object.createWithoutData('Shop', shopId)
  let currentUser = AV.User.current()

  let ShopComment = AV.Object.extend('ShopComment')
  let shopComment = new ShopComment()
  shopComment.set('user', currentUser)
  shopComment.set('targetShop', shop)
  shopComment.set('score', score)
  shopComment.set('content', content)
  shopComment.set('blueprints', blueprints)

  return shopComment.save().then((results) => {
    // console.log('results=', results)
    return results
  }, function (err) {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function fetchShopCommentList(payload) {
  let shopId = payload.id
  let query = new AV.Query('ShopComment')
  //构建内嵌查询
  let innerQuery = new AV.Query('Shop')
  innerQuery.equalTo('objectId', shopId)
  //执行内嵌查询
  query.matchesQuery('targetShop', innerQuery)
  query.include(['targetShop', 'user'])
  query.addDescending('createdAt')
  return query.find().then((results)=>{
    // console.log('fetchShopCommentList.results=', results)
    let shopComment = []
    results.forEach((result)=>{
      shopComment.push(ShopComment.fromLeancloudObject(result))
    })
    return new List(shopComment)
  }, function (err) {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function fetchShopCommentTotalCount(payload) {
  let shopId = payload.id
  let query = new AV.Query('ShopComment')
  //构建内嵌查询
  let innerQuery = new AV.Query('Shop')
  innerQuery.equalTo('objectId', shopId)
  //执行内嵌查询
  query.matchesQuery('targetShop', innerQuery)
  return query.count().then((results)=>{
    return results
  }, function (err) {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function fetchUserUpShopInfo(payload) {
  let shopId = payload.id
  let upType = 'shop'
  let currentUser = AV.User.current()
  
  let query = new AV.Query('Up')
  query.equalTo('targetId', shopId)
  query.equalTo('upType', upType)
  query.equalTo('user', currentUser)
  query.include('user')
  return query.first().then((result) =>{
    let userUpShopInfo = undefined
    if(result && result.attributes) {
      userUpShopInfo = Up.fromLeancloudObject(result)
    }
    return userUpShopInfo
  }, function (err) {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function userUpShop(payload) {
  let shopId = payload.id
  let upType = 'shop'
  let currentUser = AV.User.current()

  return fetchUserUpShopInfo(payload).then((userUpShopInfo) => {
    // console.log('userUpShop.userUpShopInfo=', userUpShopInfo)
    if(!userUpShopInfo) {
      let Up = AV.Object.extend('Up')
      let up = new Up()
      up.set('targetId', shopId)
      up.set('upType', upType)
      up.set('user', currentUser)
      return up.save()
    }else if(userUpShopInfo.id && !userUpShopInfo.status) {
      let up = AV.Object.createWithoutData('Up', userUpShopInfo.id)
      up.set('status', true)
      return up.save()
    }
    return {
      code: '10007',
      message: '您已经赞过该店铺了'
    }
  }).then((result) => {
    if(result && '10007' == result.code) {
      return result
    }
    return {
      shopId: shopId,
      code: '10008',
      message: '成功点赞'
    }
  }).catch((err) => {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function userUnUpShop(payload) {
  let shopId = payload.id

  return fetchUserUpShopInfo(payload).then((userUpShopInfo) => {
    if(userUpShopInfo && userUpShopInfo.id) {
      let up = AV.Object.createWithoutData('Up', userUpShopInfo.id)
      up.set('status', false)
      return up.save()
    }
    return {
      code: '10009',
      message: '您还没有赞过该店铺'
    }
  }).then((result) => {
    if(result && '10009' == result.code) {
      return result
    }
    return {
      shopId: shopId,
      code: '10010',
      message: '取消点赞成功'
    }
  }).catch((err) => {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function reply(payload) {
  let replyShopCommentId = payload.replyShopCommentId
  let replyId = payload.replyId
  let currentUser = AV.User.current()
  let replyContent = payload.replyContent

  let replyShopComment = AV.Object.createWithoutData('ShopComment', replyShopCommentId)

  let ShopCommentReply = AV.Object.extend('ShopCommentReply')
  let shopCommentReply = new ShopCommentReply()
  shopCommentReply.set('content', replyContent)
  shopCommentReply.set('replyId', replyId)
  shopCommentReply.set('replyShopComment', replyShopComment)
  shopCommentReply.set('user', currentUser)

  return shopCommentReply.save().then((results) => {
    return results
  }, function (err) {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}


