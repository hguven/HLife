/**
 * Created by yangyang on 2016/12/20.
 */
import  {Platform, CameraRoll} from 'react-native'
import {createAction} from 'redux-actions'
import {Map, List} from 'immutable'
import AV from 'leancloud-storage'
import {TypedMessage, messageType, Realtime} from 'leancloud-realtime'
import {TypedMessagePlugin}from 'leancloud-realtime-plugin-typed-messages'
import * as LC_CONFIG from '../constants/appConfig'
import * as msgTypes from '../constants/messageActionTypes'
import {Conversation, Message} from '../models/messageModels'
import {
  TopicCommentMsg,
  ShopCommentMsg,
  TopicLikeMsg,
  ShopLikeMsg,
  UserFollowMsg,
  ShopFollowMsg,
  NotifyMessage,
  PublishShopPromotionMsg
} from '../models/notifyModel'
import {activeUserId, activeUserInfo} from '../selector/authSelector'
import {messengerClient} from '../selector/messageSelector'
import {selectShopDetail} from '../selector/shopSelector'
// import {getTopicById} from '../selector/topicSelector'
import {getTopicByTopicId} from '../selector/newTopicSelector'

import * as lcShop from '../api/leancloud/shop'
import * as AVUtils from '../util/AVUtils'
import {KM_FIN} from '../../app/util/global'

class TextMessage extends TypedMessage {
}
messageType(msgTypes.MSG_TEXT)(TextMessage)

class ImageMessage extends TypedMessage {
}
messageType(msgTypes.MSG_IMAGE)(ImageMessage)

class AudioMessage extends TypedMessage {
}
messageType(msgTypes.MSG_AUDIO)(AudioMessage)

class ArticleCommentMessage extends TypedMessage {
}
messageType(msgTypes.MSG_ARTICLE_COMMENT)(ArticleCommentMessage)

class TopicCommentMessage extends TypedMessage {
}
messageType(msgTypes.MSG_TOPIC_COMMENT)(TopicCommentMessage)

class ShopCommentMessage extends TypedMessage {
}
messageType(msgTypes.MSG_SHOP_COMMENT)(ShopCommentMessage)

class ArticleLikeMessage extends TypedMessage {
}
messageType(msgTypes.MSG_ARTICLE_LIKE)(ArticleLikeMessage)

class TopicLikeMessage extends TypedMessage {
}
messageType(msgTypes.MSG_TOPIC_LIKE)(TopicLikeMessage)

class ShopLikeMessage extends TypedMessage {
}
messageType(msgTypes.MSG_SHOP_LIKE)(ShopLikeMessage)

class UserFollowMessage extends TypedMessage {
}
messageType(msgTypes.MSG_USER_FOLLOW)(UserFollowMessage)

class ShopFollowMessage extends TypedMessage {
}
messageType(msgTypes.MSG_SHOP_FOLLOW)(ShopFollowMessage)

class PublishShopPromotioMessage extends TypedMessage {
}
messageType(msgTypes.MSG_PUBLISH_SHOP_PROMOTION)(PublishShopPromotioMessage)


//we should move this to the server to avoid reverse-engineering

const realtime = new Realtime({
  appId: KM_FIN.appId,
  appKey: KM_FIN.appKey,
  region: 'cn',
  noBinary: true,
  pushOfflineMessages: true,
  plugins: [TypedMessagePlugin],
})
realtime.register(TextMessage)
realtime.register(ImageMessage)
realtime.register(AudioMessage)
realtime.register(ArticleCommentMessage)
realtime.register(TopicCommentMessage)
realtime.register(ShopCommentMessage)
realtime.register(ArticleLikeMessage)
realtime.register(TopicLikeMessage)
realtime.register(ShopLikeMessage)
realtime.register(UserFollowMessage)
realtime.register(ShopFollowMessage)
realtime.register(PublishShopPromotioMessage)

