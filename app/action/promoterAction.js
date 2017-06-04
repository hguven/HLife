/**
 * Created by yangyang on 2017/3/24.
 */
import {createAction} from 'redux-actions'
import * as uiTypes from '../constants/uiActionTypes'
import * as promoterActionTypes from '../constants/promoterActionTypes'
import * as lcAuth from '../api/leancloud/auth'
import * as lcPromoter from '../api/leancloud/promoter'
import * as shopActionTypes from '../constants/shopActionTypes'
import {getInputFormData, isInputFormValid, getInputData, isInputValid} from '../selector/inputFormSelector'
import {activeUserId, activeUserInfo} from '../selector/authSelector'
import {calRegistPromoter} from '../action/pointActions'
import {IDENTITY_PROMOTER} from '../constants/appConfig'
import * as AuthTypes from '../constants/authActionTypes'
import {PromoterInfo, PromoterStatistics} from '../models/promoterModel'
import {UserInfo} from '../models/userModels'
import {ShopInfo} from '../models/shopModel'
import {activePromoter, getPromoterById} from '../selector/promoterSelector'

let formCheck = createAction(uiTypes.INPUTFORM_VALID_CHECK)
const addIdentity = createAction(AuthTypes.ADD_PERSONAL_IDENTITY)
let certificatePromoter = createAction(promoterActionTypes.CERTIFICATE_PROMOTER)
let setActivePromoter = createAction(promoterActionTypes.SET_ACTIVE_PROMOTER)
let updatePromoter = createAction(promoterActionTypes.UPDATE_PROMOTER_INFO)
let updateBatchPromoter = createAction(promoterActionTypes.UPDATE_BATCH_PROMOTER_INFO)
let updateTenant = createAction(promoterActionTypes.UPDATE_TENANT_FEE)
let addUserProfile = createAction(AuthTypes.ADD_USER_PROFILE)
let addUserBatchProfile = createAction(AuthTypes.ADD_USER_PROFILES)
let updateUpPromoter = createAction(promoterActionTypes.UPDATE_UPPROMOTER_ID)
let setPromoterTeam = createAction(promoterActionTypes.SET_PROMOTER_TEAM)
let addPromoterTeam = createAction(promoterActionTypes.ADD_PROMOTER_TEAM)
let addShopDetail = createAction(shopActionTypes.FETCH_SHOP_DETAIL_SUCCESS)
let addBatchShopDetail = createAction(shopActionTypes.FETCH_BATCH_SHOP_DETAIL)
let addPromoterShops = createAction(promoterActionTypes.ADD_PROMOTER_SHOPS)
let setPromoterShops = createAction(promoterActionTypes.SET_PROMOTER_SHOPS)
let setUserPromoterMap = createAction(promoterActionTypes.SET_USER_PROMOTER_MAP)
let setUserPromoterBatchMap = createAction(promoterActionTypes.SET_USER_PROMOTER_BATCH_MAP)
let updateStatistics = createAction(promoterActionTypes.UPDATE_PROMOTER_PERFORMANCE)
let updateAreaAgent = createAction(promoterActionTypes.UPDATE_AREA_AGENTS)
let updateShopTenant = createAction(promoterActionTypes.UPDATE_CITY_SHOP_TENANT)
let updateBatchShopTenant = createAction(promoterActionTypes.UPDATE_BATCH_CITY_SHOP_TENANT)
let setAreaPromoters = createAction(promoterActionTypes.SET_AREA_PROMOTERS)
let addAreaPromoters = createAction(promoterActionTypes.ADD_AREA_PROMOTERS)
let setAreaAgent = createAction(promoterActionTypes.SET_AREA_AGENT)
let cancelAreaAgent = createAction(promoterActionTypes.CANCEL_AREA_AGENT)
let setEarnRecords = createAction(promoterActionTypes.SET_PROMOTER_EARN_RECORDS)
let addEarnRecords = createAction(promoterActionTypes.ADD_PROMOTER_EARN_RECORDS)
let updateLastDaysPerformance = createAction(promoterActionTypes.UPDATE_LAST_DAYS_PERFORMANCE)
let updateAreaMonthsPerformance = createAction(promoterActionTypes.UPDATE_AREA_MONTHS_PERFORMANCE)
let finishPayment = createAction(promoterActionTypes.FINISH_PROMOTER_PAYMENT)

