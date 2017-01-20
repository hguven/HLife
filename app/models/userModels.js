import {Record, Map, List} from 'immutable'

export const UserInfoRecord = Record({
  id: undefined,
  phone: undefined,
  token: undefined,
  avatar: undefined,
  nickname: undefined,
  gender: undefined,
  birthday: undefined,
  identity: undefined,
}, 'UserInfoRecord')

export const HealthProfileRecord = Record({
  id: undefined,           //健康档案提交用户ID
  nickname: undefined,     //档案用户名
  gender: undefined,       //档案性别
  birthday: undefined,     //档案出生年月
  }, 'HealthProfileRecord')

export const UserStateRecord = Record({
  activeUser: undefined,      // 已登录用户ID
  profiles: Map(),            // 用户个人信息列表，已用户id作为健值
  token: undefined,
  followees: Map(),
  followers: List(),
  followersTotalCount: 0,
  favoriteArticles: Map(),
  healthProfiles: Map(),
  shop: List()
}, 'UserStateRecord')

export const QuestionRecord = Record({
  answerer: undefined,        //接诊医生
  content: undefined,         //问诊内容
  diseaseImages: undefined,   //附图
  quizzer: undefined,         //咨询者
  name: undefined,            //咨询档案姓名
  gender: undefined,          //咨询档案性别
  birthday: undefined,        //咨询档案出生年月
  status: undefined,          //问题状态: 1--打开 0--关闭
}, 'QuestionRecord')

export class UserInfo extends UserInfoRecord {
  static fromLeancloudObject(lcObj) {
    let attrs = lcObj.attributes
    let info = new UserInfoRecord()
    info = info.withMutations((record) => {
      record.set('id', lcObj.id)
      record.set('avatar',lcObj.attributes.avatar)
      record.set('phone', attrs.mobilePhoneNumber)
      record.set('nickname', attrs.nickname)
      record.set('gender', attrs.gender)
      record.set('birthday', attrs.birthday)
      record.set('identity', attrs.identity)
    })
    return info
  }

  static fromLeancloudApi(lcObj) {
    let info = new UserInfoRecord()
    info = info.withMutations((record) => {
      record.set('id', lcObj.id)
      record.set('avatar',lcObj.avatar)
      record.set('phone', lcObj.phone)
      record.set('nickname', lcObj.nickname)
      record.set('gender', lcObj.gender)
      record.set('birthday', lcObj.birthday)
      record.set('identity', new List(lcObj.identity))
    })
    return info
  }

  static fromShopFollowersLeancloudObject(lcObj) {
    let attrs = lcObj.attributes
    let info = new UserInfoRecord()
    info = info.withMutations((record) => {
      let fAttrs = lcObj.attributes.follower.attributes
      record.set('id', lcObj.attributes.follower.id)
      record.set('avatar',fAttrs.avatar)
      record.set('phone', fAttrs.mobilePhoneNumber)
      record.set('nickname', fAttrs.nickname)
      record.set('gender', fAttrs.gender)
      record.set('birthday', fAttrs.birthday)
      record.set('identity', fAttrs.identity)
    })
    return info
  }

}

export class HealthProfile extends HealthProfileRecord{
  static fromLeancloudObject(lcObj) {
    let attrs = lcObj.attributes
    let profile = new HealthProfileRecord()
    profile = profile.withMutations((record) => {
      record.set('id', lcObj.id)
      record.set('nickname', attrs.nickname)
      record.set('gender', attrs.gender)
      record.set('birthday', attrs.birthday)
    })
    return profile
  }
}

export class Question extends QuestionRecord {
  static fromLeancloudObject(lcObj) {
    let attrs = lcObj.attributes
    let question = new QuestionRecord()
    question = question.withMutations((record) => {
      record.set('answerer', attrs.answerer)
      record.set('content', attrs.content)
      record.set('diseaseImages', attrs.diseaseImages)
      record.set('quizzer', attrs.quizzer)
      record.set('name', attrs.name)
      record.set('gender', attrs.gender)
      record.set('birthday', attrs.birthday)
      record.set('status', attrs.status)
    })
  }
}

export class UserState extends UserStateRecord {
  getUserInfoById(userId) {
    const userInfo = this.profiles.get(userId)
    return userInfo ? userInfo : new UserInfo()
  }
}