const initMessenger = createAction(msgTypes.INIT_MESSENGER_CLIENT)
const onCreateConversation = createAction(msgTypes.ON_CONVERSATION_CREATED)
const onEnterConversation = createAction(msgTypes.ON_ENTER_CONVERSATION)
const onLeaveConversation = createAction(msgTypes.ON_LEAVE_CONVERSATION)
const onCreateMessage = createAction(msgTypes.ON_MESSAGE_CREATED)
const onSendMessage = createAction(msgTypes.ON_MESSAGE_SENTED)
const onRecvMessage = createAction(msgTypes.ON_MESSAGE_RECEIVED)
const onUpdateConversation = createAction(msgTypes.ON_UPDATE_CONVERSATION)

export function initMessageClient(payload) {
  return (dispatch, getState) => {
    const userId = activeUserId(getState())

    if (!userId) {
      if (payload.error) {
        payload.error({message: '用户未登录'})
      }
    }
    let tag = 'web'
    if (Platform.OS == 'ios' || Platform.OS == 'android') {
      tag = 'mobile'
    }

    return dispatch(initLcMessenger({
      tag: tag,
      userId: userId,
    }))
  }
}

export function initLcMessenger(payload) {
  return (dispatch) => {
    realtime.createIMClient(payload.userId, {}, payload.tag).then((client) => {
      client.on('message', function (message, conversation) {
        dispatch(onReceiveMsg(message, conversation))

        if(global.chatMessageSoundOpen) {
          AVUtils.playMessageSound()
        }
      })

      client.on('disconnect', function () {
        console.log('网络连接已断开');
      })
      client.on('schedule', function (attempt, delay) {
        console.log(delay + 'ms 后进行第' + (attempt + 1) + '次重连');
      })
      client.on('retry', function (attempt) {
        console.log('正在进行第' + attempt + '次重连');
      })
      client.on('reconnect', function () {
        console.log('网络连接已恢复');
      })

      dispatch(initMessenger({client: client}))
      console.log('IM客户端已登录')
    }).catch((error) => {
      console.log(error)
    })
  }
}

export function closeMessageClient(payload) {
  return (dispatch, getState) => {
    let client = messengerClient(getState())
    if (!client) {
      return
    }
    client.close().then(() => {
      dispatch(createAction(msgTypes.CLOSE_MESSENGER_CLIENT)({}))
    })
  }
}

export function createConversation(payload) {
  return (dispatch, getState) => {
    dispatch(createLcConversation(payload)).then((conversation) => {
      if (!conversation) {
        console.log('create conversation failed.')
        if (payload.error) {
          payload.error()
        }
        return
      }
      dispatch(onCreateConversation(conversation))
      dispatch(enterConversation({conversationId: conversation.id}))
      if (payload.success) {
        payload.success({meesage: '创建对话成功', conversation: conversation})
      }
    }).catch((error) => {
      console.log('failed to create conversation: ', error)
      if (payload.error) {
        payload.error(error)
      }
    })
  }
}

export function sendMessage(payload) {
  return (dispatch, getState) => {

    if (!payload.text || payload.text.length == 0) {
      return
    }

    let attributes = {}
    if (payload.type == msgTypes.MSG_IMAGE) {
      attributes['localUri'] = payload.uri
    } else if (payload.type == msgTypes.MSG_AUDIO) {
      attributes['localUri'] = payload.uri
      attributes['duration'] = payload.duration
    }

    let msg = new Message({
      id: payload.msgId,
      from: activeUserId(getState()),
      type: payload.type,
      text: payload.text,
      conversation: payload.conversationId,
      status: 'created',
      attributes: Map(attributes)
    })

    dispatch(onCreateMessage({createdMsgId: payload.msgId, message: msg}))

    dispatch(sendLcTypedMessage(payload)).then((message) => {
      // console.log('sendLcTypedMessage.message===', message)
      dispatch(onSendMessage({createdMsgId: payload.msgId, message: message}))
    }).catch((error) => {
      console.log(error)
      const failMsg = new Message({
        id: payload.msgId,
        from: activeUserId(getState()),
        type: payload.type,
        text: payload.text,
        conversation: payload.conversationId,
        status: 'fail',
        attributes: Map(attributes),
      })
      dispatch(onSendMessage({message: failMsg}))
    })
  }
}