export function getInviteCode(payload) {
  return (dispatch, getState) => {
    lcPromoter.generateInviteCode().then((code) => {
      if (code.status == 0) {
        let generateInviteCode = createAction(promoterActionTypes.GENERATE_INVITE_CODE)
        dispatch(generateInviteCode({code: code.result}))
      } else {
        if (payload.error) {
          payload.error({message: '生成验证码失败，请重新生成！'})
        }
      }
    })
  }
}

export function clearInviteCode() {
  return (dispatch, getState) => {
    let clearCode = createAction(promoterActionTypes.CLEAR_INVITE_CODE)
    dispatch(clearCode())
  }
}

export function promoterCertification(payload) {
  return (dispatch, getState) => {
    dispatch(formCheck({formKey: payload.formKey}))
    let isFormValid = isInputFormValid(getState(), payload.formKey)
    if (!isFormValid.isValid) {
      if (payload.error) {
        payload.error({message: isFormValid.errMsg})
      }
      return
    }
    let formData = getInputFormData(getState(), payload.formKey)
    let region = formData.regionPicker.text
    let promoterInfo = {
      inviteCode: formData.inviteCodeInput.text,
      phone: formData.phoneInput.text,
      liveProvince: region.province,
      liveCity: region.city,
      liveDistrict: region.district,
    }
    lcPromoter.promoterCertification(promoterInfo).then((promoterInfo) => {
      let promoterId = promoterInfo.promoter.objectId
      let promoter = PromoterInfo.fromLeancloudObject(promoterInfo.promoter)
      dispatch(addIdentity({identity: IDENTITY_PROMOTER}))
      dispatch(setActivePromoter({promoterId}))
      dispatch(updatePromoter({promoterId, promoter}))
      return promoterId
    }).then((promoterId) => {
      let userId = activeUserId(getState())
      dispatch(calRegistPromoter({userId}))   // 计算注册成为推广员的积分
      if (payload.success) {
        payload.success({promoterId})
      }
    }).catch((error) => {
      if (payload.error) {
        payload.error(error)
      }
    })
  }
}

export function getCurrentPromoter(payload) {
  return (dispatch, getState) => {
    let userId = activeUserId(getState())
    lcPromoter.fetchPromterByUser({userId}).then((promoterInfo) => {
      if (promoterInfo.errcode != 0) {
        if (payload.error) {
          payload.error(promoterInfo.message)
        }
        return
      }
      let promoterId = promoterInfo.promoter.objectId
      let promoter = PromoterInfo.fromLeancloudObject(promoterInfo.promoter)
      dispatch(setActivePromoter({promoterId}))
      dispatch(updatePromoter({promoterId, promoter}))
      dispatch(setUserPromoterMap({userId: activeUserId(getState()), promoterId: promoterId}))
    }).catch((error) => {
      if (payload.error) {
        payload.error(error)
      }
    })
  }
}

export function getPromoterByUserId(payload) {
  return (dispatch, getState) => {
    let userId = payload.userId
    lcPromoter.fetchPromterByUser({userId}).then((promoterInfo) => {
      if (promoterInfo.errcode != 0) {
        if (payload.error) {
          payload.error(promoterInfo.message)
        }
        return
      }
      let promoterId = promoterInfo.promoter.objectId
      let promoter = PromoterInfo.fromLeancloudObject(promoterInfo.promoter)
      dispatch(updatePromoter({promoterId, promoter}))
      dispatch(setUserPromoterMap({userId, promoterId}))
    }).catch((error) => {
      if (payload.error) {
        payload.error(error)
      }
    })
  }
}

export function getShopTenant(payload) {
  return (dispatch, getState) => {
    lcPromoter.getShopTenantFee(payload).then((tenant) => {
      dispatch(updateTenant({tenant}))
      if(payload.success) {
        payload.success(tenant)
      }
    }, (error)=>{
      if(payload.error) {
        payload.error(error)
      }
    })
  }
}

export function getPromoterTenant(payload) {
  return (dispatch, getState) => {
    lcPromoter.getPormoterTenant(payload).then((tenant) => {
      dispatch(updateTenant({tenant}))
    })
  }
}

export function getMyUpPromoter(payload) {
  return (dispatch, getState) => {
    let userId = activeUserId(getState())
    lcPromoter.getUpPromoter({userId}).then((promoterInfo) => {
      if (promoterInfo.errcode != 0) {
        return
      }
      let promoterId = promoterInfo.promoter.objectId
      let promoter = PromoterInfo.fromLeancloudObject(promoterInfo.promoter)
      let userInfo = UserInfo.fromLeancloudApi(promoterInfo.user)
      dispatch(addUserProfile({userInfo}))
      dispatch(updatePromoter({promoterId, promoter}))
      dispatch(updateUpPromoter({upPromoterId: promoterId}))
      dispatch(setUserPromoterMap({userId: promoterInfo.user.id, promoterId}))
    })
  }
}

