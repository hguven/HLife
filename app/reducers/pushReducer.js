import {Map, List} from 'immutable'
import {REHYDRATE} from 'redux-persist/constants'
import * as PushActionTypes from '../constants/pushActionTypes'
import {Push} from '../models/PushModels'

const initialState = Push()

export default function pushReducer(state = initialState, action) {
  switch (action.type) {
    case PushActionTypes.UPDATE_LOCAL_DEVICE_TOKEN:
      return handleUpdateLocalDeviceToken(state, action)
    case PushActionTypes.UPDATE_SYSTEM_NOTICE:
      return handleUpdateSystemNotice(state, action)
    case PushActionTypes.UPDATE_SYSTEM_NOTICE_AS_MARK_READED:
      return handleUpdateSystemNoticeAsMarkReaded(state, action)
    case REHYDRATE:
      return onRehydrate(state, action)
    default:
      return state
  }
}

function handleUpdateLocalDeviceToken(state, action) {
  // console.log('handleUpdateLocalDeviceToken.payload===', action)
  let payload = action.payload
  let deviceToken = payload.deviceToken
  state = state.set('deviceToken',  deviceToken)
  return state
}

function handleUpdateSystemNotice(state, action) {
  let payload = action.payload
  let sysNoticeRecord = payload.sysNoticeRecord
  let systemNoticeList = state.systemNoticeList
  let newSystemNoticeList = systemNoticeList.unshift(sysNoticeRecord)
  state = state.set('systemNoticeList', newSystemNoticeList)
  return state
}

function handleUpdateSystemNoticeAsMarkReaded(state, action){
  let payload = action.payload
  let sysNoticeRecord = payload.sysNoticeRecord
  let systemNoticeList = state.systemNoticeList
  systemNoticeList = systemNoticeList.delete(0)
  let newSystemNoticeList = systemNoticeList.unshift(sysNoticeRecord)
  state = state.set('systemNoticeList', newSystemNoticeList)
  return state
}

function onRehydrate(state, action) {
  var incoming = action.payload.CONFIG
  if (!incoming) return state

  return state
}