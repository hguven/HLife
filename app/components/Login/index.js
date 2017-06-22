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
  ScrollView,
  StatusBar,
} from 'react-native'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'
import {Actions} from 'react-native-router-flux'
import SnsLogin from '../common/SnsLogin'
import {em, normalizeW, normalizeH, normalizeBorder} from '../../util/Responsive'
import PhoneInput from '../common/Input/PhoneInput'
import Header from '../common/Header'
import PasswordInput from '../common/Input/PasswordInput'
import Symbol from 'es6-symbol'
import {submitFormData, INPUT_FORM_SUBMIT_TYPE} from '../../action/authActions'
import * as Toast from '../common/Toast'
import CommonButton from '../common/CommonButton'
import THEME from '../../constants/themes/theme1'
import {fetchUserOwnedShopInfo} from '../../action/shopAction'


const PAGE_WIDTH=Dimensions.get('window').width
const PAGE_HEIGHT=Dimensions.get('window').height


let commonForm = Symbol('commonForm')
const phoneInput = {
  formKey: commonForm,
  stateKey: Symbol('phoneInput'),
  type: "phoneInput"
}
const pwdInput = {
  formKey: commonForm,
  stateKey: Symbol('passwordInput'),
  type: "passwordInput"
}

class Login extends Component {
  constructor(props) {
    super(props)
  }

  onButtonPress = () => {
    this.props.submitFormData({
      formKey: commonForm,
      submitType: INPUT_FORM_SUBMIT_TYPE.LOGIN_WITH_PWD,
      success: (userInfo) => {
        // this.props.fetchUserOwnedShopInfo({userId: userInfo.id})
        Toast.show('登录成功!')
        if (this.props.goHome) {
          Actions.HOME()
        } else {
          Actions.pop()
        }
      },
      error: (error) => {
        Toast.show(error.message)
      }
    })
  }

  retrievePassword() {
    Actions.RETRIEVE_PWD()
  }

  render() {
    return (
      <View style={styles.container}>
        <Header 
          leftType="icon" 
          leftIconName="ios-arrow-back" 
          leftPress={() => Actions.pop()}
          title="登   陆"
        />
        <View style={styles.body}>
          <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps={true}>
            <View style={{marginTop: 30}}>
              <View style={[styles.inputBox, {paddingLeft: normalizeW(17), paddingRight: normalizeW(17)}]}>
                <PhoneInput {...phoneInput}
                            containerStyle={{paddingLeft: normalizeW(0), paddingRight: normalizeW(0)}}
                            outContainerWrap={{backgroundColor: '#F3F3F3', borderWidth: 0}}/>
              </View>
              <View style={styles.inputBox}>
                <PasswordInput {...pwdInput} placeholder="请输入密码"/>
              </View>
            </View>
            <CommonButton title="登   陆" onPress={() => this.onButtonPress()}/>
            <View style={styles.txtView}>
              <Text style={styles.forgetPwd} onPress={() => this.retrievePassword()}>忘记密码？</Text>
              <Text style={[styles.forgetPwd, {paddingLeft: normalizeW(15)}]} onPress={() => Actions.REGIST()}>注册用户</Text>
            </View>
            <CommonButton buttonStyle={{backgroundColor: THEME.base.deepColor}}
                          title="点我注册，打开一片新天地！" onPress={() => Actions.REGIST()}/>
            <SnsLogin />
          </ScrollView>
        </View>
      </View>
    )
  }

}

Login.defaultProps = {
  goHome: false,
}

const mapStateToProps = (state, ownProps) => {
  return {}
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
  submitFormData,
  fetchUserOwnedShopInfo
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Login)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputBox: {
    marginBottom: normalizeW(25)
  },
  body: {
    marginTop: normalizeH(65),
    flex: 1,
  },
  btn: {
    height: normalizeH(50),
    marginLeft: normalizeW(17),
    marginRight: normalizeW(17),
    backgroundColor: THEME.base.mainColor,
  },
  txtView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: normalizeH(18),
    marginBottom: normalizeH(50),
  },
  forgetPwd: {
    fontSize: em(14),
    color: THEME.base.deepColor,
    textAlign: 'center',
  }
})