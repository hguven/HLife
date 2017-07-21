import {createAction} from 'redux-actions'
import * as topicActionTypes from '../constants/topicActionTypes'
import * as uiTypes from '../constants/uiActionTypes'
import {getInputFormData, isInputFormValid} from '../selector/inputFormSelector'
import * as lcTopics from '../api/leancloud/topics'
import {notifyTopicComment, notifyTopicLike} from './messageAction'
import * as locSelector from '../selector/locSelector'
import AV from 'leancloud-storage'
import * as pointAction from '../action/pointActions'
import * as ImageUtil from '../util/ImageUtil'
import * as numberUtils from '../util/numberUtils'
import {trim} from '../util/Utils'
import * as newTopicActionTypes from '../constants/newTopicActionTypes'


export const TOPIC_FORM_SUBMIT_TYPE = {
  PUBLISH_TOPICS: 'PUBLISH_TOPICS',
  UPDATE_TOPICS: 'UPDATE_TOPICS',
  PUBLISH_TOPICS_COMMENT: 'PUBLISH_TOPICS_COMMENT',
}

export function fetchUserTopicsTotalCount(payload) {
  return (dispatch, getState) => {
    lcTopics.fetchUserTopicsTotalCount(payload).then((result)=> {
      let updateAction = createAction(topicActionTypes.FETCH_USER_TOPICS_TOTAL_COUNT_SUCCESS)
      dispatch(updateAction(result))
      if (payload.success) {
        payload.success(result)
      }
    }).catch((error) => {
      if (payload.error) {
        payload.error(error)
      }
    })
  }
}

//已弃用
export function publishTopicFormData(payload) {
  return (dispatch, getState) => {
    let formData = undefined
    if (payload.formKey) {
      let formCheck = createAction(uiTypes.INPUTFORM_VALID_CHECK)
      dispatch(formCheck({formKey: payload.formKey}))
      let isFormValid = isInputFormValid(getState(), payload.formKey)
      if (isFormValid && !isFormValid.isValid) {
        if (payload.error) {
          payload.error({message: isFormValid.errMsg})
        }
        return
      }
      formData = getInputFormData(getState(), payload.formKey)
    }
    console.log('payload:', payload)
    switch (payload.submitType) {
      case TOPIC_FORM_SUBMIT_TYPE.PUBLISH_TOPICS:
        dispatch(handlePublishTopic(payload, formData))
        break
      case TOPIC_FORM_SUBMIT_TYPE.PUBLISH_TOPICS_COMMENT:
        dispatch(handlePublishTopicComment(payload, formData))
        break
      case TOPIC_FORM_SUBMIT_TYPE.UPDATE_TOPICS:
        dispatch(handleUpdateTopic(payload, formData))
        break
    }
  }
}

