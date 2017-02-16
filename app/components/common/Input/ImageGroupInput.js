/**
 * Created by yangyang on 2016/12/22.
 */
import React, {Component} from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  Modal,
} from 'react-native'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'
import Gallery from 'react-native-gallery'
import ImagePicker from 'react-native-image-picker'
import CommonButton from '../CommonButton'
import {selectPhotoTapped} from '../../../util/ImageSelector'
import * as ImageUtil from '../../../util/ImageUtil'
import {uploadFile} from '../../../api/leancloud/fileUploader'
import {initInputForm, inputFormUpdate} from '../../../action/inputFormActions'
import {getInputData} from '../../../selector/inputFormSelector'
import {em, normalizeW, normalizeH, normalizeBorder} from '../../../util/Responsive'
import ActionSheet from 'react-native-actionsheet'
import * as Toast from '../Toast'

const PAGE_WIDTH = Dimensions.get('window').width
const PAGE_HEIGHT = Dimensions.get('window').height

class ImageGroupInput extends Component {
  constructor(props) {
    super(props)
    this.imgList = []
    this.marginSize = 5
    this.calImgSize = this.calculateImageWidth()
    this.state = {
      imgCnt: 0,
      imgModalShow: false,
      showImg: '',
      reSltImageIndex: -1
    }
  }

  componentDidMount() {
    let formInfo = {
      formKey: this.props.formKey,
      stateKey: this.props.stateKey,
      type: this.props.type,
      checkValid: this.validInput,
      initValue: {text: this.props.initValue}
    }
    this.props.initInputForm(formInfo)
  }

  calculateImageWidth() {
    let calImgSize = (PAGE_WIDTH - (this.props.imageLineCnt + 1) * 2 * this.marginSize) / this.props.imageLineCnt
    return calImgSize
  }

  selectImg() {
    this.ActionSheet.show()

    // selectPhotoTapped({
    //   start: this.pickImageStart,
    //   failed: this.pickImageFailed,
    //   cancelled: this.pickImageCancel,
    //   succeed: this.pickImageSucceed
    // })
  }

