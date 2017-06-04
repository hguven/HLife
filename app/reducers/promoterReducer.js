/**
 * Created by yangyang on 2017/3/27.
 */
import {Record, Map, List} from 'immutable'
import {REHYDRATE} from 'redux-persist/constants'
import {
  Promoter,
  AreaAgent,
  EarnRecord,
  DailyPerformance,
  MonthlyPerformance,
  PromoterInfo,
  PromoterStatistics,
} from '../models/promoterModel'
import * as promoterActionTypes from '../constants/promoterActionTypes'

const initialState = Promoter()

export default function promoterReducer(state = initialState, action) {
  switch (action.type) {
    case promoterActionTypes.GENERATE_INVITE_CODE:
      return handleGenerateInviteCode(state, action)
    case promoterActionTypes.CLEAR_INVITE_CODE:
      return handleClearInviteCode(state, action)
    case promoterActionTypes.SET_ACTIVE_PROMOTER:
      return handleSetActivePromoter(state, action)
    case promoterActionTypes.SET_USER_PROMOTER_MAP:
      return handleSetUserPromoterMap(state, action)
    case promoterActionTypes.SET_USER_PROMOTER_BATCH_MAP:
      return handleSetUserPromoterBatchMap(state, action)
    case promoterActionTypes.UPDATE_PROMOTER_INFO:
      return handleUpdatePromoter(state, action)
    case promoterActionTypes.UPDATE_BATCH_PROMOTER_INFO:
      return handleUpdateBatchPromoters(state, action)
    case promoterActionTypes.UPDATE_TENANT_FEE:
      return handleUpdateTenant(state, action)
    case promoterActionTypes.UPDATE_UPPROMOTER_ID:
      return handleUpdateUpPromoter(state, action)
    case promoterActionTypes.SET_PROMOTER_TEAM:
      return handleSetPromoterTeam(state, action)
    case promoterActionTypes.ADD_PROMOTER_TEAM:
      return handleAddPromoterTeam(state, action)
    case promoterActionTypes.SET_PROMOTER_SHOPS:
      return handleSetPromoterShops(state, action)
    case promoterActionTypes.ADD_PROMOTER_SHOPS:
      return handleAddPromoterShops(state, action)
    case promoterActionTypes.UPDATE_PROMOTER_PERFORMANCE:
      return handleUpdateTotalPerformance(state, action)
    case promoterActionTypes.UPDATE_AREA_AGENTS:
      return handleUpdateAreaAgents(state, action)
    case promoterActionTypes.SET_AREA_AGENT:
      return handleSetAreaAgent(state, action)
    case promoterActionTypes.CANCEL_AREA_AGENT:
      return handleCancelAreaAgent(state, action)
    case promoterActionTypes.UPDATE_CITY_SHOP_TENANT:
      return handleUpdateShopTenant(state, action)
    case promoterActionTypes.UPDATE_BATCH_CITY_SHOP_TENANT:
      return handleUpdateBatchShopTenant(state, action)
    case promoterActionTypes.SET_AREA_PROMOTERS:
      return handleSetAreaPromoters(state, action)
    case promoterActionTypes.ADD_AREA_PROMOTERS:
      return handleAddAreaPromoters(state, action)
    case promoterActionTypes.SET_PROMOTER_EARN_RECORDS:
      return handleSetEarnRecords(state, action)
    case promoterActionTypes.ADD_PROMOTER_EARN_RECORDS:
      return handleAddEarnRecords(state, action)
    case promoterActionTypes.UPDATE_LAST_DAYS_PERFORMANCE:
      return handleLastDaysPerformance(state, action)
    case promoterActionTypes.UPDATE_AREA_MONTHS_PERFORMANCE:
      return handleAreaMonthsPerformance(state, action)
    case promoterActionTypes.FINISH_PROMOTER_PAYMENT:
      return handleFinishPromoterPayment(state, action)
    case REHYDRATE:
      return onRehydrate(state, action)
    default:
      return state
  }
}

function handleGenerateInviteCode(state, action) {
  let code = action.payload.code
  state = state.set('inviteCode',  code)
  return state
}

