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
import {
  Option,
  OptionList,
  SelectInput
} from '../../common/CommonSelect'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import DatePicker from 'react-native-datepicker'
import {em, normalizeW, normalizeH, normalizeBorder} from '../../../util/Responsive'
import THEME from '../../../constants/themes/theme1'
import * as appConfig from '../../../constants/appConfig'
import Header from '../../common/Header'
import CommonButton from '../../common/CommonButton'
import PhoneInput from '../../common/Input/PhoneInput'
import TextAreaInput from '../../common/Input/TextAreaInput'
import Checkbox from '../../common/Input/Checkbox'
import TagsInput from '../../common/Input/TagsInput'
import ShopTagsSelect from './ShopTagsSelect'
import CommonTextInput from './ShopTagsSelect'
import * as MyShopTestData from './MyShopTestData'
import ImageGroupInput from '../../common/Input/ImageGroupInput'
import ImageInput from '../../common/Input/ImageInput'
import ServiceTimePicker from '../../common/Input/ServiceTimePicker'
import {fetchShopTags, fetchUserOwnedShopInfo} from '../../../action/shopAction'
import {submitFormData, submitInputData,INPUT_FORM_SUBMIT_TYPE} from '../../../action/authActions'
import * as Toast from '../../common/Toast'
import * as authSelector from '../../../selector/authSelector'
import {selectShopCategories} from '../../../selector/configSelector'
import {selectShopTags, selectUserOwnedShopInfo} from '../../../selector/shopSelector'
import {fetchShopCategories} from '../../../action/configAction'
import Icon from 'react-native-vector-icons/Ionicons'

const PAGE_WIDTH = Dimensions.get('window').width
const PAGE_HEIGHT = Dimensions.get('window').height

let commonForm = Symbol('commonForm')

const serviceTimeInput = {
  formKey: commonForm,
  stateKey: Symbol('serviceTimeInput'),
  type: "serviceTimeInput",
}
const servicePhoneInput = {
  formKey: commonForm,
  stateKey: Symbol('servicePhoneInput'),
  type: "servicePhoneInput",
}
const servicePhone2Input = {
  formKey: commonForm,
  stateKey: Symbol('servicePhone2Input'),
  type: "servicePhone2Input",
}
const ourSpecialInput = {
  formKey: commonForm,
  stateKey: Symbol('ourSpecialInput'),
  type: 'ourSpecialInput'
}

const tagsInput = {
  formKey: commonForm,
  stateKey: Symbol('tagsInput'),
  type: 'tagsInput'
}

class EditShop extends Component {
  constructor(props) {
    super(props)

    if(Platform.OS == 'ios') {
      this.state = {
        selectShow: false,
        shopTagsSelectShow: false,
        optionListPos: 179,
        shopTagsSelectTop: 379,
        selectedShopTags: [],
        shopCategoryContainedTag: [],
        shouldUploadImage: false,
        shouldUploadImages: false,
      }
    }else{
      this.state = {
        selectShow: false,
        shopTagsSelectShow: false,
        optionListPos: 159,
        shopTagsSelectTop: 359,
        selectedShopTags: [],
        shopCategoryContainedTag: [],
        shouldUploadImage: false,
        shouldUploadImages: false,
      }
    }

    this.headerHeight = 44
    if(Platform.OS == 'ios') {
      this.headerHeight = 64
    }
    this.shopBaseInfoWrapHeight = 64
    this.scrollOffSet = 0

  }

