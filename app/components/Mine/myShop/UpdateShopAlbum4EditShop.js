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

class UpdateShopAlbum4EditShop extends Component {
  constructor(props) {
    super(props)

    this.state = {
      shouldUploadImages: false,
      cancelState:false

    }

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

  updateShopAlbum() {
    Actions.pop({
      refresh: {
        localAlbumList: this.localAlbumList,
      }
    })
  }

  updateCancelState(){
  this.setState({
    cancelState:!this.state.cancelState
  })
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
          <View style={{marginTop: normalizeH(10)}}>
            <ScrollView automaticallyAdjustContentInsets={false}>
              <ImageGroupInput
                {...shopAlbumInput}
                updateCancelState={()=>{this.updateCancelState()}}
                cancelState ={this.state.cancelState}

                number={20}
                imageLineCnt={2}
                initValue={
                  this.props.localAlbumList && this.props.localAlbumList.length
                    ? this.props.localAlbumList
                    : this.props.userOwnedShopInfo.album
                }
                getImageList={(imgList)=>{this.localAlbumList = imgList}}
              />
            </ScrollView>
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

export default connect(mapStateToProps, mapDispatchToProps)(UpdateShopAlbum4EditShop)

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