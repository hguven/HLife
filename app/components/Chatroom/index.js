/**
 * Created by yangyang on 2016/12/19.
 */
import React, {Component} from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  InteractionManager,
  Platform,
  Text,
  Keyboard
} from 'react-native'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'
import {Actions} from 'react-native-router-flux'
import {GiftedChat} from './GifedChat/GiftedChat'
import Header from '../common/Header'
import CustomInputToolbar from './CustomInputToolbar'
import CustomMessage from './CustomMessage'
import {getLcConversation, fetchHistoryChatMessagesByPaging, createConversation, leaveConversation, enterConversation, sendMessage, initMessageClient} from '../../action/messageAction'
import {getUserInfoById} from '../../action/authActions'
import {activeUserInfo, userInfoById} from '../../selector/authSelector'
import {activeConversation, getMessages} from '../../selector/messageSelector'
import * as msgTypes from '../../constants/messageActionTypes'
import * as AVUtils from '../../util/AVUtils'
import * as Toast from '../common/Toast'
import {normalizeH} from '../../util/Responsive'

const PAGE_WIDTH = Dimensions.get('window').width

class Chatroom extends Component {
  constructor(props) {
    super(props)
    this.onSend = this.onSend.bind(this)

    this.conversation = null
    this.messageIterator = null

    this.state = {
      hasMore: false,
      showLoadEarlier:false,
      keyboardShow: false,
    }

    this.oldChatMessageSoundOpen = true
  }

  componentDidMount() {
    this.oldChatMessageSoundOpen = global.chatMessageSoundOpen
    global.chatMessageSoundOpen = false
    InteractionManager.runAfterInteractions(() => {
      // console.log('begin to create conversation:', this.props.name, this.props.members)

      this.createConversation((success) => {
        if(success) {
          this.fetchHistoryChatMsgs()
        }
      })

      // this.props.members.forEach((member) => {
      //   this.props.getUserInfoById({userId: member})
      // })
      
    })
  }

  componentWillUnmount() {
    global.chatMessageSoundOpen = this.oldChatMessageSoundOpen
    this.props.leaveConversation()
  }

  createConversation(callback) {
    this.props.createConversation({
      members: this.props.members,
      name: this.props.name,
      type: this.props.conversationType,
      success:(result) => {
        let conversation = result.conversation
        let conversationId = conversation.id
        this.props.getLcConversation({
          conversationId: conversationId,
          success: (conversation) => {
            this.conversation = conversation
            this.createMessagesIterator()
            callback && callback(true)
          },
          error: () => {
            Toast.show('获取会话失败')
            callback && callback(false)
          }
        })
      },
      error: () => {
        Toast.show('创建会话失败')
        callback && callback(false)
      }
    })
  }

  createMessagesIterator() {
    if(this.conversation) {
      if(!this.messageIterator) {
        this.messageIterator = this.conversation.createMessagesIterator({ limit: 10 })
      }
    }
  }


  fetchHistoryChatMsgs() {
    if(!this.messageIterator) {
      this.createConversation((success) => {
        if(success) {
          this.fetchHistoryChatMessagesByPaging()
        }
      })
    }else {
      this.fetchHistoryChatMessagesByPaging()
    }
  }

  fetchHistoryChatMessagesByPaging = () => {
    let payload = {
      conversationId: this.conversation.id,
      messageIterator: this.messageIterator,
      success: (result) => {
        let hasMore = result.hasMore
        let messages = result.messages
        this.setState({ hasMore })
        if(hasMore) {
          this.setState({ showLoadEarlier: true })
        }
      },
      error: (error) => {
        Toast.show('加载历史消息失败')
      }
    }
    this.props.fetchHistoryChatMessagesByPaging(payload)
  }