function handleClearInviteCode(state, action) {
  state = state.set('inviteCode', undefined)
  return state
}

function handleSetActivePromoter(state, action) {
  let promoterId = action.payload.promoterId
  state = state.set('activePromoter', promoterId)
  return state
}

function handleSetUserPromoterMap(state, action) {
  let userId = action.payload.userId
  let promoterId = action.payload.promoterId
  state = state.setIn(['userToPromoter', userId], promoterId)
  return state
}

function handleSetUserPromoterBatchMap(state, action) {
  let payload = action.payload
  let userIds = payload.userIds
  let promoterIds = payload.promoterIds
  if (userIds.length != promoterIds.length) {
    return state
  }
  userIds.forEach((userId, index) => {
    state = state.setIn(['userToPromoter', userId], promoterIds[index])
  })
  return state
}

function handleUpdatePromoter(state, action) {
  let promoterId = action.payload.promoterId
  let promoter = action.payload.promoter
  state = state.setIn(['promoters', promoterId], promoter)
  return state
}

function handleUpdateBatchPromoters(state, action) {
  let promoters = action.payload.promoters
  promoters.forEach((promoter) => {
    let promoterId = promoter.id
    state = state.setIn(['promoters', promoterId], promoter)
  })
  return state
}

function handleUpdateTenant(state, action) {
  let tenant = action.payload.tenant
  state = state.set('fee', tenant)
  return state
}

function handleUpdateUpPromoter(state, action) {
  let upPromoterId = action.payload.upPromoterId
  state = state.set('upPromoterId', upPromoterId)
  return state
}

function handleSetPromoterTeam(state, action) {
  let team = action.payload.team
  let promoterId = action.payload.promoterId
  state = state.setIn(['team', promoterId], new List(team))
  return state
}

function handleAddPromoterTeam(state, action) {
  let newTeam = action.payload.newTeam
  let promoterId = action.payload.promoterId
  let team = state.getIn(['team', promoterId])
  state = state.setIn(['team', promoterId], team.concat(new List(newTeam)))
  return state
}

function handleSetPromoterShops(state, action) {
  let shops = action.payload.shops
  let promoterId = action.payload.promoterId
  state = state.setIn(['invitedShops', promoterId], new List(shops))
  return state
}

function handleAddPromoterShops(state, action) {
  let newShops = action.payload.newShops
  let promoterId = action.payload.promoterId
  let shops = state.getIn(['invitedShops', promoterId])
  state = state.setIn(['invitedShops', promoterId], shops.concat(new List(newShops)))
  return state
}

function handleUpdateTotalPerformance(state, action) {
  let area = action.payload.area
  let statistics = action.payload.statistics
  state = state.setIn(['statistics', area], statistics)
  return state
}

function handleUpdateAreaAgents(state, action) {
  let agentsSet = action.payload.agentsSet
  let mapArray = []
  agentsSet.forEach((agent) => {
    let agentRecord = new AreaAgent({
      area: agent.area,
      tenant: agent.tenant,
      promoterId: agent.promoterId,
      userId: agent.userId,
    })
    mapArray.push(agentRecord)
  })
  state = state.set('areaAgents', List(mapArray))
  return state
}

function handleSetAreaAgent(state, action) {
  let area = action.payload.area
  let promoter = action.payload.promoter
  let areaAgents = state.get('areaAgents')
  let index = areaAgents.findIndex((value) => {
    return area == value.get('area')
  })
  if (index == -1) {
    return state
  }
  areaAgents = areaAgents.update(index, (value) => {
    value = value.set('promoterId', promoter.id)
    value = value.set('userId', promoter.userId)
    return value
  })
  state = state.set('areaAgents', areaAgents)
  return state
}

function handleCancelAreaAgent(state, action) {
  let area = action.payload.area
  let areaAgents = state.get('areaAgents')
  let index = areaAgents.findIndex((value) => {
    return area == value.get('area')
  })
  if (index == -1) {
    return state
  }
  areaAgents = areaAgents.update(index, (value) => {
    value = value.set('promoterId', undefined)
    value = value.set('userId', undefined)
    return value
  })
  state = state.set('areaAgents', areaAgents)
  return state
}