export function getMyPromoterTeam(payload) {
  return (dispatch, getState) => {
    let more = payload.more
    if (!more) {
      more = false
    }
    lcPromoter.getMyPromoterTeam(payload).then((result) => {
      let team = []
      let userIds = []
      let promoterIds = []
      let promoters = result.promoters
      let users = result.users
      promoters.forEach((promoter) => {
        let promoterId = promoter.objectId
        let promoterRecord = PromoterInfo.fromLeancloudObject(promoter)
        team.push(promoterRecord)
        userIds.push(promoter.user.id)
        promoterIds.push(promoterId)
      })
      dispatch(updateBatchPromoter({promoters: team}))
      dispatch(setUserPromoterBatchMap({userIds, promoterIds}))
      let userProfiles = []
      users.forEach((user) => {
        let userInfo = UserInfo.fromLeancloudApi(user)
        userProfiles.push(userInfo)
      })
      dispatch(addUserBatchProfile({userProfiles: userProfiles}))
      if (more) {
        dispatch(addPromoterTeam({promoterId: activePromoter(getState()), newTeam: promoterIds}))
      } else {
        dispatch(setPromoterTeam({promoterId: activePromoter(getState()), team: promoterIds}))
      }
      if (payload.success) {
        payload.success(team.length == 0)
      }
    }).catch((err) => {
      if (payload.error) {
        payload.error(err.message)
      }
    })
  }
}

export function getPromoterTeamById(payload) {
  return (dispatch, getState) => {
    let more = payload.more
    if (!more) {
      more = false
    }
    lcPromoter.getPromoterTeamById(payload).then((result) => {
      let team = []
      let userIds = []
      let promoterIds = []
      let promoters = result.promoters
      let users = result.users
      promoters.forEach((promoter) => {
        let promoterId = promoter.objectId
        let promoterRecord = PromoterInfo.fromLeancloudObject(promoter)
        team.push(promoterRecord)
        userIds.push(promoter.user.id)
        promoterIds.push(promoterId)
      })
      dispatch(updateBatchPromoter({promoters: team}))
      dispatch(setUserPromoterBatchMap({userIds, promoterIds}))
      let userProfiles = []
      users.forEach((user) => {
        let userInfo = UserInfo.fromLeancloudApi(user)
        userProfiles.push(userInfo)
      })
      dispatch(addUserBatchProfile({userProfiles: userProfiles}))
      if (more) {
        dispatch(addPromoterTeam({promoterId: payload.promoterId, newTeam: promoterIds}))
      } else {
        dispatch(setPromoterTeam({promoterId: payload.promoterId, team: promoterIds}))
      }
      if (payload.success) {
        payload.success(team.length == 0)
      }
    }).catch((err) => {
      if (payload.error) {
        payload.error(err.message)
      }
    })
  }
}

export function getMyInvitedShops(payload) {
  return (dispatch, getState) => {
    let more = payload.more
    if (!more) {
      more = false
    }
    lcPromoter.getMyInvitedShops(payload).then((shops) => {
      let shopIds = []
      let shopInfos = []
      shops.forEach((shop) => {
        let shopRecord = ShopInfo.fromLeancloudApi(shop)
        shopIds.push(shop.id)
        shopInfos.push(shopRecord)
      })
      dispatch(addBatchShopDetail({shopInfos: shopInfos}))
      if (more) {
        dispatch(addPromoterShops({promoterId: activePromoter(getState()), newShops: shopIds}))
      } else {
        dispatch(setPromoterShops({promoterId: activePromoter(getState()), shops: shopIds}))
      }
      if (payload.success) {
        payload.success(shopIds.length == 0)
      }
    }).catch((err) => {
      if (payload.error) {
        payload.error(err.message)
      }
    })
  }
}

export function getTotalPerformance(payload) {
  return (dispatch, getState) => {
    lcPromoter.getTotalPerformance(payload).then((performance) => {
      let performanceRecord = PromoterStatistics.fromLeancloudObject(performance)
      dispatch(updateStatistics({area: payload.province + payload.city + payload.district, statistics: performanceRecord}))
    })
  }
}

