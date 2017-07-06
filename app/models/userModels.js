import {Record, Map, List} from 'immutable'
import * as numberUtils from '../util/numberUtils'

export const UserInfoRecord = Record({
  id: undefined,
  phone: undefined,
  token: undefined,
  avatar: undefined,
  nickname: undefined,
  gender: undefined,
  birthday: undefined,
  identity: undefined,
  geo: undefined,
  geoProvince: undefined,
  geoProvinceCode: undefined,
  geoCity: undefined,
  geoCityCode: undefined,
  geoDistrict: undefined,
  geoDistrictCode: undefined,
  createdAt: '',
  createdDate: '',
  updatedAt: '',
  updatedDate: '',
  lastLoginDuration: '',
  username: '',
  type: '',
  emailVerified: false,
  status: '',
  mobilePhoneNumber: '',
  mobilePhoneVerified: false,
  detail: {},
  enable: false,
  paymentPassword: undefined,
  isVirtual:0,
  authData: undefined,
  openid: undefined,         //公众号对应的微信openid
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
  followers: Map(),
  followersTotalCount: Map(),
  favoriteArticles: Map(),
  healthProfiles: Map(),
  shop: List(),
  points: Map(),          // 用户积分
}, 'UserStateRecord')

export class UserInfo extends UserInfoRecord {
  static fromLeancloudObject(lcObj, type) {
    let attrs = lcObj.attributes
    if(type) {
      lcObj = attrs[type]
      attrs = attrs[type].attributes
    }

    let info = new UserInfoRecord()
    return info.withMutations((record) => {
      record.set('id', lcObj.id)

      if(lcObj.createdAt) {
        let createdAt = lcObj.createdAt
        let updatedAt = lcObj.updatedAt

        record.set('createdAt', createdAt.valueOf())
        record.set('createdDate', numberUtils.formatLeancloudTime(createdAt, 'YYYY-MM-DD HH:mm:SS'))
        record.set('updatedAt', updatedAt.valueOf())
        record.set('updatedDate', numberUtils.formatLeancloudTime(updatedAt, 'YYYY-MM-DD HH:mm:SS'))
        record.set('lastLoginDuration', numberUtils.getConversationTime(updatedAt))
      }

      record.set('phone', attrs['mobilePhoneNumber'])
      record.set('mobilePhoneNumber', attrs['mobilePhoneNumber'])
      record.set('avatar', attrs['avatar'])
      record.set('nickname', attrs['nickname'])
      record.set('gender', attrs['gender'])
      record.set('birthday', attrs['birthday'])
      record.set('identity', new List(attrs.identity))
      record.set('geo', attrs['geo'])
      record.set('geoProvince', attrs['geoProvince'])
      record.set('geoProvinceCode', attrs['geoProvinceCode'])
      record.set('geoCity', attrs['geoCity'])
      record.set('geoCityCode', attrs['geoCityCode'])
      record.set('geoDistrict', attrs['geoDistrict'])
      record.set('geoDistrictCode', attrs['geoDistrictCode'])
      record.set('username', attrs['username'])
      record.set('emailVerified', attrs['emailVerified'])
      record.set('mobilePhoneVerified', attrs['mobilePhoneVerified'])
      record.set('isVirtual', attrs['isVirtual'])
      record.set('status', attrs['status'])
      record.set('type', attrs['type'])
      record.set('enable', attrs['enable'])
    })
  }

  static fromLeancloudApi(lcObj) {
    let info = new UserInfoRecord()
    info = info.withMutations((record) => {
      for(let key in lcObj) {
        if('identity' == key) {
          record.set('identity', new List(lcObj.identity))
        }else if('mobilePhoneNumber' == key){
          record.set(key, lcObj[key])
          record.set('phone', lcObj[key])
        }else {
          record.set(key, lcObj[key])
        }
      }
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
      record.set('identity', new List(fAttrs.identity))
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

export class UserState extends UserStateRecord {
  getUserInfoById(userId) {
    const userInfo = this.profiles.get(userId)
    return userInfo ? userInfo : new UserInfo()
  }
}