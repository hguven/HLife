/**
 * Created by yangyang on 2017/3/27.
 */
import React, {Component} from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  InteractionManager,
} from 'react-native'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'
import QRCode from 'react-native-qrcode'
import {Actions} from 'react-native-router-flux'
import Header from '../../common/Header'
import THEME from '../../../constants/themes/theme1'
import {em, normalizeW, normalizeH, normalizeBorder} from '../../../util/Responsive'
import {getInviteCode} from '../../../action/promoterAction'
import {inviteCode} from '../../../selector/promoterSelector'
import * as Toast from '../../common/Toast'
import {clearInviteCode} from '../../../action/promoterAction'

class InviteCodeViewer extends Component {
  constructor(props) {
    super(props)
  }

  componentWillMount() {
    InteractionManager.runAfterInteractions(()=>{
      this.props.getInviteCode({
        error: (err) => {
          Toast.show(err.message)
        }
      })
    })
  }

  renderInviteDeclareBtn() {
    return (
      <TouchableOpacity style={{paddingRight: normalizeW(15)}} onPress={()=>{Actions.INVITE_EXPLAIN()}}>
        <Image style={{width: normalizeW(18), height: normalizeH(18)}}
               source={require('../../../assets/images/explain_revernue.png')}/>
      </TouchableOpacity>
    )
  }

  render() {
    return (
      <View style={styles.container}>
        <Header leftType="icon"
                leftStyle={{color: THEME.base.mainColor}}
                leftIconName="ios-arrow-back"
                leftPress={() => {
                  this.props.clearInviteCode()
                  Actions.pop()
                }}
                title="邀请码"
                rightComponent={()=>this.renderInviteDeclareBtn()}
        />
        <View style={styles.body}>
          <View style={{marginTop: normalizeH(30), width: normalizeW(247)}}>
            <Text style={styles.tipText} numberOfLines={2}>扫一扫下面的二维码，获取邀请码或者直接输入以下邀请码</Text>
          </View>
          <View style={{marginTop: normalizeH(43)}}>
            <QRCode value={this.props.code}
                    size={normalizeW(160)}
                    bgColor='#030303'
                    fgColor='#FFF'/>
          </View>
          <View style={{flexDirection: 'row', marginTop: normalizeH(42), alignItems: 'center'}}>
            <Text style={{fontSize: em(17), color: '#4A4A4A', paddingRight: normalizeW(20)}}>邀请码</Text>
            <View style={styles.inviteTextView}>
              <Text style={styles.inviteText}>{this.props.code}</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  let code = inviteCode(state)
  return {
    code: code ? code : '',
  }
}
const mapDispatchToProps = (dispatch) => bindActionCreators({
  getInviteCode,
  clearInviteCode,
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(InviteCodeViewer)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    ...Platform.select({
      ios: {
        marginTop: normalizeH(64),
      },
      android: {
        marginTop: normalizeH(44)
      }
    }),
    flex: 1,
    alignItems: 'center',
  },
  tipText: {
    fontSize: em(15),
    color: '#AAAAAA',
    lineHeight: em(22),
    textAlign: 'center',
  },
  inviteTextView: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.base.lightColor,
    width: normalizeW(130),
    height: normalizeH(30),
  },
  inviteText: {
    color: THEME.base.mainColor,
    fontSize: em(17),
    fontWeight: 'bold',
    letterSpacing: em(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
})