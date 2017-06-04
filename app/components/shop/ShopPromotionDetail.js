/**
 * Created by zachary on 2016/12/13.
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
  TouchableWithoutFeedback,
  Image,
  Platform,
  InteractionManager,
  TextInput,
  Modal,
} from 'react-native'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'
import {Actions} from 'react-native-router-flux'
import Header from '../common/Header'
import {em, normalizeW, normalizeH, normalizeBorder} from '../../util/Responsive'
import THEME from '../../constants/themes/theme1'
import * as Toast from '../common/Toast'
import * as authSelector from '../../selector/authSelector'
import {fetchShopPromotionDetail, fetchUserOwnedShopInfo} from '../../action/shopAction'
import {selectShopPromotionDetail} from '../../selector/shopSelector'
import ArticleViewer from '../common/Input/ArticleViewer'
import {PERSONAL_CONVERSATION} from '../../constants/messageActionTypes'
import ChatroomShopPromotionCustomTopView from './ChatroomShopPromotionCustomTopView'
import {fetchUsers} from '../../action/authActions'
import {DEFAULT_SHARE_DOMAIN} from '../../util/global'
import {fetchShareDomain} from '../../action/configAction'
import {getShareDomain} from '../../selector/configSelector'
import {SHAREURL} from '../../util/global'
import {BUY_GOODS} from '../../constants/appConfig'

const PAGE_WIDTH = Dimensions.get('window').width
const PAGE_HEIGHT = Dimensions.get('window').height

class ShopPromotionDetail extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showPayModal: false,
      buyAmount: '1',
    }
  }

  componentWillMount() {
    InteractionManager.runAfterInteractions(()=>{
      //this.props.fetchUserOwnedShopInfo()
      this.props.fetchShopPromotionDetail({id: this.props.id})
      this.props.fetchShareDomain()
    })
  }

  componentDidMount() {

  }

  componentWillReceiveProps(nextProps) {

  }

  customTopView() {
    return (
      <ChatroomShopPromotionCustomTopView
        shopPromotionInfo={this.props.shopPromotionDetail}
        userId={this.props.currentUser}
      />
    )
  }

  onIWantPress() {
    if(!this.props.isUserLogined) {
      Actions.LOGIN()
    }else {
      let shopPromotionDetail = this.props.shopPromotionDetail
      let targetShop = shopPromotionDetail.targetShop

      this.props.fetchUsers({userIds: [targetShop.owner.id]})

      let payload = {
        name: targetShop.owner.nickname,
        members: [this.props.currentUser, targetShop.owner.id],
        conversationType: PERSONAL_CONVERSATION,
        title: targetShop.shopName,
        customTopView: this.customTopView(),
        // title: targetShop.owner.nickname,
      }
      Actions.CHATROOM(payload)
    }
  }

  onPaymentPress() {
    this.setState({showPayModal: false})
    let amount = this.state.buyAmount
    if (Math.floor(amount) != amount) {
      Toast.show('购买数量只能是整数')
      return
    }
    let shopPromotionDetail = this.props.shopPromotionDetail
    Actions.PAYMENT({
      title: '商家活动支付',
      price: shopPromotionDetail.promotingPrice * Number(amount),
      metadata: {
        'fromUser': this.props.currentUser,
        'toUser': shopPromotionDetail.targetShop.owner.id,
        'dealType': BUY_GOODS
      },
      subject: '购买汇邻优店商品费用',
      paySuccessJumpScene: 'BUY_GOODS_OK',
      paySuccessJumpSceneParams: {
      },
      payErrorJumpBack: true,
    })
  }

  onShare = () => {
    let shareUrl = this.props.shareDomain? this.props.shareDomain + "shopPromotionShare/" + this.props.id:
      DEFAULT_SHARE_DOMAIN + "shopPromotionShare/" + this.props.id

    console.log("shopPromotionShare url:", shareUrl)

    Actions.SHARE({
      title: this.props.shopPromotionDetail.title,
      url: shareUrl,
      author: this.props.shopPromotionDetail.targetShop.shopName,
      abstract: this.props.shopPromotionDetail.abstract,
      cover: this.props.shopPromotionDetail.coverUrl,
    })
  }

  openPaymentModal() {
    if (!this.props.isUserLogined) {
      Actions.LOGIN()
    } else {
      this.setState({showPayModal: true})
    }
  }

  renderPaymentModal() {
    return (
      <View>
        <Modal
          visible={this.state.showPayModal}
          transparent={true}
          animationType='fade'
          onRequestClose={()=>{this.setState({showPayModal: false})}}
        >
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)'}}>
            <View style={{backgroundColor: '#FFF', borderRadius: 10, alignItems: 'center'}}>
              <View style={{paddingBottom: normalizeH(20), paddingTop: normalizeH(20)}}>
                <Text style={{fontSize: em(20), color: '#5A5A5A', fontWeight: 'bold'}}>设置购买数量</Text>
              </View>
              <View style={{paddingBottom: normalizeH(15), flexDirection: 'row', alignItems: 'center'}}>
                <Text style={{fontSize: em(17), color: THEME.base.mainColor, paddingRight: 8}}>数量：</Text>
                <TextInput
                  placeholder='输入数量'
                  underlineColorAndroid="transparent"
                  onChangeText={(text) => this.setState({buyAmount: text})}
                  value={this.state.buyAmount}
                  keyboardType="numeric"
                  maxLength={6}
                  style={{
                    height: normalizeH(42),
                    fontSize: em(17),
                    textAlignVertical: 'center',
                    textAlign: 'right',
                    borderColor: '#0f0f0f',
                    width: normalizeW(80),
                    paddingRight: normalizeW(15),
                  }}
                />
                <Text style={{fontSize: em(17), color: '#5A5A5A', paddingLeft: 8}}>份</Text>
              </View>
              <View style={{width: PAGE_WIDTH-100, height: normalizeH(50), padding: 0, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: '#F5F5F5'}}>
                <View style={{flex: 1, borderRightWidth: 1, borderColor: '#F5F5F5'}}>
                  <TouchableOpacity style={{flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}
                                    onPress={() => this.setState({showPayModal: false})}>
                    <Text style={{fontSize: em(17), color: '#5A5A5A'}}>取消</Text>
                  </TouchableOpacity>
                </View>
                <View style={{flex: 1}}>
                  <TouchableOpacity style={{flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}
                                    onPress={() => this.onPaymentPress()}>
                    <Text style={{fontSize: em(17), color: THEME.base.mainColor}}>确定</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    )
  }

  render() {
    let shopPromotionDetail = this.props.shopPromotionDetail
    let targetShop = shopPromotionDetail.targetShop

    return (
      <View style={styles.container}>
        <Header
          leftType="icon"
          leftIconName="ios-arrow-back"
          leftPress={() => Actions.pop()}
          title="活动详情"
          rightComponent={()=>{
            return (
              <TouchableOpacity onPress={this.onShare} style={{marginRight:10}}>
                <Image source={require('../../assets/images/active_share.png')}/>
              </TouchableOpacity>
            )
          }}
        />
        <View style={styles.body}>
          <ScrollView>
            <View style={styles.headerWrap}>
              <View style={styles.titleBox}>
                <Text style={styles.titleTxt}>{shopPromotionDetail.title}</Text>
              </View>
              <View style={styles.typeBox}>
                <View style={styles.typeInnerBox}>
                  <Text style={styles.typeTxt}>{shopPromotionDetail.type}</Text>
                </View>
                <View style={styles.typeDescBox}>
                  <Text numberOfLines={1} style={styles.typeDescTxt}>{shopPromotionDetail.typeDesc}</Text>
                </View>
                {false
                  ? <Text style={styles.pvTxt}>{shopPromotionDetail.pv}人看过</Text>
                  : null
                }
              </View>
            </View>
            <View style={styles.shopInfoWrap}>
              <Text numberOfLines={1} style={[styles.shopInfoTxt, styles.shopNameTxt, {maxWidth: PAGE_WIDTH/2}]}>{targetShop.shopName}</Text>
              <Text style={styles.shopInfoTxt}>{targetShop.distance + targetShop.distanceUnit}</Text>
              <View style={styles.shopBtnContainer}>
                <TouchableOpacity style={styles.shopBtnBox} onPress={()=>{Actions.SHOP_DETAIL({id: targetShop.id})}}>
                  <Text style={styles.shopBtnTxt}>进入店铺</Text>
                  <Image source={require('../../assets/images/arrow_right.png')}/>
                </TouchableOpacity>
              </View>
            </View>
            {shopPromotionDetail.promotionDetailInfo &&
              <ArticleViewer artlcleContent={JSON.parse(shopPromotionDetail.promotionDetailInfo)} />
            }
          </ScrollView>
          <View style={styles.footerWrap}>
            <View style={styles.priceBox}>
              <Text style={styles.priceTxt}>￥{shopPromotionDetail.promotingPrice}</Text>
            </View>
            <TouchableOpacity style={{flex: 1}} onPress={()=>{this.onIWantPress()}}>
              <View style={{justifyContent: 'center', alignItems: 'center'}}>
                <Image style={{width:24,height:24}} resizeMode='contain' source={require('../../assets/images/message.png')}/>
                <Text style={{fontSize: em(10), color: '#aaa', paddingTop: normalizeH(5)}}>我想要</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerBtnBox} onPress={()=>{this.openPaymentModal()}}>
              <Image source={require('../../assets/images/reward.png')}/>
              <Text style={styles.footerBtnTxt}>去支付</Text>
            </TouchableOpacity>
          </View>
        </View>

        {this.renderPaymentModal()}

      </View>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const shopPromotionDetail = selectShopPromotionDetail(state, ownProps.id)
  // console.log('shopPromotionDetail=====>>>>>', shopPromotionDetail)
  const isUserLogined = authSelector.isUserLogined(state)

  let shareDomain = getShareDomain(state)
  return {
    shopPromotionDetail: shopPromotionDetail,
    isUserLogined: isUserLogined,
    currentUser: authSelector.activeUserId(state),
    shareDomain: shareDomain,
  }
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchShopPromotionDetail,
  fetchUserOwnedShopInfo,
  fetchUsers,
  fetchShareDomain
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(ShopPromotionDetail)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footerWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    backgroundColor: '#fafafa'
  },
  priceBox: {
    flex: 1,
  },
  priceTxt: {
    color: '#FF7819',
    fontSize: em(24),
    fontWeight: 'bold'
  },
  footerBtnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9D4E',
    padding: 15,
    paddingLeft: 25,
    paddingRight: 25,
  },
  footerBtnTxt: {
    fontSize: em(15),
    color: 'white',
    marginLeft: 8
  },
  body: {
    marginTop: normalizeH(64),
    flex: 1,
    backgroundColor: 'white',
    paddingBottom:50
  },
  headerWrap: {
    padding: 15
  },
  titleBox: {
    marginBottom: 15
  },
  titleTxt: {
    color: '#5a5a5a',
    fontSize: em(17),
    lineHeight: em(24),
    fontWeight: 'bold'
  },
  typeBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeInnerBox: {
    padding: 4,
    paddingLeft: 8,
    paddingRight: 8,
    backgroundColor: '#F6A623',
    marginRight: 8,
    borderRadius: 2
  },
  typeTxt: {
    color: 'white',
    fontSize: em(15),
    fontWeight: 'bold'
  },
  typeDescBox: {
    flex: 1,
  },
  typeDescTxt: {
    color: '#5a5a5a',
    fontSize: em(15),
  },
  pvTxt: {
    color: '#aaa',
    fontSize: em(12),
  },
  shopInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: normalizeBorder(),
    borderTopColor: '#f5f5f5',
    borderBottomWidth: normalizeBorder(),
    borderBottomColor: '#f5f5f5',
  },
  shopInfoTxt: {
    color: '#5a5a5a',
    fontSize: em(12),
  },
  shopNameTxt: {
    marginLeft: 15,
    marginRight: 15,
  },
  shopBtnContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  shopBtnBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    paddingLeft: 16,
    paddingRight: 16,
  },
  shopBtnTxt: {
    color: '#FF7819',
    fontSize: em(15),
    marginRight: 8
  }

})