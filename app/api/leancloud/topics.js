import AV from 'leancloud-storage'
import {List} from 'immutable'
import ERROR from '../../constants/errorCode'
import {TopicsItem, TopicCommentsItem, TopicLikeUser} from '../../models/TopicModel'
import {Up} from '../../models/shopModel'
import {Geolocation} from '../../components/common/BaiduMap'
import * as AVUtils from '../../util/AVUtils'
import * as topicSelector from '../../selector/topicSelector'
import * as authSelector from '../../selector/authSelector'
import {store} from '../../store/persistStore'
import * as locSelector from '../../selector/locSelector'

export function publishTopics(payload) {

  let Topics = AV.Object.extend('Topics')
  let topic = new Topics()

  var topicCategory = AV.Object.createWithoutData('TopicCategory', payload.categoryId)
  var user = AV.Object.createWithoutData('_User', payload.userId)

  topic.set('geoPoint', payload.geoPoint)
  topic.set('position', payload.position)
  topic.set('city', payload.city)
  topic.set('district', payload.district)
  topic.set('province', payload.province)
  topic.set('category', topicCategory)
  topic.set('user', user)
  topic.set('imgGroup', payload.imgGroup)
  topic.set('content', payload.content)
  topic.set('title', payload.title)
  topic.set('abstract', payload.abstract)
  topic.set('commentNum', 0)
  topic.set('likeCount', 0)

  return topic.save().then(function (result) {
    let newTopic = result
    newTopic.attributes.user = AV.User.current()
    return TopicsItem.fromLeancloudObject(newTopic)
  }, function (err) {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function updateTopic(payload) {
  var topic = AV.Object.createWithoutData('Topics', payload.topicId)

  var topicCategory = AV.Object.createWithoutData('TopicCategory', payload.categoryId)

  topic.set('category', topicCategory)
  topic.set('imgGroup', payload.imgGroup)
  topic.set('content', payload.content)
  topic.set('title', payload.title)
  topic.set('abstract', payload.abstract)

  return topic.save(null, {fetchWhenSave: true}).then(function (result) {
    let newTopic = result
    newTopic.attributes.user = AV.User.current()
    return TopicsItem.fromLeancloudObject(newTopic)
  }, function (error) {
    error.message = ERROR[error.code] ? ERROR[error.code] : ERROR[9999]
    throw error
  }).catch((error) => {
    error.message = ERROR[error.code] ? ERROR[error.code] : ERROR[9999]
    throw error
  })

}

export function fetchTopicLikesCount(payload) {
  let topicId = payload.topicId
  let upType = payload.upType
  let query = new AV.Query('Up')
  query.equalTo('targetId', topicId)
  query.equalTo('upType', upType)
  // query.equalTo('upType', "topic")
  query.equalTo('status', true)
  return query.count().then((results)=> {
    return results
  }, function (err) {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function fetchTopicLikeUsers(payload) {
  let topicId = payload.topicId
  let isRefresh = payload.isRefresh
  let lastCreatedAt = payload.lastCreatedAt

  let query = new AV.Query('Up')

  if(!isRefresh && lastCreatedAt) {
    query.lessThan('createdAt', new Date(lastCreatedAt))
  }

  query.include(['user']);
  query.equalTo('targetId', topicId)
  query.equalTo('upType', "topic")
  query.equalTo('status', true)
  query.limit(5)
  query.addDescending('createdAt')
  
  // console.log('fetchTopicLikeUsers.query===', query)
  return query.find().then((results)=> {
    let topicLikeUsers = []
    if (results) {
      results.forEach((result) => {
        topicLikeUsers.push(TopicLikeUser.fromLeancloudObject(result))
      })
    }
    return new List(topicLikeUsers)
  }, function (err) {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function fetchUserLikeTopicInfo(payload) {
  let topicId = payload.topicId
  let upType = payload.upType
  let currentUser = AV.User.current()

  let query = new AV.Query('Up')
  query.equalTo('targetId', topicId)
  query.equalTo('upType', upType)
  query.equalTo('user', currentUser)
  query.include('user')
  return query.first().then((result) => {
    let userUpShopInfo = undefined
    if (result && result.attributes) {
      userUpShopInfo = Up.fromLeancloudObject(result)
    }
    return userUpShopInfo
  }, function (err) {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function likeTopic(payload) {
  let topicId = payload.topicId
  let upType = payload.upType
  let topic = undefined

  if (upType == "topic")
    topic = AV.Object.createWithoutData('Topics', topicId)
  else if (upType == "topicComment")
    topic = AV.Object.createWithoutData('TopicComments', topicId)

  let currentUser = AV.User.current()

  // console.log('likeTopic.topicId===', topicId)
  let userLikeTopicInfo = topicSelector.selectCurrentUserLikedTopicInfo(store.getState(), topicId)
  // console.log('likeTopic.userLikeTopicInfo===', userLikeTopicInfo)

  if(userLikeTopicInfo && userLikeTopicInfo.status) {
    return new Promise((resolve, reject) => {
      resolve({
        code: '10107',
        message: '您已经赞过该话题了'
      })
    })
  }else {
    let up = null
    if(!userLikeTopicInfo) {
      let Up = AV.Object.extend('Up')
      up = new Up()
      up.set('targetId', topicId)
      up.set('upType', upType)
      up.set('user', currentUser)
      up.set('status', true)
    }else {
      up = AV.Object.createWithoutData('Up', userLikeTopicInfo.id)
      up.set('status', true)
    }
    return up.save().then((result) => {
      // console.log('likeTopic.result==', result)
      topic.increment("likeCount", 1)
      topic.save()

      let topicInfo = topicSelector.getTopicById(store.getState(), topicId)
      let activeUser = authSelector.activeUserInfo(store.getState())
      let pushUserid = topicInfo && topicInfo.userId
      // console.log('likeTopic.topicInfo==', topicInfo)
      if(pushUserid && activeUser.id != pushUserid) {
        AVUtils.pushByUserList([pushUserid], {
          alert: `${activeUser.nickname}点赞了您的评论,立即查看`,
          sceneName: 'TOPIC_DETAIL',
          sceneParams: {
            topic: topicInfo
          }
        })
      }

      return {
        topicId: topicId,
        code: '10108',
        message: '成功点赞'
      }
    }, function (err) {
      err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
      throw err
    })
  }
}

export function unLikeTopic(payload) {
  let topicId = payload.topicId
  let upType = payload.upType
  let topic = undefined

  if (upType == "topic")
    topic = AV.Object.createWithoutData('Topics', topicId)
  else if (upType == "topicComment")
    topic = AV.Object.createWithoutData('TopicComments', topicId)

  let currentUser = AV.User.current()

  let userLikeTopicInfo = topicSelector.selectCurrentUserLikedTopicInfo(store.getState(), topicId)

  if(!userLikeTopicInfo || !userLikeTopicInfo.status) {
    return new Promise((resolve, reject) => {
      resolve({
        code: '10009',
        message: '您还没有赞过该话题'
      })
    })
  }else {
    let up = AV.Object.createWithoutData('Up', userLikeTopicInfo.id)
      up.set('status', false)
    return up.save().then((result) => {
      // console.log('unLikeTopic.result==', result)
      topic.increment("likeCount", -1)
      topic.save()

      return {
        topicId: topicId,
        code: '10010',
        message: '取消点赞成功'
      }
    }, function (err) {
      err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
      throw err
    })
  }
}


// export function likeTopic(payload) {
//   let topicId = payload.topicId
//   let topic = undefined
//   if (payload.upType == "topic")
//     topic = AV.Object.createWithoutData('Topics', payload.topicId)
//   else if (payload.upType == "topicComment")
//     topic = AV.Object.createWithoutData('TopicComments', payload.topicId)
//   let upType = payload.upType
//   let currentUser = AV.User.current()
//   return fetchUserLikeTopicInfo(payload).then((userLikeTopicInfo) => {
//     if (!userLikeTopicInfo) {
//       let Up = AV.Object.extend('Up')
//       let up = new Up()
//       up.set('targetId', topicId)
//       up.set('upType', upType)
//       up.set('user', currentUser)
//       return up.save()
//     }
//     else if (userLikeTopicInfo.id && !userLikeTopicInfo.status) {
//       let up = AV.Object.createWithoutData('Up', userLikeTopicInfo.id)
//       up.set('status', true)
//       return up.save()
//     }
//     return {
//       code: '10107',
//       message: '您已经赞过该话题了'
//     }
//   }).then((result) => {
//     if (result && '10107' == result.code) {
//       return result
//     }
//     topic.increment("likeCount", 1)
//     return topic.save().then(function (result) {

//       let topicInfo = topicSelector.getTopicById(store.getState(), topicId)
//       let activeUser = authSelector.activeUserInfo(store.getState())
//       let pushUserid = topicInfo && topicInfo.userId
//       // console.log('likeTopic.topicInfo==', topicInfo)
//       if(pushUserid && activeUser.id != pushUserid) {
//         AVUtils.pushByUserList([pushUserid], {
//           alert: `${activeUser.nickname}点赞了您的评论,立即查看`,
//           sceneName: 'TOPIC_DETAIL',
//           sceneParams: {
//             topic: topicInfo
//           }
//         })
//       }

//       return {
//         topicId: topicId,
//         code: '10108',
//         message: '成功点赞'
//       }
//     }, function (err) {
//       err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
//       throw err
//     })

//   }).catch((err) => {
//     err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
//     throw err
//   })
// }

// export function unLikeTopic(payload) {
//   let topicId = payload.topicId
//   let topic = undefined
//   if (payload.upType == "topic")
//     topic = AV.Object.createWithoutData('Topics', payload.topicId)
//   else if (payload.upType == "topicComment")
//     topic = AV.Object.createWithoutData('TopicComments', payload.topicId)
//   return fetchUserLikeTopicInfo(payload).then((userLikeTopicInfo) => {
//     if (userLikeTopicInfo && userLikeTopicInfo.id) {
//       let up = AV.Object.createWithoutData('Up', userLikeTopicInfo.id)
//       up.set('status', false)
//       return up.save()
//     }
//     return {
//       code: '10009',
//       message: '您还没有赞过该话题'
//     }
//   }).then((result) => {
//     if (result && '10009' == result.code) {
//       return result
//     }
//     topic.increment("likeCount", -1)
//     return topic.save().then(function (result) {
//       return {
//         topicId: topicId,
//         code: '10010',
//         message: '取消点赞成功'
//       }
//     }, function (err) {
//       err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
//       throw err
//     })
//   }).catch((err) => {
//     err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
//     throw err
//   })
// }

export function publishTopicComments(payload) {
  let TopicComments = AV.Object.extend('TopicComments')
  let topicComment = new TopicComments()

  var topic = AV.Object.createWithoutData('Topics', payload.topicId)
  var user = AV.Object.createWithoutData('_User', payload.userId)
  var parentComment = AV.Object.createWithoutData('TopicComments', payload.commentId)

  topicComment.set('geoPoint', payload.geoPoint)
  topicComment.set('position', payload.position)
  topicComment.set('topic', topic)
  topicComment.set('user', user)
  topicComment.set('content', payload.content)

  if (payload.commentId) {
    topicComment.set('parentComment', parentComment)
  }

  return topicComment.save().then(function (result) {
    if (result) {
      let topicInfo = topicSelector.getTopicById(store.getState(), payload.topicId)
      let activeUser = authSelector.activeUserInfo(store.getState())
      let pushUserid = topicInfo && topicInfo.userId
      if(pushUserid && activeUser.id != pushUserid) {
        AVUtils.pushByUserList([pushUserid], {
          alert: `${activeUser.nickname}评论了您,立即查看`,
          sceneName: 'TOPIC_DETAIL',
          sceneParams: {
            topic: topicInfo
          }
        })
      }

      let relation = topic.relation('comments')
      relation.add(topicComment);
      topic.increment("commentNum", 1)
      let newTopicComment = result
      newTopicComment.attributes.user = AV.User.current()
      return topic.save().then(function (result) {
        if (payload.commentId) {
          var query = new AV.Query('TopicComments');
          query.include(['user'])
          return query.get(payload.commentId).then(function (result) {
            newTopicComment.attributes.parentComment = result
            return TopicCommentsItem.fromLeancloudObject(newTopicComment)
          }, function (err) {
            err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
            throw err
          })
        }
        else {
          return TopicCommentsItem.fromLeancloudObject(newTopicComment)
        }
      }, function (err) {
        err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
        throw err
      })
    }
  }, function (err) {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function getLocalTopics(payload) {
  let query = new AV.Query('Topics')
  let state = store.getState()
  let province = locSelector.getProvince(state)
  let city = locSelector.getCity(state)

  let isRefresh = payload.isRefresh
  let lastCreatedAt = payload.lastCreatedAt
  let lastUpdatedAt = payload.lastUpdatedAt
  if (!isRefresh && lastCreatedAt) { //分页查询
    query.lessThan('createdAt', new Date(lastCreatedAt))
  }

  // if (!isRefresh && lastUpdatedAt) { //分页查询
  //   query.lessThan('updatedAt', new Date(lastUpdatedAt))
  // }
  query.equalTo('status',1)
  if(city && city != '全国') {
    query.equalTo('city', city)
    query.equalTo('province', province)
  }

  query.limit(10)
  query.include(['user'])
  // query.descending('updatedAt')
  query.descending('createdAt')

  return query.find().then(function (results) {
    let topics = []
    results.forEach((result) => {
      topics.push(TopicsItem.fromLeancloudObject(result))
    })
    return {
      topics:new List(topics),
    }
  }, function (err) {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function getTopics(payload) {
  if (payload.type == "localTopics") {
    return getLocalTopics(payload)
  }
  else {
    let categoryId = payload.categoryId
    let query = new AV.Query('Topics')
    if (payload.type == "topics" && categoryId) {
      var category = AV.Object.createWithoutData('TopicCategory', categoryId);
      query.equalTo('category', category)
    }

    if (payload.type == "myTopics") {
      let currentUser = AV.User.current()
      query.equalTo('user', currentUser)
    }
    query.equalTo('status',1)

    if (payload.type == "pickedTopics") {
      query.equalTo('picked', true)
    }

    if (payload.userId && payload.type == 'userTopics') {
      var user = AV.Object.createWithoutData('_User', payload.userId)
      query.equalTo('user', user)
    }

    // console.log('getTopics.lastUpdatedAt====', payload.lastUpdatedAt)
    let isRefresh = payload.isRefresh
    let lastCreatedAt = payload.lastCreatedAt
    // let lastCreatedAt = ''
    let lastUpdatedAt = payload.lastUpdatedAt
    if (!isRefresh) { //分页查询
      if(lastCreatedAt) {
        query.lessThan('createdAt', new Date(lastCreatedAt))
      }
      // else if(lastUpdatedAt) {
      //   query.lessThan('updatedAt', new Date(lastUpdatedAt))
      //   query.descending('updatedAt')
      // }
    }

    query.limit(10) // 最多返回 10 条结果
    query.include(['user'])
    query.descending('createdAt')

    // console.log('getTopics===isRefresh=', isRefresh)
    // console.log('getTopics===query=', query)
    return query.find().then(function (results) {
      let topics = []
      results.forEach((result) => {
        topics.push(TopicsItem.fromLeancloudObject(result))
      })
      return {
        topics:new List(topics)
      }
    }, function (err) {
      err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
      throw err
    })
  }
}

export function fetchUserTopicsTotalCount(payload) {
  let userId = payload.userId
  let query = new AV.Query('Topics')
  var user = AV.Object.createWithoutData('_User', userId)
  query.equalTo('user', user)
  query.equalTo('status',1)

  return query.count().then((totalCount)=>{
    // console.log('fetchOtherUserFollowersTotalCount==totalCount=', totalCount)
    return {
      userId: userId,
      userTopicsTotalCount: totalCount
    }
  }, function (err) {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}


export function getTopicById(payload) {
  let query = new AV.Query('Topics')
  query.include(['user'])
  return query.get(payload.topicId).then((topicRecord) => {
    return TopicsItem.fromLeancloudObject(topicRecord)
  }, (err) => {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function fetchTopicComments(payload) {
  return AV.Cloud.run('hLifeFetchTopicComments', payload).then((results) => {
    // console.log("fetchTopicComments.results:", results)

    let topicComments = []
    let topicCommentLikeCounts = []
    let userUpInfos = []

    if(results && results.length) {
      results.forEach((item, index) => {
        if(item.likeCount) {
          topicCommentLikeCounts.push({
            topicId: item.objectId,
            likesTotalCount: item.likeCount
          })
          delete item.likeCount
        }
        
        if(item.userUpInfo) {
          userUpInfos.push({
            topicId:  item.objectId,
            userLikeInfo: Up.fromLeancloudApi(item.userUpInfo)
          })
          delete item.userUpInfo
        }

        topicComments.push(TopicCommentsItem.fromLeancloudApi(item))
      })
    }

    return {
      topicComments: new List(topicComments),
      topicCommentLikeCounts: topicCommentLikeCounts,
      userUpInfos: userUpInfos
    }
  }, (err) => {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

/**
export function fetchTopicComments(payload) {
  let topicId = payload.topicId
  let isRefresh = payload.isRefresh
  let lastCreatedAt = payload.lastCreatedAt
  let query = new AV.Query('TopicComments')

  var topic = AV.Object.createWithoutData('Topics', topicId)
  query.equalTo('topic', topic)

  // console.log('isRefresh====', isRefresh)
  // console.log('lastCreatedAt====', lastCreatedAt)
  if(!isRefresh && lastCreatedAt) { //分页查询
    query.lessThan('createdAt', new Date(lastCreatedAt))
  }

  query.limit(5)
  
  query.include(['user']);
  query.include(['parentComment']);
  query.include(['parentComment.user']);
  query.descending('createdAt')
  // console.log('fetchTopicComments.query====', query)
  return query.find().then(function (results) {
    // console.log('fetchTopicComments.results====', results)
      let topicComments = []
      if (results) {
        results.forEach((result) => {
          topicComments.push(TopicCommentsItem.fromLeancloudObject(result))
        })
      }
      return new List(topicComments)
    }
    , function (err) {
      err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
      throw err
    })
}
*/

/**
* deprecated
*/
export function getTopicComments(payload) {
  let topicId = payload.topicId
  let topic = AV.Object.createWithoutData('Topics', topicId);
  let relation = topic.relation('comments')
  let query = relation.query()
  query.include(['user']);
  query.include(['parentComment']);
  query.include(['parentComment.user']);
  query.descending('createdAt')
  return query.find().then(function (results) {
      let topicComments = []
      if (results) {
        results.forEach((result) => {
          topicComments.push(TopicCommentsItem.fromLeancloudObject(result))
        })
      }
      return new List(topicComments)
    }
    , function (err) {
      err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
      throw err
    })
}

export function getMainPageTopics(payload) {
  let params = {}
  let limited = payload.limited
  params.limit = limited
  return AV.Cloud.run('getPickedTopicList', params).then((topics) => {
    return new List(topics)
  }, (err) => {
    err.message = ERROR[err.code] ? ERROR[err.code] : ERROR[9999]
    throw err
  })
}

export function disableTopic(payload){
  return AV.Cloud.run('disableTopicByUser',{id:payload}).then(()=>{
    return {success:true}
  })
}