export function enterTypedNotify(payload) {
  return (dispatch, getState) => {
    let onEnterTypedNotify = createAction(msgTypes.ON_ENTER_TYPED_NOTIFY)
    dispatch(onEnterTypedNotify({type: payload.type}))
  }
}

export function enterConversation(payload) {
  return (dispatch, getState) => {
    dispatch(onEnterConversation({cid: payload.conversationId}))
  }
}

export function leaveConversation(payload) {
  return (dispatch, getState) => {
    dispatch(onLeaveConversation())
  }
}

export function fetchConversation(payload) {
  return (dispatch, getState) => {
    let userId = activeUserId(getState())
    payload.userId = userId

    dispatch(fetchLcConversation(payload)).then((convs) => {
      // console.log('fetchConversation.convs===', convs)
      // console.log('fetchConversation.payload===', payload)
      let isRefresh = payload.isRefresh
      let actionType = msgTypes.FETCH_CONVERSATION
      if(!isRefresh) {
        actionType = msgTypes.FETCH_CONVERSATION_PAGING
      }
      let action = createAction(actionType)
      let convsList = new List(convs)
      dispatch(action({conversations: convsList}))
      if(payload.success) {
        payload.success(convs.length <= 0, convsList.toJS())
      }
    }, (error)=>{
      if(payload.error) {
        payload.error(error)
      }
    })
  }
}

export function fetchHistoryChatMessagesByPaging(payload) {
  return (dispatch, getState) => {
    let conversationId = payload.conversationId
    let messageIterator = payload.messageIterator

    messageIterator.next().then(function(result) {

      let lcMsgs = result.value
      let hasMore = !result.done

      let messages = []
      lcMsgs.map((msg) => {
        messages.unshift(Message.fromLeancloudMessage(msg))
      })

      let action = createAction(msgTypes.FETCH_HISTORY_CHAT_MESSAGES_BY_PAGING_SUCCESS)
      dispatch(action({
        conversationId,
        messages,
      }))

      if(payload.success) {
        payload.success({
          messages,
          hasMore
        })
      }
      
    }).catch((err) => {
      console.log('fetchHistoryChatMessagesByPaging.err===', err)
      if(payload.error) {
        payload.error(err)
      }
    });
  }
}

export function fetchChatMessages(payload) {
  return (dispatch, getState) => {
    dispatch(fetchLcChatMessages(payload)).then((messages) => {
      let initMessages = createAction(msgTypes.ON_INIT_MESSAGES)
      dispatch(initMessages({
        conversationId: payload.conversationId,
        messages: messages,
      }))
    }).catch((err) => {
      console.log(err)
    })
  }
}

function fetchLcConversation(payload) {
  return (dispatch, getState) => {
    let client = messengerClient(getState())
    if (!client) {
      if (payload.error) {
        payload.error()
      }
      console.log('leancloud Messenger init failed, can\'t get client')
      return []
    }

    let isRefresh = payload.isRefresh
    let lastUpdatedAt = payload.lastUpdatedAt
    let type = payload.type
    let userId = payload.userId

    let query = client.getQuery()
    query.containsMembers([userId])
    query.equalTo('type', type)

    query.withLastMessagesRefreshed(true) //对话的最后一条消息

    // console.log('fetchLcConversation**isRefresh********', isRefresh)
    // console.log('fetchLcConversation**lastUpdatedAt********', lastUpdatedAt)
    if(!isRefresh && lastUpdatedAt) {
      query.lessThan('updatedAt', new Date(lastUpdatedAt))
    }

    query.limit(8)
    query.addDescending('updatedAt')

    // console.log('fetchLcConversation.query====', query)
    return query.find().then((lcConvs) => {
      // console.log('fetchLcConversation.lcConvs====', lcConvs)
      let convs = []
      lcConvs.map((conv) => {
        convs.push(Conversation.fromLeancloudConversation(conv))
      })
      return convs
    }, (error)=>{
      return error
    })
  }
}