function handlePublishTopic(payload, formData) {
  return (dispatch, getState) => {
    let position = locSelector.getLocation(getState())
    let province = locSelector.getProvince(getState())
    let city = locSelector.getCity(getState())
    let district = locSelector.getDistrict(getState())
    let geoPoint = locSelector.getGeopoint(getState())
    /*if (geoPoint.latitude == 0 && geoPoint.longitude == 0) {
      if (payload.error) {
        payload.error({message: '请为应用打开地理位置权限！'})
      }
      return
    }*/
    if(payload.images && payload.images.length > 0) {
      return ImageUtil.batchUploadImgs2(payload.images).then((leanUris) => {
        return leanUris
      }).then((leanUris) => {
        if(formData.topicContent && formData.topicContent.text.length &&
          leanUris && leanUris.length) {
          let contentImgs = leanUris.concat([]).reverse()
          formData.topicContent.text.forEach((value) => {
            if(value.type == 'COMP_IMG' && value.url)
              value.url = contentImgs.pop()
          })
        }
        let publishTopicPayload = {
          position: position,
          geoPoint: new AV.GeoPoint(geoPoint.latitude, geoPoint.longitude),
          province: province,
          city: city,
          district: district,
          title: trim(formData.topicName.text),
          content: JSON.stringify(formData.topicContent.text),
          abstract: trim(formData.topicContent.abstract),
          imgGroup: leanUris,
          categoryId: payload.categoryId,
          userId: payload.userId,
        }
        lcTopics.publishTopics(publishTopicPayload).then((result) => {
          if (payload.success) {
            payload.success()
          }
          let publishAction = createAction(topicActionTypes.ADD_TOPIC)
          dispatch(publishAction({topic:result, stateKey: payload.stateKey}))
          dispatch(pointAction.calPublishTopic({userId: payload.userId}))   // 计算发布话题积分
        }).catch((error) => {
          console.log("error: ", error)
          if (payload.error) {
            payload.error(error)
          }
        })
      }).catch((error) => {
        if (payload.error) {
          payload.error(error)
        }
      })
    } else {
      let publishTopicPayload = {
        position: position,
        geoPoint: new AV.GeoPoint(geoPoint.latitude, geoPoint.longitude),
        province: province,
        city: city,
        district: district,
        title: trim(formData.topicName.text),
        content: JSON.stringify(formData.topicContent.text),
        abstract: trim(formData.topicContent.abstract),
        imgGroup: payload.images,
        categoryId: payload.categoryId,
        userId: payload.userId,
      }
      lcTopics.publishTopics(publishTopicPayload).then((result) => {
        if (payload.success) {
          payload.success()
        }
        let publishAction = createAction(topicActionTypes.ADD_TOPIC)
        dispatch(publishAction({topic:result, stateKey: payload.stateKey}))
        dispatch(pointAction.calPublishTopic({userId: payload.userId}))   // 计算发布话题积分
      }).catch((error) => {
        console.log("error: ", error)
        if (payload.error) {
          payload.error(error)
        }
      })
    }
  }
}

function handleUpdateTopic(payload, formData) {
  return (dispatch, getState) => {
    if(payload.images && payload.images.length > 0) {
      return ImageUtil.batchUploadImgs2(payload.images).then((leanUris) => {
        return leanUris
      },(err)=>{
        throw err
      }).then((leanUris) => {
        if(formData.topicContent && formData.topicContent.text.length &&
          leanUris && leanUris.length) {
          let contentImgs = leanUris.concat([]).reverse()
          formData.topicContent.text.forEach((value) => {
            if(value.type == 'COMP_IMG' && value.url)
              value.url = contentImgs.pop()
          })
        }
        let updateTopicPayload = {
          title: trim(formData.topicName.text),
          content: JSON.stringify(formData.topicContent.text),
          abstract: trim(formData.topicContent.abstract),
          imgGroup: leanUris,
          categoryId: payload.categoryId,
          topicId: payload.topicId,
        }
        lcTopics.updateTopic(updateTopicPayload).then((result) => {
          if (payload.success) {
            payload.success()
          }
          let updateAction = createAction(topicActionTypes.UPDATE_TOPIC)
          dispatch(updateAction({topic: result}))
        }).catch((error) => {
          if (payload.error) {
            payload.error(error)
          }
        })
      },(err)=>{
        throw err
      }).catch((error) => {
        if (payload.error) {
          payload.error(error)
        }
      })
    } else {
      let updateTopicPayload = {
        title: trim(formData.topicName.text),
        content: JSON.stringify(formData.topicContent.text),
        abstract: trim(formData.topicContent.abstract),
        imgGroup: payload.images,
        categoryId: payload.categoryId,
        topicId: payload.topicId,
      }
      lcTopics.updateTopic(updateTopicPayload).then((result) => {
        if (payload.success) {
          payload.success()
        }
        let updateAction = createAction(topicActionTypes.UPDATE_TOPIC)
        dispatch(updateAction({topic: result}))
      }).catch((error) => {
        console.log('error',error)
        if (payload.error) {
          payload.error(error)
        }
      })
    }
  }
}

