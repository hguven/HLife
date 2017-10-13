/**
 * Created by wanpeng on 2016/12/2.
 * Modified by wuxingyu on 2016/12/8.
 */
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
  ScrollView
} from 'react-native'

import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'
import {em, normalizeW, normalizeH, normalizeBorder} from '../../util/Responsive'
import CommonButton from '../common/CommonButton'
import {Actions} from 'react-native-router-flux'
import Header from '../common/Header'
import SmsAuthCodeInput from '../common/Input/SmsAuthCodeInput'
import PhoneInput from '../common/Input/PhoneInput'
import PasswordInput from '../common/Input/PasswordInput'
import * as Toast from '../common/Toast'
import Symbol from 'es6-symbol'
import THEME from '../../constants/themes/theme1'

import {submitInputData, submitFormData, INPUT_FORM_SUBMIT_TYPE} from '../../action/authActions'
import {isInputValid} from '../../selector/inputFormSelector'

const PAGE_WIDTH = Dimensions.get('window').width
let commonForm = Symbol('commonForm')
const phoneInput = {
  formKey: commonForm,
  stateKey: Symbol('phoneInput'),
  type: "phoneInput"
}

const smsAuthCodeInput = {
  formKey: commonForm,
  stateKey: Symbol('smsAuthCodeInput'),
  type: "smsAuthCodeInput",

}
const passwordInput = {
  formKey: commonForm,
  stateKey: Symbol('passwordInput'),
  type: "passwordInput"
}

class RetrievePassword extends Component {
  constructor(props) {
    super(props)
  }

  onButtonPress = () => {
    this.props.submitFormData({
      formKey: commonForm,
      submitType: INPUT_FORM_SUBMIT_TYPE.MODIFY_PASSWORD,
      success:() => {
        Toast.show('密码重置成功，请登录')
        Actions.pop()
      },
      error: (error) => {Toast.show(error.message)}
    })
  }

  smsCode() {
    this.props.submitInputData({
      formKey: commonForm,
      stateKey:phoneInput.stateKey,
      submitType: INPUT_FORM_SUBMIT_TYPE.RESET_PWD_SMS_CODE,
      success:() => {},
      error: (error) => {
        Toast.show(error.message)
      }
    })
  }

  render() {
    return (
      <View style={styles.container}>
        <Header
          leftType="icon"
          leftIconName="ios-arrow-back"
          leftPress={() => Actions.pop()}
          title="找回密码"
          rightType=""
        />

        <View style={styles.body}>
          <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps={true}>
            <View style={{marginTop: 30}}>
              <View style={[styles.inputBox, {paddingLeft: normalizeW(17), paddingRight: normalizeW(17)}]}>
                <PhoneInput {...phoneInput}
                            placeholder='请输入注册的手机号'
                            containerStyle={{paddingLeft: normalizeW(0), paddingRight: normalizeW(0)}}
                            outContainerWrap={{backgroundColor: '#F3F3F3', borderWidth: 0}}/>
              </View>
              <SmsAuthCodeInput {...smsAuthCodeInput} containerStyle={styles.inputBox}
                                getSmsAuCode={() => {return this.smsCode()}}  reset={!this.props.phoneValid}
              />
              <PasswordInput {...passwordInput} containerStyle={styles.inputBox}
                             placeholder='设置新密码(6-16位数字或字母)'/>

              <CommonButton
                onPress={this.onButtonPress}
                title="重设密码"
              />
            </View>
          </ScrollView>
        </View>
      </View>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  let newProps = {}
  let isValid = isInputValid(state, commonForm, phoneInput.stateKey)
  if (!isValid.isValid) {
    newProps.phoneValid = false
  } else {
    newProps.phoneValid = true
  }
  return newProps
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
  submitFormData,
  submitInputData
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(RetrievePassword)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  body: {
    marginTop: normalizeH(65),
    flex: 1,
  },
  inputBox: {
    marginBottom: normalizeW(25)
  },
})