function fetchLcChatMessages(payload) {
  return (dispatch, getState) => {
    let client = messengerClient(getState())
    if (!client) {
      if (payload.error) {
        payload.error()
      }
      console.log('leancloud Messenger init failed, can\'t get client')
      return undefined
    }

    return client.getConversation(payload.conversationId).then((conversation)=> {
      return conversation.queryMessages({limit: 10})
    }).then((lcMsgs)=> {
      let msgs = []
      lcMsgs.map((msg) => {
        msgs.unshift(Message.fromLeancloudMessage(msg))
      })
      return msgs
    }).catch((err) => {
      console.log(err)
    })
  }
}

export function getLcConversation(payload) {
  return (dispatch, getState) => {
    let client = messengerClient(getState())
    if (!client) {
      if (payload.error) {
        payload.error()
      }
    }

    return client.getConversation(payload.conversationId).then((conversation)=> {
      if (payload.success) {
        payload.success(conversation)
      }
    }, (error) =>{
      if (payload.error) {
        payload.error()
      }
    })
  }
}

function createLcConversation(payload) {
  return (dispatch, getState) => {
    let client = messengerClient(getState())
    if (!client) {
      if (payload.error) {
        payload.error()
      }
      console.log('leancloud Messenger init failed, can\'t get client')
      return new Promise((resolve, reject)=>{
        resolve(null)
      })
    }
    if (payload.type === msgTypes.INQUIRY_CONVERSATION) {
      let wuaiSysDoctor = payload.members.includes(msgTypes.WUAI_SYSTEM_DOCTOR)
      if (!wuaiSysDoctor) {
        payload.members.push(msgTypes.WUAI_SYSTEM_DOCTOR)    // 为了区分问诊或私信的会话，如果是问诊的会话，则插入系统医生所为会话参与者
      }
    }
    return client.createConversation({
      members: payload.members,
      name: payload.name,
      unique: true,
      type: payload.type,   // 会话的类型，可以是问诊（INQUIRY_CONVERSATION），或私信（PERSONAL_CONVERSATION）
      status: 1,
    }).then((conversation) => {
      return Conversation.fromLeancloudConversation(conversation)
    })
  }
}

function setLcConversation(payload) {
  return (dispatch, getState) => {
    let client = messengerClient(getState())
    if (!client) {
      if (payload.error) {
        payload.error()
      }
      console.log('leancloud Messenger init failed, can\'t get client')
      return undefined
    }

    return client.getConversation(payload.conversationId).then((conversation)=> {
      let today = new Date()
      let interval = today.getTime() - conversation.createdAt.getTime()
      if (interval > 1 * 3600 * 1000){ //快速问诊24小时候后失效
        conversation.set('status', 0)
        return conversation.save()
      }
      return undefined
    }).then((conversation) => {
      if (conversation)
        console.log('setLcConversation', conversation)
        return Conversation.fromLeancloudConversation(conversation)
      return undefined
    }).catch((err) => {
      console.log(err)
    })
  }
}

function createOriginalConversation(payload) {
  return (dispatch, getState) => {
    let client = messengerClient(getState())
    if (!client) {
      if (payload.error) {
        payload.error()
      }
      console.log('leancloud Messenger init failed, can\'t get client')
      return undefined
    }

    let wuaiSysSpeaker = payload.members.includes(msgTypes.WUAI_SYSTEM_SPEAKER)
    if (!wuaiSysSpeaker) {
      payload.members.push(msgTypes.WUAI_SYSTEM_SPEAKER)    // 为了区分通知消息或私信的会话，如果是通知的会话，则插入系统用户为会话参与者
    }

    return client.createConversation({
      members: payload.members,
      name: payload.name,
      unique: true,
      status: 1,
    })
  }
}