export function getAreaPromoterAgents(payload) {
  return (dispatch, getState) => {
    lcPromoter.getAreaAgents(payload).then((result) => {
      let agentsSet = []
      let userProfiles = []
      let promoters = []
      let cities = []
      let tenants = []
      let areaAgents = result.areaAgent
      areaAgents.forEach((agent) => {
        let agentObj = {}
        let promoter = agent.promoter
        if (promoter) {
          let promoterId = promoter.objectId
          agentObj.promoterId = promoterId
          let promoterRecord = PromoterInfo.fromLeancloudObject(promoter)
          promoters.push(promoterRecord)
        }
        let user = agent.user
        if (user) {
          agentObj.userId = user.id
          let userInfo = UserInfo.fromLeancloudApi(user)
          userProfiles.push(userInfo)
        }
        agentObj.area = agent.area
        agentObj.tenant = agent.tenant
        agentsSet.push(agentObj)
        cities.push(agent.area)
        tenants.push(agent.tenant)
      })
      dispatch(updateAreaAgent({agentsSet}))
      dispatch(addUserBatchProfile({userProfiles}))
      dispatch(updateBatchPromoter({promoters}))
      dispatch(updateBatchShopTenant({cities, tenants}))
    })
  }
}

export function setShopTenant(payload) {
  return (dispatch, getState) => {
    lcPromoter.setCityShopTenant(payload).then((tenant) => {
      if (0 == tenant.errcode) {
        dispatch(updateShopTenant({city: payload.city, tenant: tenant.tenant.fee}))
        if (payload.success) {
          payload.success()
        }
      } else {
        if (payload.error) {
          payload.error(tenant.message)
        }
      }
    }).catch((err) => {
      if (payload.error) {
        payload.error(err.message)
      }
    })
  }
}

export function getShopTenantByCity(payload) {
  return (dispatch, getState) => {
    lcPromoter.getCityShopTenant(payload).then((tenant) => {
      dispatch(updateShopTenant({city: payload.city, tenant: tenant.tenant}))
    })
  }
}

export function getPromotersByArea(payload) {
  return (dispatch, getState) => {
    let more = payload.more
    if (!more) {
      more = false
    }
    lcPromoter.fetchPromoterByArea(payload).then((result) => {
      let promoters = result.promoters
      let users = result.users
      let promoterIds = []
      let userIds = []
      let team = []
      promoters.forEach((promoter) => {
        let promoterId = promoter.objectId
        let promoterRecord = PromoterInfo.fromLeancloudObject(promoter)
        team.push(promoterRecord)
        promoterIds.push(promoterId)
        userIds.push(promoter.user.id)
      })
      dispatch(updateBatchPromoter({promoters: team}))
      dispatch(setUserPromoterBatchMap({userIds, promoterIds}))
      let userProfiles = []
      users.forEach((user) => {
        let userInfo = UserInfo.fromLeancloudApi(user)
        userProfiles.push(userInfo)
      })
      dispatch(addUserBatchProfile({userProfiles}))
      if (more) {
        dispatch(addAreaPromoters({promoters: promoterIds}))
      } else {
        dispatch(setAreaPromoters({promoters: promoterIds}))
      }

      if (payload.success) {
        payload.success(promoterIds.length == 0)
      }
    }).catch((err) => {
      if (payload.error) {
        payload.error(err.message)
      }
    })
  }
}

export function setAreaAgent(payload) {
  return (dispatch, getState) => {
    lcPromoter.setAreaAgent(payload).then((result) => {
      if (0 != result.errcode) {
        if (payload.error) {
          payload.error(result.message)
        }
        return
      }
      let promoter = getPromoterById(getState(), result.promoter.objectId)
      let area = payload.identity == 2 ? payload.city : payload.district
      dispatch(setAreaAgent({area: area, promoter: promoter}))
      if (payload.success) {
        payload.success()
      }
    }).catch((err) => {
      if (payload.error) {
        payload.error(err.message)
      }
    })
  }
}

export function cancelAreaAgent(payload) {
  return (dispatch, getState) => {
    lcPromoter.cancelAreaAgent(payload).then((result) => {
      if (0 != result.errcode) {
        if (payload.error) {
          payload.error(result.message)
        }
        return
      }
      let area = payload.identity == 2 ? payload.city : payload.district
      dispatch(cancelAreaAgent({area}))
      if (payload.success) {
        payload.success()
      }
    }).catch((err) => {
      if (payload.error) {
        payload.error(err.message)
      }
    })
  }
}

