/**
 * Created by wuxingyu on 2016/12/4.
 */
import React, {Component} from 'react'
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Keyboard,
  TextInput,
  Dimensions,
  PropTypes,
} from 'react-native'

import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'
import {initInputForm, inputFormUpdate} from '../../../action/inputFormActions'
import {getInputData} from '../../../selector/inputFormSelector'
import {em, normalizeW, normalizeH, normalizeBorder} from '../../../util/Responsive'
import THEME from '../../../constants/themes/theme1'

class SmsAuthCodeInput extends Component {

  constructor(props) {
    super(props)
    this.state = {countDown: 0}
  }

  componentWillUnmount() {
    this.interval && clearInterval(this.interval)
  }

  componentDidMount() {
    let formInfo = {
      formKey: this.props.formKey,
      stateKey: this.props.stateKey,
      type: "smsAuthCodeInput",
      checkValid: this.props.checkValid || this.validInput
    }
    this.props.initInputForm(formInfo)
  }

  validInput(data) {
    if(data && data.text)
      return {isVal:true, errMsg:"ok"}
    return {isVal:false, errMsg:"请输入验证码"}
  }

  inputChange(text) {
    let inputForm = {
      formKey: this.props.formKey,
      stateKey: this.props.stateKey,
      data: {text}
    }
    this.props.inputFormUpdate(inputForm)
  }

  countDown = () => {
    this.interval = setInterval(()=> {
      this.setState({countDown: this.state.countDown - 1})
    }, 1000)
  }

  renderCodeFetcher = () => {
    if (this.state.countDown) {
      return (
        <Text style={[smsStyles.smsCodeText,
          this.props.codeText && this.props.codeText]}>
          {this.state.countDown + 's后重新获取'}
        </Text>
      )
    } else {
      this.interval && clearInterval(this.interval)
      return (
        <Text style={[smsStyles.smsCodeText, {fontSize: em(16)}, this.props.codeText && this.props.codeText]}>
          {this.props.getSmsAuthText}
        </Text>
      )
    }
  }

  requestSmsCode = () => { this.props.getSmsAuCode() }

  getSmsAuthCode = () => {
    if (this.props.reset) {
      this.setState({countDown: 0})
    } else {
      this.setState({countDown: this.props.countTimes})
      this.countDown()
    }
    this.requestSmsCode()
  }

  renderGetSmsButtonEnabled = () => {
    return (
      <TouchableOpacity style={[smsStyles.smsCodeTextContainer,
                               this.props.codeTextContainer && this.props.codeTextContainer]}
                        onPress={this.state.countDown ? ()=> {
                        } : this.getSmsAuthCode}
      >
        {this.renderCodeFetcher()}
      </TouchableOpacity>
    )
  }

  renderGetSmsButtonDisabled = () => {
    return (
      <View style={[smsStyles.smsCodeTextContainerDisable,
        this.props.codeTextContainerDisable && this.props.codeTextContainerDisable]}
      >
      {this.renderCodeFetcher()}
        </View>
    )
  }

  render() {
    return (
      <View style={[smsStyles.smsContainer, this.props.containerStyle && this.props.containerStyle]}>
        <View style={[smsStyles.smsInputContainer, this.props.inputContainer && this.props.inputContainer]}>
          <TextInput
            style={[smsStyles.smsTextInput, this.props.textInput && this.props.textInput]}
            autoFocus={this.props.autoFocus}
            placeholder={this.props.placeholder}
            placeholderTextColor={this.props.placeholderTextColor}
            maxLength={this.props.maxLength}
            value={this.props.data}
            keyboardType="numeric"
            underlineColorAndroid="transparent"
            onChangeText={(text) => this.inputChange(text)}
            autoCapitalize='none'
          />
          {this.state.countDown ? this.renderGetSmsButtonDisabled() : this.renderGetSmsButtonEnabled()}
        </View>
      </View>
    )
  }
}

SmsAuthCodeInput.defaultProps = {
  // style
  containerStyle:{},
  inputContainer:{},
  textInput:{},
  codeTextContainer:{},
  codeTextContainerDisable:{},
  smsCodeText:{},

  //button
  getSmsAuthText: '获取验证码',

  //text input
  placeholder: '请输入6位验证码',
  placeholderTextColor: '#E1E1E1',
  maxLength: 6,
  autoFocus: false,
  countTimes:60,
}

const smsStyles = StyleSheet.create({
  smsContainer: {
    height:normalizeH(50),
  },
  smsInputContainer: {
    flex: 1,
    borderRadius: 4,
    paddingLeft:normalizeW(17),
    paddingRight:normalizeW(17),
    flexDirection: 'row',
    alignItems: 'center',
  },
  smsTextInput: {
    ...THEME.base.input,
     flex: 1,
  },
  smsCodeTextContainer: {
    width:normalizeW(120),
    height:normalizeH(50),
    justifyContent: 'center',
    alignItems:'center',
    backgroundColor: THEME.base.mainColor
  },
  smsCodeTextContainerDisable: {
    width:normalizeW(120),
    height:normalizeH(50),
    justifyContent: 'center',
    alignItems:'center',
    backgroundColor: THEME.colors.light
  },
  smsCodeText: {
    fontSize: em(12),
    color: '#ffffff',
    backgroundColor: 'transparent',
  }
})

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

export default connect(mapStateToProps, mapDispatchToProps)(SmsAuthCodeInput)