function sendLcTypedMessage(payload) {
  return (dispatch, getState) => {
    let client = messengerClient(getState())
    if (!client) {
      if (payload.error) {
        payload.error()
      }
      console.log('leancloud Messenger init failed, can\'t get client')
      return undefined
    }

    return client.getConversation(payload.conversationId).then((conversation)=> {
      switch (payload.type) {
        case msgTypes.MSG_IMAGE:
          return sendImageMessage(conversation, payload)

        case msgTypes.MSG_AUDIO:
          return sendAudioMessage(conversation, payload)

        case msgTypes.MSG_TEXT:
        default:
          return sendTextMessage(conversation, payload)
      }
    })
  }
}

function onReceiveMsg(message, conversation) {
  return (dispatch, getState) => {
    let msgType = message.type
    if (msgType === msgTypes.MSG_TEXT || msgType === msgTypes.MSG_AUDIO || msgType === msgTypes.MSG_IMAGE) {
      dispatch(onRecvNormalMessage(message, conversation))
    }
    if (msgType === msgTypes.MSG_ARTICLE_COMMENT
      || msgType === msgTypes.MSG_TOPIC_COMMENT
      || msgType === msgTypes.MSG_SHOP_COMMENT
      || msgType === msgTypes.MSG_ARTICLE_LIKE
      || msgType === msgTypes.MSG_TOPIC_LIKE
      || msgType === msgTypes.MSG_SHOP_LIKE
      || msgType === msgTypes.MSG_USER_FOLLOW
      || msgType === msgTypes.MSG_SHOP_FOLLOW
      || msgType === msgTypes.MSG_PUBLISH_SHOP_PROMOTION
      || msgType === msgTypes.MSG_SYSTEM) {
      dispatch(onRecvNotifyMessage(message, conversation))
    }
  }
}

function onRecvNormalMessage(message, conversation) {
  return (dispatch, getState) => {
    dispatch(onRecvMessage({
      message: Message.fromLeancloudMessage(message),
      conversation: Conversation.fromLeancloudConversation(conversation)
    }))
  }
}

export function clearNotifyMsg(payload) {
  return (dispatch, getState) => {
    let noticeType = payload.noticeType
    let action = createAction(msgTypes.CLEAR_NOTIFY_MSG)
    dispatch(action({
      noticeType: noticeType
    }))

    if(payload.success) {
      payload.success()
    }
  }
}

function onRecvNotifyMessage(message, conversation) {
  return (dispatch, getState) => {
    let msgType = message.type
    let addNotifyMsg = createAction(msgTypes.ADD_NOTIFY_MSG)
    if (msgType === msgTypes.MSG_TOPIC_COMMENT) {
      dispatch(addNotifyMsg({
        message: TopicCommentMsg.fromLeancloudMessage(message),
        conversation: Conversation.fromLeancloudConversation(conversation)
      }))
    } else if (msgType === msgTypes.MSG_SHOP_COMMENT) {
      dispatch(addNotifyMsg({
        message: ShopCommentMsg.fromLeancloudMessage(message),
        conversation: Conversation.fromLeancloudConversation(conversation)
      }))
    } else if (msgType === msgTypes.MSG_TOPIC_LIKE) {
      dispatch(addNotifyMsg({
        message: TopicLikeMsg.fromLeancloudMessage(message),
        conversation: Conversation.fromLeancloudConversation(conversation)
      }))
    } else if (msgType === msgTypes.MSG_SHOP_LIKE) {
      dispatch(addNotifyMsg({
        message: ShopLikeMsg.fromLeancloudMessage(message),
        conversation: Conversation.fromLeancloudConversation(conversation)
      }))
    } else if (msgType === msgTypes.MSG_USER_FOLLOW) {
      dispatch(addNotifyMsg({
        message: UserFollowMsg.fromLeancloudMessage(message),
        conversation: Conversation.fromLeancloudConversation(conversation)
      }))
    } else if (msgType === msgTypes.MSG_SHOP_FOLLOW) {
      dispatch(addNotifyMsg({
        message: ShopFollowMsg.fromLeancloudMessage(message),
        conversation: Conversation.fromLeancloudConversation(conversation)
      }))
    } else if(msgType === msgTypes.MSG_PUBLISH_SHOP_PROMOTION) {
      dispatch(addNotifyMsg({
        message: PublishShopPromotionMsg.fromLeancloudMessage(message),
        conversation: Conversation.fromLeancloudConversation(conversation)
      }))
    }
  }
}