export function getPromoterByNameOrId(payload) {
  return (dispatch, getState) => {
    lcPromoter.fetchPromoterByNameOrId(payload).then((result) => {
      let promoters = result.promoters
      let users = result.users
      let promoterIds = []
      let userIds = []
      let team = []
      promoters.forEach((promoter) => {
        let promoterId = promoter.objectId
        let promoterRecord = PromoterInfo.fromLeancloudObject(promoter)
        team.push(promoterRecord)
        userIds.push(promoter.user.id)
        promoterIds.push(promoterId)
      })
      dispatch(updateBatchPromoter({promoters: team}))
      dispatch(setUserPromoterBatchMap({userIds, promoterIds}))
      let userProfiles = []
      users.forEach((user) => {
        let userInfo = UserInfo.fromLeancloudApi(user)
        userProfiles.push(userInfo)
      })
      dispatch(addUserBatchProfile({userProfiles}))
      dispatch(setAreaPromoters({promoters: promoterIds}))

      if (payload.success) {
        payload.success(promoterIds.length == 0)
      }
    }).catch((err) => {
      if (payload.error) {
        payload.error(err.message)
      }
    })
  }
}

export function getPromoterDealRecords(payload) {
  return (dispatch, getState) => {
    let more = payload.more
    if (!more) {
      more = false
    }
    lcPromoter.fetchPromoterDealRecords(payload).then((result) => {
      let deals = result.dealRecords
      let dealRecords = []
      let shopInfos = []
      let promoters = []
      let userIds = []
      let promoterIds = []
      let userProfiles = []
      deals.forEach((record) => {
        let dealRecord = {}
        dealRecord.cost = record.cost
        dealRecord.promoterId = record.promoterId
        dealRecord.dealType = record.dealType
        dealRecord.dealTime = record.dealTime
        if (record.dealType == 2) {
          dealRecord.shopId = record.shop.objectId
          let shop = record.shop
          let shopRecord = ShopInfo.fromLeancloudApi(shop)
          shopInfos.push(shopRecord)
        } else if (record.dealType == 1) {
          dealRecord.invitedPromoterId = record.promoter.objectId
          dealRecord.userId = record.user.id
          let promoter = record.promoter
          let promoterRecord = PromoterInfo.fromLeancloudObject(promoter)
          promoters.push(promoterRecord)
          userIds.push(promoter.user.id)
          promoterIds.push(record.promoter.objectId)
          let user = record.user
          let userInfo = UserInfo.fromLeancloudApi(user)
          userProfiles.push(userInfo)
        }
        dealRecords.push(dealRecord)
      })
      dispatch(addBatchShopDetail({shopInfos: shopInfos}))
      dispatch(updateBatchPromoter({promoters: promoters}))
      dispatch(setUserPromoterBatchMap({userIds, promoterIds}))
      dispatch(addUserBatchProfile({userProfiles}))
      if (more) {
        dispatch(addEarnRecords({activePromoterId: activePromoter(getState()), dealRecords: dealRecords}))
      } else {
        dispatch(setEarnRecords({activePromoterId: activePromoter(getState()), dealRecords: dealRecords}))
      }
      if (payload.success) {
        payload.success(dealRecords.length == 0)
      }
    }).catch((err) => {
      if (payload.error) {
        payload.error(err.message)
      }
    })
  }
}

export function getLastDaysPerformance(payload) {
  return (dispatch, getState) => {
    lcPromoter.fetchLastDaysPerformance(payload).then((stat) => {
      let statistics = stat.statistics
      dispatch(updateLastDaysPerformance({
        level: payload.level,
        province: payload.province,
        city: payload.city,
        district: payload.district,
        lastDaysPerf: statistics,
      }))
    }).catch((err) => {
      if (payload.error) {
        payload.error(err.message)
      }
    })
  }
}

export function getAreaMonthsPerformance(payload) {
  return (dispatch, getState) => {
    lcPromoter.fetchAreaMonthsPerformance(payload).then((stat) => {
      let statistics = stat.statistics
      dispatch(updateAreaMonthsPerformance({
        level: payload.level,
        province: payload.province,
        city: payload.city,
        lastMonthsPerf: statistics,
      }))
    }).catch((err) => {
      if (payload.error) {
        payload.error(err.message)
      }
    })
  }
}

export function finishPromoterPayment(payload) {
  return (dispatch, getState) => {
    lcPromoter.finishPromoterPayment(payload).then((promoterInfo) => {
      dispatch(finishPayment({promoterId: payload.promoterId}))
    }).catch((err) => {
      if (payload.error) {
        payload.error(err.message)
      }
    })
  }
}