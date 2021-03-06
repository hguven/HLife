/**
 * Created by wanpeng on 2016/12/21.
 */
import React, {Component} from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'
import {ButtonGroup} from 'react-native-elements'
import {initInputForm, inputFormUpdate} from '../../../action/inputFormActions'
import {getInputData} from '../../../selector/inputFormSelector'
import {em, normalizeW, normalizeH, normalizeBorder} from '../../../util/Responsive'
import THEME from '../../../constants/themes/theme1'

const male = () => <View style={{flex:1, justifyContent: 'center'}}><Text style={{alignSelf: 'center', fontSize:em(18)}}>男</Text></View>
const female = () => <View style={{flex:1, justifyContent: 'center'}}><Text style={{alignSelf: 'center',fontSize:em(18)}}>女</Text></View>

const buttons = [{ element: female }, { element: male } ]

class GenderSelector extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedIndex: 1
    }
  }
  componentDidMount() {
    let formInfo = {
      formKey: this.props.formKey,
      stateKey: this.props.stateKey,
      type: this.props.type,
      initValue: {text: (this.props.initValue? this.props.initValue: 'male')},
      checkValid: this.validInput
    }
    this.props.initInputForm(formInfo)
  }

  componentWillReceiveProps(newProps) {
    if (this.props.data != newProps.data) {
      this.setState({'selectedIndex': (newProps.data == 'male'? 1: 0)})
    }
  }

  validInput(data) {
    return {isVal:true, errMsg:"验证通过"}
  }

  updateIndex (selectedIndex) {
    let gender = ""

    if(this.state.selectedIndex != selectedIndex)
    {
      this.setState({selectedIndex})
      if (selectedIndex == 1) {
        gender = "male"
      } else {
        gender = "female"
      }
      let formInfo = {
        formKey: this.props.formKey,
        stateKey: this.props.stateKey,
        data: {text: gender}
      }
      this.props.inputFormUpdate(formInfo)
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <ButtonGroup
          onPress={(index) => this.updateIndex(index)}
          selectedIndex={this.state.selectedIndex}
          buttons={buttons}
          containerStyle={{flex: 1, marginLeft: normalizeW(17), marginRight: normalizeW(17), justifyContent: 'center', alignItems: 'center'}}
          selectedBackgroundColor={THEME.base.mainColor}
        />
      </View>

    )
  }
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

export default connect(mapStateToProps, mapDispatchToProps)(GenderSelector)


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})