function sendTextMessage(conversation, payload) {
  let message = new TextMessage()
  message.setText(payload.text)
  return conversation.send(message).then((msg)=> {
    return Message.fromLeancloudMessage(msg, payload)
  })
}

function sendImageMessage(conversation, payload) {
  let message = new ImageMessage()
  message.setText(payload.text)
  let file = new AV.File(payload.fileName, {blob: {uri: payload.uri}})
  return file.save().then((savedFile)=> {
    message.setAttributes({
      'mediaId': savedFile.attributes.url
    })
    return conversation.send(message)
  }).then((message)=> {
    return Message.fromLeancloudMessage(message, payload)
  })
}

function sendAudioMessage(conversation, payload) {
  let message = new AudioMessage()
  message.setText(payload.text)
  let file = new AV.File(payload.fileName, {blob: {uri: payload.uri}})
  return file.save().then((savedFile)=> {
    message.setAttributes({
      'mediaId': savedFile.attributes.url,
      'duration': payload.duration
    })
    return conversation.send(message)
  }).then((message)=> {
    return Message.fromLeancloudMessage(message, payload)
  })
}

function createTypedMessage(msgType) {
  switch (msgType) {
    case msgTypes.MSG_ARTICLE_COMMENT:
      return new ArticleCommentMessage()
    case msgTypes.MSG_ARTICLE_LIKE:
      return new ArticleLikeMessage()
    case msgTypes.MSG_TOPIC_COMMENT:
      return new TopicCommentMessage()
    case msgTypes.MSG_TOPIC_LIKE:
      return new TopicLikeMessage()
    case msgTypes.MSG_SHOP_COMMENT:
      return new ShopCommentMessage()
    case msgTypes.MSG_SHOP_LIKE:
      return new ShopLikeMessage()
    case msgTypes.MSG_USER_FOLLOW:
      return new UserFollowMessage()
    case msgTypes.MSG_SHOP_FOLLOW:
      return new ShopFollowMessage()
    case msgTypes.MSG_PUBLISH_SHOP_PROMOTION:
      return new PublishShopPromotioMessage()  
    default:
      return new TextMessage()
  }
}

export function notifyTopicComment(payload) {
  return (dispatch, getState) => {
    let toPeers = []
    let topicInfo = getTopicByTopicId(getState(), payload.topicId)
    console.log('topicInfo:', topicInfo)

    let topicCover = ''
    let imgGroup = topicInfo.imgGroup
    if(imgGroup && imgGroup.length) {
      topicCover = imgGroup[0]
    }

    if (payload.replyTo) {
      toPeers.push(payload.replyTo)
    } else {
      toPeers.push(topicInfo.userId)
    }

    let currentUser = activeUserInfo(getState())
    // console.log('currentUser===', currentUser)
    let notifyConv = {
      members: toPeers,   // 可以是一个数组
      unique: true
    }
    dispatch(createOriginalConversation(notifyConv)).then((conversation) => {
      let message = createTypedMessage(msgTypes.MSG_TOPIC_COMMENT)
      let attrs = {
        msgType: msgTypes.MSG_TOPIC_COMMENT,
        userId: currentUser.id,
        nickname: currentUser.nickname,
        avatar: currentUser.avatar,
        topicId: payload.topicId,
        topicCover: topicCover,
        topicAbstract: topicInfo.abstract,
        title: topicInfo.title,
        commentId: payload.commentId,
        commentContent: payload.content,
        commentTime: payload.commentTime
      }
      console.log("topic attrs:", attrs)
      let text = currentUser.nickname + '在您的话题《' + topicInfo.title + '》中发表了评论'
      message.setText(text)
      message.setAttributes(attrs)
      conversation.send(message)
    }, (err) => {
      console.log(err)
    })
  }
}

