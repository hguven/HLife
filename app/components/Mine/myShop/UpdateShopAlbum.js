/**
 * Created by zachary on 2017/1/10.
 */
import React, {Component} from 'react'
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  ScrollView,
  ListView,
  TouchableOpacity,
  Image,
  Platform,
  InteractionManager
} from 'react-native'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'
import Symbol from 'es6-symbol'
import {Actions} from 'react-native-router-flux'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import {em, normalizeW, normalizeH, normalizeBorder} from '../../../util/Responsive'
import THEME from '../../../constants/themes/theme1'
import * as appConfig from '../../../constants/appConfig'
import Header from '../../common/Header'
import ImageGroupInput from '../../common/Input/ImageGroupInput'
import {submitFormData, submitInputData,INPUT_FORM_SUBMIT_TYPE} from '../../../action/authActions'
import * as Toast from '../../common/Toast'
import {fetchUserOwnedShopInfo} from '../../../action/shopAction'
import {selectUserOwnedShopInfo} from '../../../selector/shopSelector'

const PAGE_WIDTH = Dimensions.get('window').width
const PAGE_HEIGHT = Dimensions.get('window').height

let commonForm = Symbol('commonForm')
const shopAlbumInput = {
  formKey: commonForm,
  stateKey: Symbol('shopAlbumInput'),
  type: 'shopAlbumInput'
}


class UpdateShopAlbum extends Component {
  constructor(props) {
    super(props)

    this.state = {
      shouldUploadImages: false,
      cancelState:false
    }

    this.isPublishing = false
  }

  componentWillMount() {
    InteractionManager.runAfterInteractions(()=>{

    })
  }

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {

    })
  }

  componentWillReceiveProps(nextProps) {

  }

  onButtonPress() {
    if(this.imgList && this.imgList.length) {
      this.setState({
        shouldUploadImages: true
      })
    }else {
      this.updateShopAlbum()
    }
  }

  uploadImagesCallback() {
    this.updateShopAlbum()
  }

  updateCancelState(){
    this.setState({
      cancelState:!this.state.cancelState
    })
  }
  deleteImage(src){

  }

  updateShopAlbum() {
    if(this.isPublishing) {
      return
    }
    this.props.submitFormData({
      formKey: commonForm,
      id: this.props.id,
      submitType: INPUT_FORM_SUBMIT_TYPE.UPDATE_SHOP_ALBUM,
      success: ()=>{this.submitSuccessCallback(this)},
      error: this.submitErrorCallback
    })
  }

  submitSuccessCallback(context) {
    this.isPublishing = false
    context.props.fetchUserOwnedShopInfo()
    Toast.show('更新成功', {
      duration: 1500,
      onHidden: () =>{
        Actions.pop()
      }
    })
  }

  submitErrorCallback(error) {
    this.isPublishing = false
    Toast.show(error.message || '更新失败')
  }

  render() {
    return (
      <View style={styles.container}>
        <Header
          leftType="text"
          leftText="取消"
          leftPress={() => Actions.pop()}
          title="编辑相册"
          rightType="text"
          rightText="完成"
          rightPress={()=>{this.updateShopAlbum()}}
        />
        <View style={styles.body}>
          <View style={{marginTop: normalizeH(15)}}>
            <ImageGroupInput
              deleteImage={(src)=>{this.deleteImage(src)}}
              cancelState ={this.state.cancelState}
              updateCancelState={()=>{this.updateCancelState()}}
              {...shopAlbumInput}
              number={9}
              imageLineCnt={3}
              initValue={this.props.userOwnedShopInfo.album}
              getImageList={(imgList)=>{this.imgList = imgList}}
              shouldUploadImages={this.state.shouldUploadImages}
              uploadImagesCallback={(leanImgUrls)=>{this.uploadImagesCallback(leanImgUrls)}}
            />
          </View>
        </View>
      </View>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const userOwnedShopInfo = selectUserOwnedShopInfo(state)
  return {
    userOwnedShopInfo: userOwnedShopInfo
  }
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
  submitFormData,
  submitInputData,
  fetchUserOwnedShopInfo
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(UpdateShopAlbum)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)'
  },
  headerContainerStyle: {
    borderBottomWidth: 0,
    backgroundColor: THEME.colors.green,
    paddingTop: 20,
    height: 64,
  },
  headerLeftStyle: {
    color: '#fff',
    fontSize: em(17)
  },
  headerTitleStyle: {
    color: '#fff',
    fontSize: em(17)
  },
  headerRightStyle: {
    color: '#fff',
    fontSize: em(17)
  },
  body: {
    marginTop: normalizeH(64),
    flex: 1,
  },

})