  componentWillMount() {
    InteractionManager.runAfterInteractions(()=>{
      this.props.fetchUserOwnedShopInfo()
      this.props.fetchShopCategories()
      this.props.fetchShopTags()
    })
  }

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {

    })
  }

  componentDidMount() {
    if(this.props.userOwnedShopInfo.containedTag && this.props.userOwnedShopInfo.containedTag.length) {
      this.setState({
        selectedShopTags: this.props.userOwnedShopInfo.containedTag
      })
    }

    let targetShopCategory = {}
    if(this.props.userOwnedShopInfo.targetShopCategory) {
      targetShopCategory = this.props.userOwnedShopInfo.targetShopCategory
      if(targetShopCategory.id) {
        this.updateShopCategoryContainedTags(targetShopCategory.id)
      }
    }
  }

  componentWillReceiveProps(nextProps) {

  }

  updateShopCategoryContainedTags(shopCategoryId) {
    let shopCategoryContainedTag = []
    // console.log('updateShopCategoryContainedTags.allShopCategories=')
    // console.log(this.props.allShopCategories)
    if(this.props.allShopCategories && this.props.allShopCategories.length) {
      for(let i = 0; i < this.props.allShopCategories.length; i++) {
        let shopCategory = this.props.allShopCategories[i]
        if(shopCategory.id == shopCategoryId) {
          shopCategoryContainedTag = shopCategory.containedTag
          // console.log('updateShopCategoryContainedTags.=')
          this.setState({
            shopCategoryContainedTag: shopCategoryContainedTag,
          })
          break
        }
      }
    }
  }

  submitSuccessCallback(context) {
    context.props.fetchUserOwnedShopInfo()
    Toast.show('更新成功', {
      duration: 1500,
      onHidden: () =>{
        if(context.props.popNum && context.props.popNum > 1) {
          Actions.pop({
            popNum: context.props.popNum
          })
        }else {
          Actions.pop()
        }
      }
    })
  }

  submitErrorCallback(error) {
    Toast.show(error.message)
  }

  onEditShopBtnPress = () => {
    // console.log('fadsf')
    //先上传封面
    if(this.localCoverImgUri) { //用户拍照或从相册选择了照片
      this.setState({
        shouldUploadImage: true
      })
    }
    //上传相册
    else if(this.localAlbumList && this.localAlbumList.length) {
      this.setState({
        shouldUploadImages: true
      })
    }
    //直接更新
    else {
      this.submitShopInfo()
    }
  }

  uploadImageCallback() {
    //上传封面成功,开始上传相册
    if(this.localAlbumList && this.localAlbumList.length) {
      this.setState({
        shouldUploadImages: true
      })
    }
    //直接更新
    else {
      this.submitShopInfo()
    }
  }

  uploadImagesCallback() {
    //上传相册成功
    this.submitShopInfo()
  }
  
  submitShopInfo() {
    let targetShopCategory = {}
    if(this.props.userOwnedShopInfo.targetShopCategory) {
      targetShopCategory = this.props.userOwnedShopInfo.targetShopCategory
    }
  
    this.props.submitFormData({
      formKey: commonForm,
      shopId: this.props.userOwnedShopInfo.id,
      canModifyShopCategory: targetShopCategory.id ? false : true,
      submitType: INPUT_FORM_SUBMIT_TYPE.COMPLETE_SHOP_INFO,
      success: ()=>{this.submitSuccessCallback(this)},
      error: this.submitErrorCallback
    })
  }

  onShopBaseInfoWrapLayout(event) {
    if(event.nativeEvent.layout.height) {
      this.shopBaseInfoWrapHeight = event.nativeEvent.layout.height
      this.calNewPos()
    }
  }

  calNewPos() {
    const marginBottomHeight = 10
    const inputWrapHeight = 40
    const coverImageHeight = 200
    if(Platform.OS == 'ios') {
      this.setState({
        shopTagsSelectTop: this.shopBaseInfoWrapHeight + coverImageHeight + inputWrapHeight + marginBottomHeight - this.scrollOffSet + 1
      })
    }else{
      this.setState({
        shopTagsSelectTop: this.shopBaseInfoWrapHeight + coverImageHeight + inputWrapHeight + marginBottomHeight - this.scrollOffSet + 1
      })
    }
  }

  handleOnScroll(e) {
    this.scrollOffSet = e.nativeEvent.contentOffset.y
    this.calNewPos()
  }

  toggleShopTagsSelectShow() {
    this.setState({
      shopTagsSelectShow:!this.state.shopTagsSelectShow
    })
  }

  onTagPress(tag, selected) {
    if(selected) {
      let index = -1
      for(let i = 0; i < this.state.selectedShopTags.length; i++) {
        if(this.state.selectedShopTags[i].id == tag.id) {
          index = i
          break
        }
      }
      if(index >= 0) {
        this.state.selectedShopTags.splice(index, 1)
      }
    }else {
      this.state.selectedShopTags.push(tag)
    }
    this.setState({
      selectedShopTags: this.state.selectedShopTags
    })
  }

  goBack() {
    if(this.props.popNum > 2) {
      Actions.pop({
        popNum: this.props.popNum
      })
    }else {
      Actions.pop()
    }
  }

  render() {

    let targetShopCategory = {}
    if(this.props.userOwnedShopInfo.targetShopCategory) {
      targetShopCategory = this.props.userOwnedShopInfo.targetShopCategory
    }
    // console.log('targetShopCategory===', targetShopCategory)

    let shopCover = require('../../../assets/images/background_shop.png')
    if(this.props.userOwnedShopInfo.coverUrl) {
      shopCover = {uri: this.props.userOwnedShopInfo.coverUrl}
    }

    return (
      <View style={styles.container}>
        <Header
          leftType="text"
          leftText="取消"
          leftPress={() => this.goBack()}
          title="编辑店铺"
          headerContainerStyle={styles.headerContainerStyle}
          leftStyle={styles.headerLeftStyle}
          titleStyle={styles.headerTitleStyle}
          rightType="none"
        />
        <View style={styles.body}>

          <KeyboardAwareScrollView
            automaticallyAdjustContentInsets={false}
            onScroll={e => this.handleOnScroll(e)}
            scrollEventThrottle={0}
          >
            <View style={{flex:1}}>
              <Image style={{width:PAGE_WIDTH,height:200}} source={shopCover}/>
              <View style={{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'rgba(90,90,90,0.5)'}}>
                <TouchableOpacity style={{flex:1}} onPress={()=>{}}>
                  <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                    <Image style={{width:44,height:44}} source={require("../../../assets/images/default_picture.png")}/>
                    <Text style={{marginTop:15,fontSize:15,color:'#fff'}}>编辑封面</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={{height:45}} onPress={()=>{}}>
                  <View
                    style={{
                    flex:1,
                    flexDirection:'row',
                    justifyContent:'flex-end',
                    alignItems:'center',
                    backgroundColor:'rgba(245,245,245,0.49)'
                  }}>
                    <Text style={{fontSize:15,color:'#fff'}}>编辑相册</Text>
                    <Icon
                      name="ios-arrow-forward"
                      style={{marginLeft:20,marginRight:15,color:'white',fontSize:17}}/>
                  </View>
                </TouchableOpacity>

              </View>
            </View>
            <View onLayout={this.onShopBaseInfoWrapLayout.bind(this)} style={styles.shopBaseInfoWrap}>
              <View style={styles.shopBaseInfoLeftWrap}>
                <Text numberOfLines={1} style={styles.shopBaseInfoLeftTitle}>{this.props.userOwnedShopInfo.shopName}</Text>
                <View style={styles.shopBaseInfoLeftLocBox}>
                  <Image source={require("../../../assets/images/shop_loaction.png")}/>
                  <Text numberOfLines={2} style={styles.shopBaseInfoLeftLocTxt}>{this.props.userOwnedShopInfo.shopAddress}</Text>
                </View>
              </View>
              <View style={styles.shopBaseInfoRightWrap}>
                <TouchableOpacity onPress={()=>{}}>
                  <Image source={require("../../../assets/images/shop_certified.png")}/>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputsWrap}>
              <View style={styles.inputWrap}>
                <View style={styles.inputLabelBox}>
                  <Text style={styles.inputLabel}>店铺标签</Text>
                </View>
                <View style={[styles.inputBox, styles.tagsBox]}>
                  <TagsInput
                    {...tagsInput}
                    onPress={()=>{this.toggleShopTagsSelectShow()}}
                    tags={this.state.selectedShopTags}
                  />
                </View>
              </View>

              <View style={styles.inputWrap}>
                <View style={styles.inputLabelBox}>
                  <Text style={styles.inputLabel}>服务电话</Text>
                </View>
                <View style={styles.inputBox}>
                  <PhoneInput
                    {...servicePhoneInput}
                    placeholder="点击输入电话号码"
                    maxLength={15}
                    noFormatPhone={true}
                    containerStyle={styles.containerStyle}
                    inputStyle={styles.inputStyle}
                    clearBtnStyle={{top:6}}
                    initValue={this.props.userOwnedShopInfo.contactNumber}
                  />
                </View>
              </View>

              <View style={styles.inputWrap}>
                <View style={styles.inputLabelBox}>
                  <Text style={styles.inputLabel}>备用电话</Text>
                </View>
                <View style={styles.inputBox}>
                  <PhoneInput
                    {...servicePhone2Input}
                    placeholder="备用电话（选填）"
                    maxLength={15}
                    noFormatPhone={true}
                    containerStyle={styles.containerStyle}
                    inputStyle={styles.inputStyle}
                    clearBtnStyle={{top:6}}
                    initValue={this.props.userOwnedShopInfo.contactNumber}
                  />
                </View>
              </View>

              <View style={[styles.inputWrap, styles.serviceTimeWrap]}>
                <View style={styles.inputLabelBox}>
                  <Text style={styles.inputLabel}>营业时间</Text>
                </View>
                <View style={[styles.inputBox, styles.datePickerBox]}>
                  <ServiceTimePicker
                    {...serviceTimeInput}
                    initValue={this.props.userOwnedShopInfo.openTime}
                  />
                </View>
              </View>

              <View style={[styles.inputWrap, styles.ourSpecialWrap, {borderBottomWidth:0}]}>
                <View style={[styles.inputLabelBox, styles.ourSpecialInputLabelBox]}>
                  <Text style={styles.inputLabel}>本店特色</Text>
                </View>
              </View>

              <View style={[styles.inputWrap, {padding:15,paddingTop:0,marginBottom:80}]}>
                <View style={[styles.inputBox]}>
                  <TextAreaInput
                    {...ourSpecialInput}
                    placeholder={"描述店铺特色、优势「小于100字」"}
                    clearBtnStyle={{right: 10,top: 30}}
                    inputStyle={{borderColor: '#bdc6cf', color: '#030303',paddingRight:30}}
                    maxLength={100}
                    initValue={this.props.userOwnedShopInfo.ourSpecial}
                  />
                </View>
              </View>

            </View>

          </KeyboardAwareScrollView>

          <View style={{position:'absolute',bottom:0,left:0,right:0,padding:15,backgroundColor:'white'}}>
            <CommonButton
              buttonStyle={{}}
              onPress={()=>{this.onEditShopBtnPress()}}
            />
          </View>

          {this.state.shopTagsSelectShow &&
            <ShopTagsSelect
              show={this.state.shopTagsSelectShow}
              containerStyle={{top: this.state.shopTagsSelectTop}}
              scrollViewStyle={{height:150}}
              onOverlayPress={()=>{this.toggleShopTagsSelectShow()}}
              tags={this.state.shopCategoryContainedTag}
              selectedTags={this.state.selectedShopTags}
              onTagPress={(tag, selected)=>{this.onTagPress(tag, selected)}}
            />
          }

        </View>
      </View>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const isUserLogined = authSelector.isUserLogined(state)
  const allShopCategories = selectShopCategories(state)
  const allShopTags = selectShopTags(state)
  const userOwnedShopInfo = selectUserOwnedShopInfo(state)
  // console.log('userOwnedShopInfo===', userOwnedShopInfo)
  return {
    isUserLogined: isUserLogined,
    allShopCategories: allShopCategories,
    allShopTags: allShopTags,
    userOwnedShopInfo: userOwnedShopInfo
  }
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
  submitFormData,
  submitInputData,
  fetchShopCategories,
  fetchShopTags,
  fetchUserOwnedShopInfo
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(EditShop)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)'
  },
  headerContainerStyle: {
    borderBottomWidth: 0,
    backgroundColor: THEME.colors.green,
    ...Platform.select({
      ios: {
        paddingTop: 20,
        height: 64
      },
      android: {
        height: 44
      }
    }),
  },
  headerLeftStyle: {
    color: '#fff',
    fontSize: em(17)
  },
  headerTitleStyle: {
    color: '#fff',
  },
  completeBtnBox: {
    borderWidth: normalizeBorder(),
    borderColor: '#fff',
    padding: 5,
    marginRight: 12
  },
  completeBtn: {
    fontSize: em(17),
    color: '#fff'
  },
  body: {
    ...Platform.select({
      ios: {
        marginTop: 64,
      },
      android: {
        marginTop: 44
      }
    }),
    flex: 1,
  },
  inputsWrap: {
    marginBottom: 10,
  },
  inputWrap: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    borderBottomWidth: normalizeBorder(),
    borderBottomColor: THEME.colors.gray,
    paddingLeft: normalizeW(20),
  },
  inputLabelBox: {
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  inputLabel: {
    fontSize: em(17),
    color: THEME.colors.inputLabel
  },
  inputBox: {
    flex: 1
  },
  tagsBox: {
    justifyContent: 'center',
  },
  containerStyle: {
    paddingRight:0,
  },
  inputInnerBox: {
    height: 40,
    paddingLeft: normalizeW(14),
    justifyContent: 'center'
  },
  inputInnerStyle:{
    fontSize: em(17),
    color: '#333'
  },
  inputStyle:{
    height: normalizeH(44),
    fontSize: em(17),
    backgroundColor: '#fff',
    borderWidth: 0,
    paddingLeft: 0,
    color: '#333'
  },
  shopBaseInfoWrap: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10
  },
  shopBaseInfoLeftWrap: {
    flex: 1,
  },
  shopBaseInfoLeftTitle: {
    color: '#030303',
    fontSize: em(17)
  },
  shopBaseInfoLeftLocBox: {
    flexDirection: 'row',
    marginTop: 10,
    marginRight:10
  },
  shopBaseInfoLeftLocTxt: {
    marginLeft: 5,
    color: '#8f8e94',
    fontSize: em(17)
  },
  shopBaseInfoRightWrap: {

  },
  defaultPickerStyle: {

  },
  serviceTimeWrap: {
    paddingTop: 5,
    paddingBottom: 5
  },
  datePickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
  },
  ourSpecialWrap: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingRight: 10,
  },
  ourSpecialInputLabelBox: {
    justifyContent: 'flex-start'
  },
  ourSpecialInputBox: {
    paddingLeft: 14,
  },
  albumWrap: {
    marginBottom: 10,
    backgroundColor: '#fff'
  },
  albumTitle: {
    paddingTop: 10,
    paddingLeft: 10,
    fontSize: em(17),
    color: THEME.colors.inputLabel
  },
  uploadAlbum: {
    marginTop: 10
  },
  coverWrap: {
    paddingBottom: 10,
    marginBottom: 10,
    backgroundColor: '#fff'
  },


})