function handleUpdateShopTenant(state, action) {
  let city = action.payload.city
  let tenant = action.payload.tenant
  state = state.setIn(['shopTenant', city], tenant)
  return state
}

function handleUpdateBatchShopTenant(state, action) {
  let payload = action.payload
  let cities = payload.cities
  let tenants = payload.tenants
  cities.forEach((city, index) => {
    state = state.setIn(['shopTenant', city], tenants[index])
  })
  return state
}

function handleSetAreaPromoters(state, action) {
  let promoters = action.payload.promoters
  state = state.set('areaPromoters', new List(promoters))
  return state
}

function handleAddAreaPromoters(state, action) {
  let promoters = action.payload.promoters
  let oldPros = state.get('areaPromoters')
  state = state.set('areaPromoters', oldPros.concat(new List(promoters)))
  return state
}

function handleSetEarnRecords(state, action) {
  let payload = action.payload
  let activePromoterId = payload.activePromoterId
  let dealRecords = payload.dealRecords
  let recordList = []
  dealRecords.forEach((deal) => {
    let record = new EarnRecord({
      cost: deal.cost,
      dealType: deal.dealType,
      promoterId: deal.promoterId,
      shopId: deal.shopId,
      invitedPromoterId: deal.invitedPromoterId,
      userId: deal.userId,
      dealTime: deal.dealTime,
    })
    recordList.push(record)
  })
  state = state.setIn(['dealRecords', activePromoterId], new List(recordList))
  return state
}

function handleAddEarnRecords(state, action) {
  let payload = action.payload
  let activePromoterId = payload.activePromoterId
  let dealRecords = payload.dealRecords
  let recordList = []
  let oldRecords = state.getIn(['dealRecords', activePromoterId])
  dealRecords.forEach((deal) => {
    let record = new EarnRecord({
      cost: deal.cost,
      dealType: deal.dealType,
      promoterId: deal.promoterId,
      shopId: deal.shopId,
      invitedPromoterId: deal.invitedPromoterId,
      userId: deal.userId,
      dealTime: deal.dealTime,
    })
    recordList.push(record)
  })
  state = state.setIn(['dealRecords', activePromoterId], oldRecords.concat(new List(recordList)))
  return state
}

function handleLastDaysPerformance(state, action) {
  let payload = action.payload
  let lastDaysPerf = payload.lastDaysPerf
  let level = payload.level
  let province = payload.province
  let city = payload.city
  let district = payload.district

  let perfs = []
  lastDaysPerf.forEach((stat) => {
    let value = new DailyPerformance({
      level: stat.level,
      province: stat.province,
      city: stat.city,
      district: stat.district,
      earning: stat.earning,
      promoterNum: stat.promoterNum,
      shopNum: stat.shopNum,
      statDate: stat.statDate,
    })
    perfs.push(value)
  })

  let key = constructAreaKey(level, province, city, district)
  state = state.setIn(['lastDaysPerformance', key], new List(perfs))
  return state
}

function handleAreaMonthsPerformance(state, action) {
  let payload = action.payload
  let level = payload.level
  let province = payload.province
  let city = payload.city
  let lastMonthsPerf = payload.lastMonthsPerf

  let perfs = []
  lastMonthsPerf.forEach((monthStat) => {
    let monthPerf = []
    monthStat.forEach((stat) => {
      if (stat) {
        let value = new MonthlyPerformance({
          level: stat.level,
          province: stat.province,
          city: stat.city,
          district: stat.district,
          earning: stat.earning,
          promoterNum: stat.promoterNum,
          shopNum: stat.shopNum,
          year: stat.year,
          month: stat.month
        })
        monthPerf.push(value)
      }
    })
    perfs.push(new List(monthPerf))
  })

  let key = constructAreaKey(level, province, city)
  state = state.setIn(['areaLastMonthsPerformance', key], new List(perfs))

  return state
}