export function notifyPublishShopPromotion(payload) {
  return (dispatch, getState) => {
    let toPeers = []
    let shopId = payload.shopId
    let shopDetail = selectShopDetail(getState(), shopId)
    if (!shopDetail) {
      console.log('can\'t find shop by shop id ' + shopId)
      return
    }

    lcShop.fetchAllShopFollowerIds({id: shopId}).then((shopFollowerIds) => {
      // console.log('shopFollowerIds===', shopFollowerIds)
      toPeers = shopFollowerIds

      let currentUser = activeUserInfo(getState())
      let notifyConv = {
        members: toPeers, // 可以是一个数组
        unique: true
      }
      dispatch(createOriginalConversation(notifyConv)).then((conversation) => {
        let message = createTypedMessage(msgTypes.MSG_PUBLISH_SHOP_PROMOTION)
        let attrs = {
          msgType: msgTypes.MSG_PUBLISH_SHOP_PROMOTION,
          userId: currentUser.id,
          nickname: currentUser.nickname,
          avatar: currentUser.avatar,
          shopId: shopId,
          shopName: shopDetail.shopName,
          shopPromotionId: payload.shopPromotionId,
          shopPromotionCoverUrl: payload.shopPromotionCoverUrl,
          shopPromotionTitle: payload.shopPromotionTitle,
          shopPromotionType: payload.shopPromotionType,
          shopPromotionTypeDesc: payload.shopPromotionTypeDesc,
        }
        // console.log('attrs--------', attrs)
        message.setText('发布了新活动')
        message.setAttributes(attrs)
        conversation.send(message)
      }, (err) => {
        console.log('createOriginalConversation==err===', err)
      })
    }, (error) => {
      console.log('fetchAllShopFollowerIds=error===', error)
    })
  }
}

export function notifyShopComment(payload) {
  return (dispatch, getState) => {
    let toPeers = []
    let shopId = payload.shopId
    let shopDetail = selectShopDetail(getState(), shopId)
    if (!shopDetail) {
      console.log('can\'t find shop by shop id ' + shopId)
      return
    }

    if (payload.replyTo) {
      toPeers.push(payload.replyTo)
    } else {
      toPeers.push(shopDetail.owner.id)
    }

    let currentUser = activeUserInfo(getState())
    let notifyConv = {
      members: toPeers,   // 可以是一个数组
      unique: true
    }
    dispatch(createOriginalConversation(notifyConv)).then((conversation) => {
      let message = createTypedMessage(msgTypes.MSG_SHOP_COMMENT)
      let attrs = {
        msgType: msgTypes.MSG_SHOP_COMMENT,
        userId: currentUser.id,
        nickname: currentUser.nickname,
        avatar: currentUser.avatar,
        shopId: shopId,
        commentId: payload.commentId,
        commentContent: payload.content,
        replyId: payload.replyId,
        replyContent: payload.replyContent
      }
      // console.log('payload.replyId===', payload.replyId)
      let text = currentUser.nickname + '在您的店铺中发表了评论'
      if(payload.replyId) {
        text = currentUser.nickname + '在' + shopDetail.shopName + '店铺中回复了您的评论'
      }
      message.setText(text)
      message.setAttributes(attrs)
      conversation.send(message)
    }, (err) => {
      console.log(err)
    })
  }
}

