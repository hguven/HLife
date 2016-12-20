/**
 * Created by zachary on 2016/12/13.
 */
import React, {Component} from 'react'
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Image
} from 'react-native'
import {em, normalizeW, normalizeH} from '../../util/Responsive'
import Channel from './Channel'
import {Actions} from 'react-native-router-flux'

export default class Channels extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <View style={{flexDirection: 'row',height: normalizeH(180),}}>
        <View style={{backgroundColor: 'white', width: normalizeW(174)}}>
          <Channel
            sourceImage={{uri: this.props.topics[0].image}}
            channelTitle={this.props.topics[0].title}
            channelIntro={this.props.topics[0].introduction}
            onPress={()=> {
              Actions.LOGIN()
            }}/>
        </View>
        <View style={{backgroundColor: 'white', flex: 1}}>
          <Channel channelTitleStyle={styles.channelTitleStyle}
                   channelIntroStyle={styles.channelIntroStyle}
                   channelImageStyle={styles.channelImageStyle}
                   channelRightStyle={styles.channelTopStyle}
                   sourceImage={{uri: this.props.topics[1].image}}
                   channelTitle={this.props.topics[1].title}
                   channelIntro={this.props.topics[1].introduction}
                   onPress={()=> {
                     Actions.LOGIN()
                   }}/>
          <Channel channelTitleStyle={styles.channelTitleStyle}
                   channelIntroStyle={styles.channelIntroStyle}
                   channelImageStyle={styles.channelImageStyle}
                   channelRightStyle={styles.channelTopStyle}
                   sourceImage={{uri: this.props.topics[2].image}}
                   channelTitle={this.props.topics[2].title}
                   channelIntro={this.props.topics[2].introduction}
                   onPress={()=> {
                     Actions.LOGIN()
                   }}/>
        </View>
        <View style={{backgroundColor: 'white', flex: 1}}>
          <Channel channelTitleStyle={styles.channelTitleStyle}
                   channelIntroStyle={styles.channelIntroStyle}
                   channelImageStyle={styles.channelImageStyle}
                   channelRightStyle={styles.channelTopStyle}
                   sourceImage={{uri: this.props.topics[3].image}}
                   channelTitle={this.props.topics[3].title}
                   channelIntro={this.props.topics[3].introduction}
                   onPress={()=> {
                     Actions.LOGIN()
                   }}/>
          <Channel channelTitleStyle={styles.channelTitleStyle}
                   channelIntroStyle={styles.channelIntroStyle}
                   channelImageStyle={styles.channelImageStyle}
                   channelRightStyle={styles.channelTopStyle}
                   sourceImage={{uri: this.props.topics[4].image}}
                   channelTitle={this.props.topics[4].title}
                   channelIntro={this.props.topics[4].introduction}
                   onPress={()=> {
                     Actions.LOGIN()
                   }}/>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({

  channelTitleStyle: {
    marginTop: normalizeH(8),
    fontSize: em(15),
    color: '#636363'
  },
  channelIntroStyle: {
    marginTop: normalizeH(4),
    fontSize: em(10),
    color: '#ababab'
  },
  channelTopStyle:{
    height:normalizeH(47),
    alignItems: 'flex-start',
    backgroundColor:'rgba(255, 255, 255, 0.7)',
    paddingLeft:4
  },
  channelImageStyle: {
    width: normalizeW(100),
    height:  normalizeH(63),
    marginBottom:0,
  },
})