function constructAreaKey(level, province, city, district) {
  let key = ''
  if (level == 3) {
    key = province
  } else if (level == 2) {
    key = province + city
  } else if (level == 1) {
    key = province + city + district
  }
  return key
}

function handleFinishPromoterPayment(state, action) {
  let promoterId = action.payload.promoterId
  let promoter = state.getIn(['promoters', promoterId])
  promoter = promoter.set('payment', 1)
  state = state.setIn(['promoters', promoterId], promoter)
  return state
}

function onRehydrate(state, action) {
  var incoming = action.payload.PROMOTER
  if (!incoming) return state

  if (incoming.activePromoter) {
    state = state.set('activePromoter', incoming.activePromoter)
  }

  if (incoming.upPromoterId) {
    state = state.set('upPromoterId', incoming.upPromoterId)
  }

  if (incoming.inviteCode) {
    state = state.set('inviteCode', incoming.inviteCode)
  }

  if (incoming.userToPromoter) {
    state = state.set('userToPromoter', new Map(incoming.userToPromoter))
  }

  let promoters = new Map(incoming.promoters)
  try {
    for (let [promoterId, promoter] of promoters) {
      if (promoterId && promoter) {
        let promoterInfo = new PromoterInfo({...promoter})
        state = state.setIn(['promoters', promoterId], promoterInfo)
      }
    }
  } catch (e) {
    promoters.clear()
  }

  if (incoming.areaAgents) {
    let areaAgents = incoming.areaAgents
    let rec = []
    for (let areaAgent of areaAgents) {
      let areaAgentRec = new AreaAgent({...areaAgent})
      rec.push(areaAgentRec)
    }
    state = state.set('areaAgents', new List(rec))
  }

  let team = new Map(incoming.team)
  try {
    for (let [promoterId, promoterList] of team) {
      if (promoterId && promoterList) {
        state = state.setIn(['team', promoterId], new List(promoterList))
      }
    }
  } catch (e) {
    team.clear()
  }

  let invitedShops = new Map(incoming.invitedShops)
  try {
    for (let [promoterId, shopList] of invitedShops) {
      if (promoterId && shopList) {
        state = state.setIn(['invitedShops', promoterId], new List(shopList))
      }
    }
  } catch (e) {
    invitedShops.clear()
  }

  let statistics = new Map(incoming.statistics)
  try {
    for (let [areaName, stat] of statistics) {
      if (areaName && stat) {
        let statRecord = new PromoterStatistics({...stat})
        state = state.setIn(['statistics', areaName], statRecord)
      }
    }
  } catch (e) {
    statistics.clear()
  }

  let areaLastMonthsPerf = new Map(incoming.areaLastMonthsPerformance)
  try {
    for (let [areaName, stat] of areaLastMonthsPerf) {
      if (areaName && stat) {
        let rec = []
        for (let areaStat of stat) {
          let statRecord = new MonthlyPerformance({...areaStat})
          rec.push(statRecord)
        }
        state = state.setIn(['areaLastMonthsPerformance', areaName], new List(rec))
      }
    }
  } catch (e) {
    areaLastMonthsPerf.clear()
  }

  let areaLastDaysPerf = new Map(incoming.lastDaysPerformance)
  try {
    for (let [areaName, stat] of areaLastDaysPerf) {
      if (areaName && stat) {
        let rec = []
        for (let areaStat of stat) {
          let statRecord = new DailyPerformance({...areaStat})
          rec.push(statRecord)
        }
        state = state.setIn(['lastDaysPerformance', areaName], new List(rec))
      }
    }
  } catch (e) {
    areaLastDaysPerf.clear()
  }

  let dealRecords = new Map(incoming.dealRecords)
  try {
    for (let [promoterId, dealList] of dealRecords) {
      if (promoterId && dealList) {
        let rec = []
        for (let deal of dealList) {
          let dealRecord = new EarnRecord({...deal})
          rec.push(dealRecord)
        }
        state = state.setIn(['dealRecords', promoterId], new List(rec))
      }
    }
  } catch (e) {
    dealRecords.clear()
  }

  return state
}