export function notifyTopicLike(payload) {
  return (dispatch, getState) => {
    let topicInfo = getTopicByTopicId(getState(), payload.topicId)
    let currentUser = activeUserInfo(getState())
    let notifyConv = {
      members: [topicInfo.userId],   // 可以是一个数组
      unique: true
    }
    dispatch(createOriginalConversation(notifyConv)).then((conversation) => {
      let message = createTypedMessage(msgTypes.MSG_TOPIC_LIKE)
      let attrs = {
        msgType: msgTypes.MSG_TOPIC_LIKE,
        userId: currentUser.id,
        nickname: currentUser.nickname,
        avatar: currentUser.avatar,
        topicId: payload.topicId,
        title: topicInfo.title,
      }
      let text = currentUser.nickname + '在您的文章《' + topicInfo.title + '》中点了赞'
      message.setText(text)
      message.setAttributes(attrs)
      conversation.send(message)
    }, (err) => {
      console.log(err)
    })
  }
}

export function notifyShopLike(payload) {
  return (dispatch, getState) => {
    let shopId = payload.shopId
    let shopDetail = selectShopDetail(getState(), shopId)
    if (!shopDetail) {
      console.log('can\'t find shop by shop id ' + shopId)
      return
    }
    let currentUser = activeUserInfo(getState())
    let notifyConv = {
      members: [shopDetail.owner.id],
      unique: true
    }
    dispatch(createOriginalConversation(notifyConv)).then((conversation) => {
      let message = createTypedMessage(msgTypes.MSG_SHOP_LIKE)
      let attrs = {
        msgType: msgTypes.MSG_SHOP_LIKE,
        userId: currentUser.id,
        nickname: currentUser.nickname,
        avatar: currentUser.avatar,
        shopId: shopId,
      }
      let text = currentUser.nickname + '在您的店铺中点了赞'
      message.setText(text)
      message.setAttributes(attrs)
      conversation.send(message)
    }, (err) => {
      console.log(err)
    })
  }
}

export function notifyUserFollow(payload) {
  return (dispatch, getState) => {
    let currentUser = activeUserInfo(getState())
    let notifyConv = {
      members: [payload.toPeers],   // 可以是一个数组
      unique: true
    }
    dispatch(createOriginalConversation(notifyConv)).then((conversation) => {
      let message = createTypedMessage(msgTypes.MSG_USER_FOLLOW)
      let attrs = {
        msgType: msgTypes.MSG_USER_FOLLOW,
        userId: currentUser.id,
        nickname: currentUser.nickname,
        avatar: currentUser.avatar,
      }
      let text = currentUser.nickname + '关注了您'
      message.setText(text)
      message.setAttributes(attrs)
      conversation.send(message)
    }, (err) => {
      console.log(err)
    })
  }
}

export function notifyShopFollow(payload) {
  return (dispatch, getState) => {
    let shopId = payload.shopId
    let shopDetail = selectShopDetail(getState(), shopId)
    if (!shopDetail) {
      console.log('can\'t find shop by shop id ' + shopId)
      return
    }
    let currentUser = activeUserInfo(getState())
    let notifyConv = {
      members: [shopDetail.owner.id],   // 可以是一个数组
      unique: true
    }
    dispatch(createOriginalConversation(notifyConv)).then((conversation) => {
      let message = createTypedMessage(msgTypes.MSG_SHOP_FOLLOW)
      let attrs = {
        msgType: msgTypes.MSG_SHOP_FOLLOW,
        userId: currentUser.id,
        nickname: currentUser.nickname,
        avatar: currentUser.avatar,
        shopId: shopId,
      }
      let text = currentUser.nickname + '关注了您的店铺'
      message.setText(text)
      message.setAttributes(attrs)
      conversation.send(message)
    }, (err) => {
      console.log(err)
    })
  }
}

export function updateConversationStatus(payload) {
  return (dispatch, getState) => {
    dispatch(setLcConversation(payload)).then((conversation) => {
      if (conversation)
        dispatch(onUpdateConversation(conversation))
    }).catch((error) => {
      console.log('failed to create conversation: ', error)
    })
  }
}