function handlePublishTopicComment(payload, formData) {
  return (dispatch, getState) => {
    let position = locSelector.getLocation(getState())
    let province = locSelector.getProvince(getState())
    let city = locSelector.getCity(getState())
    let district = locSelector.getDistrict(getState())
    let geoPoint = locSelector.getGeopoint(getState())
    // if (geoPoint.latitude == 0 && geoPoint.longitude == 0) {
    //   if (payload.error) {
    //     payload.error({message: '请为应用打开地理位置权限！'})
    //   }
    //   return
    // }
    let publishTopicCommentPayload = {
      position: position,
      geoPoint: new AV.GeoPoint(geoPoint.latitude, geoPoint.longitude),
      province: province,
      city: city,
      district: district,
      content: payload.content,
      topicId: payload.topicId,
      commentId: payload.commentId,
      userId: payload.userId
    }
    if ( (!payload.content) || payload.content.length == 0) {
      payload.error({message: "输入不能为空"})
      return
    }
    lcTopics.publishTopicComments(publishTopicCommentPayload).then((result) => {
      // console.log('result===', result)
      if (payload.success) {
        payload.success()
      }
      let publishCommentAction = createAction(topicActionTypes.PUBLISH_COMMENT_SUCCESS)
      dispatch(publishCommentAction({topicId:payload.topicId, topicComment:result, stateKey: payload.stateKey}))
      dispatch(notifyTopicComment({
        topicId: payload.topicId,
        replyTo: payload.replyTo,
        commentId: result.objectId,
        content: payload.content,
        commentTime:result.createdDate,
      }))
      dispatch(pointAction.calPublishComment({userId: payload.userId}))   // 计算发布话题评论积分
    }).catch((error) => {
      if (payload.error) {
        payload.error(error)
      }
    })
  }
}

export function fetchTopics(payload) {
  return (dispatch, getState) => {
    lcTopics.getTopics(payload).then((result) => {
      let updateTopicsAction = createAction(topicActionTypes.UPDATE_TOPICS)
      dispatch(updateTopicsAction({
        isPaging: !payload.isRefresh,
        categoryId:payload.categoryId,
        type:payload.type,
        topics: result.topics,
      }))
      if(payload.success) {
        payload.success(result.topics.size==0)
      }
    }).catch((error) => {
      if (payload.error) {
        payload.error(error)
      }
    })
  }
}

export function fetchTopicsByUserid(payload) {
  return (dispatch, getState) => {
    lcTopics.getTopics(payload).then((result) => {
      let updateTopicsAction = createAction(topicActionTypes.UPDATE_TOPICS)
      dispatch(updateTopicsAction({
        isPaging: !payload.isRefresh,
        userId:payload.userId,
        type:payload.type,
        topics: result.topics
      }))
      if(payload.success) {
        payload.success(result.topics.size==0)
      }
    }).catch((error) => {
      if (payload.error) {
        payload.error(error)
      }
    })
  }
}

export function fetchTopicById(payload) {
  return (dispatch, getState) => {
    lcTopics.getTopicById(payload).then((topic) => {
      console.log("topic:", topic)
      let addTopic = createAction(topicActionTypes.ADD_TOPIC)
      dispatch(addTopic({topic: topic}))
    }).catch((error) => {
      if (payload.error) {
        payload.error(error)
      }
    })
  }
}

export function fetchTopicCommentsByTopicId(payload) {
  return (dispatch, getState) => {
    lcTopics.fetchTopicComments(payload).then((result) => {

      let topicComments = result.topicComments
      let topicCommentLikeCounts = result.topicCommentLikeCounts
      let userUpInfos = result.userUpInfos

      if(topicCommentLikeCounts && topicCommentLikeCounts.length) {
        topicCommentLikeCounts.forEach((item) => {
          let updateAction = createAction(topicActionTypes.FETCH_TOPIC_LIKES_TOTAL_COUNT_SUCCESS)
          dispatch(updateAction(item))
        })
      }

      if(userUpInfos && userUpInfos.length) {
        userUpInfos.forEach((item) => {
          let updateAction = createAction(topicActionTypes.FETCH_TOPIC_IS_LIKED_SUCCESS)
          dispatch(updateAction(item))
        })
      }
      
      let actionType = topicActionTypes.FETCH_TOPIC_COMMENTS_SUCCESS
      if(!payload.isRefresh) {
        actionType = topicActionTypes.FETCH_TOPIC_COMMENTS_SUCCESS_PAGING
      }
      let action = createAction(actionType)
      dispatch(action({topicId:payload.topicId, topicComments: topicComments}))
      if(payload.success) {
        payload.success(topicComments.size == 0)
      }
    }).catch((error) => {
      if (payload.error) {
        payload.error(error)
      }
    })
  }
}

