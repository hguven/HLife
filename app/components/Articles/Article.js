import React, {Component} from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Platform,
  Modal,
  ScrollView,
  TouchableHighlight,
  WebView
} from 'react-native'
import Header from '../common/Header'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'
import Icon from 'react-native-vector-icons/Ionicons'
import {em, normalizeW, normalizeH, normalizeBorder} from '../../util/Responsive'
import THEME from '../../constants/themes/theme1'
import {getColumn} from '../../selector/configSelector'
import {Actions} from 'react-native-router-flux'
import {CommonWebView} from '../common/CommonWebView'
import CommentPublic from './CommentPublic'
import Comment from '../common/Comment'

const PAGE_WIDTH = Dimensions.get('window').width
const PAGE_HEIGHT = Dimensions.get('window').height

export default class Article extends Component {
  constructor(props) {
    super(props)
    this.state = {
      modalVisible: false,
      commentY:0
    }
  }
  submitSuccessCallback() {
    Toast.show('评论成功')
    this.props.fetchTopicCommentsByTopicId({topicId: this.props.topic.objectId})
    this.closeModal(()=> {
      Toast.show('发布成功', {duration: 1000})
    })
  }
  openModel(callback) {
    this.setState({
      modalVisible: true
    })
    if (callback && typeof callback == 'function') {
      callback()
    }
  }

  closeModal(callback) {
    this.setState({
      modalVisible: false
    })
    if (callback && typeof callback == 'function') {
      callback()
    }
  }
  render() {
    return (
      <View style={styles.container}>
        <Header leftType='icon'
                leftPress={() => Actions.pop()}
                rightType='image'
                rightImageSource={require("../../assets/images/artical_share.png")}>

        </Header>
        <ScrollView>
        <View style={styles.cotainer}>
        <View style={styles.titleView}>
          <Text style={{fontSize:normalizeH(17), color:'#636363',marginLeft:normalizeW(12),fontWeight:'bold'}}>{this.props.title}</Text>
        </View>
        <View style={styles.authorView}>
          <Image style={{height:normalizeH(30),width:normalizeW(30),overflow:'hidden',borderRadius:normalizeW(15),marginLeft:normalizeW(12)}} source={{uri: this.props.avatar}}></Image>
          <Text style={{fontSize:normalizeH(15), color:'#929292',marginLeft:normalizeW(12)}}>{this.props.nickname}</Text>
        </View>

          <WebView style={styles.articleView}
                  source= {{html: this.props.content}}
          >
          </WebView>
          </View>
        </ScrollView>
        <View style={styles.shopCommentWrap}>
          <TouchableOpacity style={styles.shopCommentInputBox} onPress={this.openModel.bind(this)}>
            <Text style={styles.shopCommentInput}>写评论...</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.commentBtnWrap} onPress={this.scrollToComment.bind(this)}>
            <Image style={{}} source={require('../../assets/images/artical_comments_unselect.png')}/>
            <View style={styles.commentBtnBadge}>
              <Text
                style={styles.commentBtnBadgeTxt}>{this.props.commentsTotalCount > 99 ? '99+' : this.props.commentsTotalCount}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shopUpWrap} onPress={()=> {
          }}>
            <Image style={{}} source={require('../../assets/images/like_unselect.png')}/>
          </TouchableOpacity>
        </View>
        <Comment
          showModules={["content"]}
          modalVisible={this.state.modalVisible}
          modalTitle="写评论"
          closeModal={() => this.closeModal()}
          submitComment={this.submitComment.bind(this)}
        />
      </View>
    )
  }

}

const styles = StyleSheet.create(
  {
    container: {
      flex: 1,
      backgroundColor: '#F5FCFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    titleView: {
      height: normalizeH(39),
      width: PAGE_WIDTH,
      marginTop: normalizeH(64),
      borderBottomWidth: normalizeBorder(3),
      borderColor:'#E6E6E6',
      justifyContent: 'center',
    },
    authorView: {
      height: normalizeH(50),
      width: PAGE_WIDTH,
      marginTop: normalizeH(3),
      alignItems: 'center',
      flexDirection:'row',
    },
    articleView: {
      height: normalizeH(452),
      width: PAGE_WIDTH,
    },
    commentView: {
      height: normalizeH(50),
      width: PAGE_WIDTH,
      backgroundColor:'#FAFAFA'
    },
    shopCommentWrap: {
      height: 50,
      paddingLeft: 10,
      borderTopWidth: normalizeBorder(),
      borderTopColor: THEME.colors.lighterA,
      backgroundColor: 'rgba(0,0,0,0.005)',
      flexDirection: 'row',
      alignItems: 'center'
    },
    shopCommentInputBox: {
      flex: 1,
      marginRight: 10,
      padding: 6,
      borderWidth: normalizeBorder(),
      borderColor: THEME.colors.lighterA,
      borderRadius: 10,
      backgroundColor: '#fff'
    },
    shopCommentInput: {
      fontSize: em(17),
      color: '#8f8e94'
    },
    commentBtnWrap: {
      width: 60,
      height: 38,
      justifyContent: 'center',
      alignItems: 'center'
    },
    commentBtnBadge: {
      alignItems: 'center',
      width: 30,
      backgroundColor: '#f5a623',
      position: 'absolute',
      right: 0,
      top: 0,
      borderRadius: 10,
      borderWidth: normalizeBorder(),
      borderColor: '#f5a623'
    },
    commentBtnBadgeTxt: {
      fontSize: 9,
      color: '#fff'
    },
    shopUpWrap: {
      width: 60,
      alignItems: 'center'
    },

  })