  reSelectImg(index) {
    this.setState({
      reSltImageIndex: index
    })
    this.ActionSheet.show()
    // const options = {
    //   title: '',
    //   takePhotoButtonTitle: '拍照',
    //   chooseFromLibraryButtonTitle: '从相册选择',
    //   cancelButtonTitle: '取消',
    //   quality: 1.0,
    //   maxWidth: 500,
    //   maxHeight: 500,
    //   storageOptions: {
    //     skipBackup: true
    //   }
    // }
    //
    // ImagePicker.showImagePicker(options, (response) => {
    //   if (response.didCancel) {
    //   } else if (response.error) {
    //   } else if (response.customButton) {
    //   } else {
    //     console.log('fileSize====', response.fileSize)
    //     this.imgList.splice(index, 1)
    //     let source
    //     if (Platform.OS === 'android') {
    //       source = {
    //         uri: response.uri,
    //         isStatic: true,
    //       }
    //     } else {
    //       source = {
    //         uri: response.uri.replace('file://', ''),
    //         isStatic: true,
    //         origURL: response.origURL,
    //       }
    //     }
    //     this.pickImageSucceed(source)
    //
    //     this.toggleModal(!this.state.imgModalShow)
    //   }
    // })
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.initValue && nextProps.initValue.length) {
      if(this.props.initValue) {
        if(this.props.initValue.length != nextProps.initValue.length) {
          this.imgList = nextProps.initValue
          this.inputChange(this.imgList)
        }
      }else {
        this.imgList = nextProps.initValue
        this.inputChange(this.imgList)
      }
    }
  }

  inputChange(text) {
    let inputForm = {
      formKey: this.props.formKey,
      stateKey: this.props.stateKey,
      data: {text: text}
    }
    this.props.inputFormUpdate(inputForm)

    this.setState({imgCnt: text.length})
  }

  validInput(data) {
    return {isVal: true, errMsg: '验证通过'}
  }

  pickImageStart = () => {
  }

  pickImageFailed = () => {
  }

  pickImageCancel = () => {
  }

  pickImageSucceed = (source) => {
    this.uploadImg(source)
  }

  imageSelectedChange(url) {
    this.imgList.push(url)
    this.inputChange(this.imgList)
  }

  uploadImg = (source) => {
    let fileUri = ''
    if (Platform.OS === 'ios') {
      fileUri = fileUri.concat('file://')
    }
    fileUri = fileUri.concat(source.uri)

    let fileName = source.uri.split('/').pop()
    let uploadPayload = {
      fileUri: fileUri,
      fileName: fileName
    }

    uploadFile(uploadPayload).then((saved) => {
      let leanImgUrl = saved.savedPos
      this.imageSelectedChange(leanImgUrl)
      if(typeof source.success == 'function') {
        source.success(source)
      }
    }).catch((error) => {
      console.log('upload failed:', error)
    })
  }

  renderReuploadBtn(index) {
    return (
      <View style={{position: 'absolute', bottom: normalizeH(50), left: normalizeW(17)}}>
        <CommonButton title="重新上传" onPress={() => this.reSelectImg(index)} />
      </View>
    )
  }

  androidHardwareBackPress() {
    this.toggleModal(false)
  }

  renderImageModal() {
    let index = this.imgList.findIndex((val) => {
      return (val == this.state.showImg)
    })
    if (index == -1) {
      index = 0
    }
    return (
      <View>
        <Modal
          visible={this.state.imgModalShow}
          transparent={false}
          animationType='fade'
          onRequestClose={()=>{this.androidHardwareBackPress()}}
        >
          <View style={{width: PAGE_WIDTH, height: PAGE_HEIGHT}}>
            <Gallery
              style={{flex: 1, backgroundColor: 'black'}}
              images={this.imgList}
              initialPage={index}
              onSingleTapConfirmed={() => this.toggleModal(!this.state.imgModalShow)}
            />
            {this.renderReuploadBtn(index)}
          </View>
        </Modal>
      </View>
    )
  }

  toggleModal(isShow, src) {
    this.setState({imgModalShow: isShow, showImg: src})
  }

  renderImage(src) {
    return (
      <View style={[styles.defaultContainerStyle, {margin: this.marginSize, width: this.calImgSize, height: this.calImgSize}]}>
        <TouchableOpacity style={{flex: 1}} onPress={() => this.toggleModal(!this.state.imgModalShow, src)}>
          <Image style={{flex: 1}} source={{uri: src}}/>
        </TouchableOpacity>
      </View>
    )
  }

  renderImageButton() {
    return (
      <View style={[styles.defaultContainerStyle, {margin: this.marginSize, width: this.calImgSize, height: this.calImgSize}]}>
        <TouchableOpacity style={{flex: 1}} onPress={() => this.selectImg()}>
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Image style={[styles.defaultImgShow, this.props.imgShowStyle]}
                   source={this.props.addImage}/>
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  renderImageRow() {
    if (this.props.data) {
      this.imgList = this.props.data
    }
    let imgComp = this.imgList.map((item, key) => {
      return (
        <View key={key}>
          {this.renderImage(item)}
        </View>
      )
    })
    if (this.state.imgCnt < this.props.number) {
      imgComp.push(
        <View key="imgBtn">
          {this.renderImageButton()}
        </View>
      )
    }
    return imgComp
  }

  renderImageCollect() {
    let imgComp = this.renderImageRow()
    let compList = []
    let comp = []

    for (let i = 0; i < imgComp.length; i++) {
      comp.push(imgComp[i])
      if ((i + 1) % this.props.imageLineCnt == 0) {
        compList.push(comp)
        comp = []
      }
    }
    compList.push(comp)
    return compList
  }

  renderImageShow() {
    let compList = this.renderImageCollect()
    return (
      compList.map((item, key) => {
        return (
          <View key={key} style={styles.container}>
            {item}
          </View>
        )
      })
    )
  }

  _handleActionSheetPress(index) {
    if(0 == index) { //拍照
      ImageUtil.openPicker({
        openType: 'camera',
        success: (response) => {
          if(this.state.reSltImageIndex != -1) {
            this.imgList.splice(this.state.reSltImageIndex, 1)
            this.setState({
              reSltImageIndex: -1
            })
          }
          this.uploadImg({
            uri: response.path
          })
          // console.log('openPicker==response==', response.path)
          // console.log('openPicker==response==', response.size)
        },
        fail: (response) => {
          Toast.show(response.message)
        }
      })
    }else if(1 == index) { //从相册选择
      let option = {
        openType: 'gallery',
        multiple: true,
        success: (response) => {
          if(this.state.reSltImageIndex != -1) {
            this.imgList.splice(this.state.reSltImageIndex, 1)
            this.setState({
              reSltImageIndex: -1
            })
            this.uploadImg({
              uri: response.path
            })
          }else {
            if(response && response.length) {
              let source = {
                uri: response[0].path,
                uploadImgIndex: 0,
                success: (respSource)=>{
                  if(respSource.uploadImgIndex < response.length - 1) {
                    respSource.uploadImgIndex += 1
                    respSource.uri = response[respSource.uploadImgIndex].path
                    this.uploadImg(respSource)
                  }
                }
              }

              this.uploadImg(source)
            }
          }
        },
        fail: (response) => {
          Toast.show(response.message)
        }
      }

      if(this.state.reSltImageIndex != -1) { //重新选择
        option.multiple = false
      }

      ImageUtil.openPicker(option)
    }else if(2 == index) {
      this.setState({
        reSltImageIndex: -1
      })
    }
  }

  renderActionSheet() {
    return (
      <ActionSheet
        ref={(o) => this.ActionSheet = o}
        title=""
        options={['拍照', '从相册选择', '取消']}
        cancelButtonIndex={2}
        onPress={this._handleActionSheetPress.bind(this)}
      />
    )
  }

  render() {
    return (
      <View>
        {this.renderImageModal()}
        {this.renderImageShow()}
        {this.renderActionSheet()}
      </View>
    )
  }
}

ImageGroupInput.defaultProps = {
  number: 1,
  imageLineCnt: 3,
  addImage: require('../../../assets/images/add_picture.png'),
}

const mapStateToProps = (state, ownProps) => {
  let inputData = getInputData(state, ownProps.formKey, ownProps.stateKey)
  return {
    data: inputData.text
  }
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
  initInputForm,
  inputFormUpdate,
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(ImageGroupInput)

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: PAGE_WIDTH,
    marginLeft: 5,
    marginRight: 5,
  },
  defaultContainerStyle: {
    borderColor: '#E9E9E9',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    overflow:'hidden',
  },
  defaultImgShow: {
    width: normalizeW(60),
    height: normalizeH(60),
  },
})