  onSend(messages = []) {
    let time = Date.parse(new Date())
    let msgId = this.props.name + '_' + time
    let payload = {
      msgId: msgId,
      conversationId: this.props.conversationId,
    }
    messages.forEach((value) => {
      if (value.text && value.text.length > 0) {
        payload.type = msgTypes.MSG_TEXT
        payload.text = value.text
      } else if (value.image && value.image.length > 0) {
        payload.type = msgTypes.MSG_IMAGE
        payload.text = value.image
        payload.fileName = value.fileName
        payload.uri = value.image
      }
      this.props.sendMessage(payload)
    })
  }

  renderCustomInputToolbar(toolbarProps) {
    return (
      <CustomInputToolbar 
        {...toolbarProps}
        textInputProps={{
          ref:(input) => this.messageInput = input
        }}
      />
    )
  }

  renderCustomMessage(messageProps) {
    return (
      <CustomMessage {...messageProps} customKey={messageProps.key}/>
    )
  }

  onLoadEarlier() {
    if(this.state.hasMore) {
      this.fetchHistoryChatMsgs()
    }
  }

  topComp() {
    if (!this.props.customTopView) {
      return null
    }
    return this.props.customTopView
  }

  render() {
    return (
      <View style={styles.container}>
        <Header
          leftType="icon"
          leftIconName="ios-arrow-back"
          leftPress={() => {
            AVUtils.pop({
              backSceneName: this.props.backSceneName,
              backSceneParams: this.props.backSceneParams,
              timeout:10
            })
          }}
          title={this.props.title}
        />
        <View style={styles.conversationView}>
          <GiftedChat
            messages={this.props.messages}
            onSend={this.onSend}
            user={{
              _id: this.props.user.id,
              name: this.props.user.nickname ? this.props.user.nickname : this.props.user.phone,
              avatar: this.props.user.avatar,
            }}
            renderInputToolbar={(toobarProps) => this.renderCustomInputToolbar(toobarProps)}
            renderMessage={(messageProps) => this.renderCustomMessage(messageProps)}
            loadEarlier={this.state.showLoadEarlier}
            loadEarlierLabel={this.state.hasMore ? "加载历史消息" : '没有更多了！'}
            loadEarlierContainerStyle={{}}
            loadEarlierWrapperStyle={{}}
            loadEarlierTextStyle={{}}
            onLoadEarlier={this.onLoadEarlier.bind(this)}
            customTopComp={() => {return this.topComp()}}
          />
        </View>
      </View>
    )
  }
}

Chatroom.defaultProps = {
  title: '聊天室',
}

const mapStateToProps = (state, ownProps) => {
  let newProps = {}
  let user = activeUserInfo(state)
  let conversationId = activeConversation(state)
  let lcMsg = getMessages(state, conversationId)
  let messages = []

  newProps.user = user
  newProps.conversationId = conversationId
  lcMsg.forEach((value) => {
    let from = value.from
    let userInfo = userInfoById(state, from).toJS()
    let type = value.type
    let msg = {}
    if (type == msgTypes.MSG_TEXT) {
      msg = {
        _id: value.id,
        text: value.text,
        createdAt: value.timestamp,
        user: {
          _id: userInfo.id,
          name: userInfo.nickname ? userInfo.nickname : userInfo.phone,
          avatar: userInfo.avatar,
        }
      }
    } else if (type == msgTypes.MSG_IMAGE) {
      msg = {
        _id: value.id,
        image: value.attributes.uri,
        createdAt: value.timestamp,
        user: {
          _id: userInfo.id,
          name: userInfo.nickname ? userInfo.nickname : userInfo.phone,
          avatar: userInfo.avatar,
        }
      }
    }

    messages.push(msg)
  })
  newProps.messages = messages

  return newProps
}
const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchHistoryChatMessagesByPaging,
  initMessageClient,
  createConversation,
  leaveConversation,
  enterConversation,
  sendMessage,
  getUserInfoById,
  getLcConversation
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Chatroom)

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  conversationView: {
    flex: 1,
    marginTop: normalizeH(64),
  },
})