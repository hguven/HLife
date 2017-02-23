/**
 * Created by wuxingyu on 2016/12/24.
 */
import {hidePhoneNumberDetail} from '../util/numberUtils'
import {Map, Record,List} from 'immutable'

export const TopicsConfig = Record({
  content: undefined, //话题内容
  title: undefined,
  abstract:undefined,
  imgGroup: undefined, //图片
  objectId: undefined,  //话题id
  categoryId: undefined,  //属于的分类
  nickname: undefined, //所属用户昵称
  userId:undefined,     // 所属用户的id
  createdAt: undefined,  //创建时间
  avatar: undefined,  //所属用户头像
  commentNum: undefined, //评论数
  likeCount: undefined, //点赞数
  geoPoint: undefined,
  position: undefined,
  likedUsers: undefined  //点赞用户列表
}, 'TopicsConfig')

export class TopicsItem extends TopicsConfig {
  static fromLeancloudObject(lcObj) {
    let topicsConfig = new TopicsConfig()
    let attrs = lcObj.attributes
    let user = lcObj.get('user')
    let nickname = "吾爱用户"
    let avatar = undefined
    let userId = undefined

    //用户昵称解析
    if (user) {
      userId = user.id
      avatar = user.get('avatar')
      nickname = user.get('nickname')
      if (!nickname) {
        let phoneNumber = user.getMobilePhoneNumber()
        nickname = hidePhoneNumberDetail(phoneNumber)
      }
    }
    return topicsConfig.withMutations((record)=> {
      record.set('geoPoint', attrs.geoPoint)
      record.set('position', attrs.position)
      record.set('content', attrs.content)
      record.set('abstract', attrs.abstract)
      record.set('title', attrs.title)
      record.set('imgGroup', attrs.imgGroup)
      record.set('createdAt', lcObj.createdAt.valueOf())
      record.set('categoryId', attrs.category.id)
      record.set('nickname', nickname)
      record.set('avatar', avatar)
      record.set('userId', userId)
      record.set('objectId', lcObj.id)
      record.set('commentNum', attrs.commentNum)
      record.set('likeCount', attrs.likeCount)
    })
  }
}

export const TopicCommentsConfig = Record({
  content: undefined,   //评论内容
  objectId: undefined,  //评论对象id
  nickname: undefined,  //评论用户昵称
  createdAt: undefined, //评论创建时间
  avatar: undefined,    //评论用户头像
  userId:undefined, //评论用户id
  likeCount:undefined,
  geoPoint: undefined,
  position: undefined,
  parentCommentContent: undefined,  //父评论正文
  parentCommentUser: undefined,     //父评论的作者昵称
}, 'TopicCommentsConfig')

export class TopicCommentsItem extends TopicCommentsConfig {
  static fromLeancloudObject(lcObj) {
    let topicCommentsConfig = new TopicCommentsConfig()
    let attrs = lcObj.attributes
    let user = lcObj.get('user')
    let nickname = "吾爱用户"
    let avatar = undefined

    //用户昵称解析
    if (user) {
      avatar = user.get('avatar')
      nickname = user.get('nickname')
      if (!nickname) {
        let phoneNumber = user.getMobilePhoneNumber()
        nickname = hidePhoneNumberDetail(phoneNumber)
      }
    }

    let parentUserPoint = undefined
    let parentCommentUser = "吾爱用户"

    //有父评论的情况下
    if (attrs.parentComment) {
      parentUserPoint = attrs.parentComment.attributes.user
      //父用户昵称解析
      if (parentUserPoint) {
        parentCommentUser = parentUserPoint.get('nickname')
        if (!parentCommentUser) {
          let phoneNumber = parentUserPoint.getMobilePhoneNumber()
          parentCommentUser = hidePhoneNumberDetail(phoneNumber)
        }
      }
    }
    return topicCommentsConfig.withMutations((record)=> {
      record.set('content', attrs.content)
      record.set('likeCount', attrs.likeCount?attrs.likeCount:0)
      record.set('createdAt', lcObj.createdAt.valueOf())
      record.set('nickname', nickname)
      record.set('avatar', avatar)
      record.set('objectId', lcObj.id)
      record.set('userId', user.id)
      record.set('geoPoint', attrs.geoPoint)
      record.set('position', attrs.position)
      //有父评论的情况下设置
      if (attrs.parentComment) {
        record.set('parentCommentContent', attrs.parentComment.attributes.content)
        record.set('parentCommentUser', parentCommentUser)
      }
    })
  }
}

export const TopicLikeUserConfig = Record({
  nickname: undefined, //所属用户昵称
  userId:undefined,
  createdAt: undefined,  //创建时间
  avatar: undefined,  //用户头像
}, 'TopicLikeUserConfig')

export class TopicLikeUser extends TopicLikeUserConfig {
  static fromLeancloudObject(lcObj) {
    let topicLikeUserConfig = new TopicLikeUserConfig()
    let user = lcObj.get('user')
    let nickname = "吾爱用户"
    let avatar = undefined
    let userId = undefined

    //用户昵称解析
    if (user) {
      userId = user.id
      avatar = user.get('avatar')
      nickname = user.get('nickname')
      if (!nickname) {
        let phoneNumber = user.getMobilePhoneNumber()
        nickname = hidePhoneNumberDetail(phoneNumber)
      }
    }

    return topicLikeUserConfig.withMutations((record)=> {
      record.set('createdAt', lcObj.createdAt)
      record.set('nickname', nickname)
      record.set('avatar', avatar)
      record.set('userId', userId)
    })
  }
}

export const Topic = Record({
  city:undefined,
  topics:Map(),
  myTopics:List(),
  pickedTopics:List(),
  userTopics: Map(),
  allTopics:List(),
  localTopics:List(),
  topicComments:Map(),
  TopicLikesNum: Map(),
  TopicLikeUsers: Map(),
  IsLikedByCurrentUser: Map(),
}, 'Topic')