/*
export function fetchTopicCommentsByTopicId(payload) {
  return (dispatch, getState) => {
    lcTopics.getTopicComments(payload).then((topicComments) => {
      let updateTopicCommentsAction = createAction(topicActionTypes.UPDATE_TOPIC_COMMENTS)
      dispatch(updateTopicCommentsAction({topicId:payload.topicId, topicComments: topicComments}))
    }).catch((error) => {
      if (payload.error) {
        payload.error(error)
      }
    })
  }
}
*/

export function likeTopic(payload) {
  return (dispatch, getState) => {
    lcTopics.likeTopic(payload).then(() => {
      if (payload.success) {
        payload.success()
      }
      let updateAction = createAction(topicActionTypes.LIKE_TOPIC_SUCCESS)
      dispatch(updateAction({topicId: payload.topicId}))
      if (payload.upType === 'topic') {
        dispatch(notifyTopicLike({topicId: payload.topicId}))
      }
    }).catch((error) => {
      if (payload.error) {
        payload.error(error)
      }
    })
  }
}

export function unLikeTopic(payload) {
  return (dispatch, getState) => {
    lcTopics.unLikeTopic(payload).then(() => {
      if (payload.success) {
        payload.success()
      }
      let updateAction = createAction(topicActionTypes.UNLIKE_TOPIC_SUCCESS)
      dispatch(updateAction({topicId: payload.topicId}))
    }).catch((error) => {
      if (payload.error) {
        payload.error(error)
      }
    })
  }
}

export function fetchTopicLikesCount(payload) {
  return (dispatch, getState) => {
    lcTopics.fetchTopicLikesCount(payload).then((likesTotalCount) => {
      let updateAction = createAction(topicActionTypes.FETCH_TOPIC_LIKES_TOTAL_COUNT_SUCCESS)
      dispatch(updateAction({topicId: payload.topicId, likesTotalCount: likesTotalCount}))
      if (payload.success) {
        payload.success(likesTotalCount)
      }
    }).catch((error) => {
      if (payload.error) {
        payload.error(error)
      }
    })
  }
}

export function fetchTopicIsLiked(payload) {
  return (dispatch, getState) => {
    lcTopics.fetchUserLikeTopicInfo(payload).then((userLikeInfo) => {
      let updateAction = createAction(topicActionTypes.FETCH_TOPIC_IS_LIKED_SUCCESS)
      dispatch(updateAction({topicId: payload.topicId, userLikeInfo: userLikeInfo}))
      if (payload.success) {
        payload.success()
      }
    }).catch((error) => {
      if (payload.error) {
        payload.error(error)
      }
    })
  }
}

export function fetchTopicLikeUsers(payload) {
  return (dispatch, getState) => {
    lcTopics.fetchTopicLikeUsers(payload).then((topicLikeUsers) => {
      let actionType = topicActionTypes.FETCH_TOPIC_LIKE_USERS_SUCCESS
      if(!payload.isRefresh) {
        actionType = topicActionTypes.FETCH_TOPIC_LIKE_USERS_SUCCESS_PAGING
      }

      let action = createAction(actionType)
      dispatch(action({topicId: payload.topicId, topicLikeUsers: topicLikeUsers}))

      if (payload.success) {
        payload.success(topicLikeUsers.size)
        // payload.success(topicLikeUsers.size <= 0)
      }

      // let updateTopicLikeUsersAction = createAction(topicActionTypes.UPDATE_TOPIC_LIKE_USERS)
      // dispatch(updateTopicLikeUsersAction({topicId: payload.topicId, topicLikeUsers: topicLikeUsers}))
    }).catch((error) => {
      if (payload.error) {
        payload.error(error)
      }
    })
  }
}

export function fetchMainPageTopics(payload) {
  return (dispatch, getState) => {
    lcTopics.getMainPageTopics(payload).then((topics) => {
      let updateMainPageTopics = createAction(topicActionTypes.UPDATE_MAINPAGE_TOPICS)
      dispatch(updateMainPageTopics({topics}))
    })
  }
}

export function disableTopic(payload){
  return (dispatch,getState)=>{
    lcTopics.disableTopic(payload.id).then(()=>{
      if (payload.success) {
        payload.success()
      }
      let disableTopic = createAction(topicActionTypes.DISABLE_TOPIC)
      dispatch (disableTopic({success:true}))
    }).catch((error) => {
      if (payload.error) {
        payload.error(error)
      }
    })
  }
}
