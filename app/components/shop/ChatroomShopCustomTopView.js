/**
 * Created by zachary on 2016/12/13.
 */
import React, {Component} from 'react'
import {
  StyleSheet,
  View,
  InteractionManager,
  Text,
  Dimensions,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'
import {Actions} from 'react-native-router-flux'
import {em, normalizeW, normalizeH, normalizeBorder} from '../../util/Responsive'
import THEME from '../../constants/themes/theme1'
import ScoreShow from '../common/ScoreShow'

const PAGE_WIDTH = Dimensions.get('window').width
const PAGE_HEIGHT = Dimensions.get('window').height

export default class ChatroomShopCustomTopView extends Component {
	constructor(props) {
    super(props)
  }

  render() {
  	let shopInfo = this.props.shopInfo
  	let shopTag = null
    if(shopInfo.containedTag && shopInfo.containedTag.length) {
      shopTag = shopInfo.containedTag[0].name
    }

    return (
      <TouchableOpacity style={styles.container} onPress={()=>{Actions.pop()}}>
        <View style={[styles.shopInfoWrap]}>
          <View style={styles.coverWrap}>
            <Image style={styles.cover} source={{uri: shopInfo.coverUrl}}/>
          </View>
          <View style={styles.shopIntroWrap}>
            <View style={styles.shopInnerIntroWrap}>
              <Text style={styles.shopName} numberOfLines={1}>{shopInfo.shopName}</Text>
              <ScoreShow
                containerStyle={{flex:1}}
                score={shopInfo.score}
                bgColor='grey'
              />
              <View style={styles.subInfoWrap}>
                {shopTag &&
                 <Text style={[styles.subTxt]}>{shopTag}</Text>
                }
                <View style={{flex:1,flexDirection:'row'}}>
                  <Text style={styles.subTxt}>{shopInfo.geoDistrict && shopInfo.geoDistrict}</Text>
                </View>
                {shopInfo.distance &&
                  <Text style={[styles.subTxt]}>{shopInfo.distance + shopInfo.distanceUnit}</Text>
                }
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

}

const styles = StyleSheet.create({
	container: {
		height: normalizeH(80),
		backgroundColor:'#f5f5f5',
		width:PAGE_WIDTH,
		marginBottom:8
	},
	shopInfoWrap: {
    flex: 1,
    flexDirection: 'row',
    padding: normalizeW(10),
    paddingBottom:15,
    backgroundColor: '#f5f5f5',
  },
  coverWrap: {
    width: normalizeW(60),
    height: normalizeH(60)
  },
  cover: {
    flex: 1
  },
  shopIntroWrap: {
    flex: 1,
    paddingLeft: normalizeW(5),
  },
  shopInnerIntroWrap: {
    height: normalizeH(60),
  },
  shopName: {
    fontSize: em(15),
    color: '#5a5a5a'
  },
  subInfoWrap: {
    flexDirection: 'row',
  },
  subTxt: {
    marginRight: normalizeW(5),
    color: '#d8d8d8',
    fontSize: em(10)
  },
})