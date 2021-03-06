/**
 * Created by lilu on 2017/5/31.
 */
import React, {Component} from 'react'
import {
  StyleSheet,
  Text,
  View,
  ListView,
  Image,
  TouchableHighlight,
  Animated,
  ScrollView,
  Dimensions,
  Timer,
  TouchableWithoutFeedback,
  ToastAndroid,
} from 'react-native'
import {CachedImage} from "react-native-img-cache"
import {em, normalizeW, normalizeH, normalizeBorder} from '../../util/Responsive'
import shallowequal from 'shallowequal'

import {Actions} from 'react-native-router-flux'

const PAGE_WIDTH = Dimensions.get('window').width
const PAGE_HEIGHT = Dimensions.get('window').height

export default class ViewPager extends Component {

  constructor() {
    super()
    this.state = {
      selectedPage: 0,
    }
  }

  componentDidMount() {
    if (this.props.dataSource.length > 0) {
      this.showPage(0, false)
      this.timer = setTimeout(()=>{
        this.showPage(this.state.selectedPage + 1, true)
      }, 3000)
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer)
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (!shallowequal(this.props.dataSource, nextProps.dataSource)) {
      return true;
    }
    if (!shallowequal(this.state, nextState)) {
      return true;
    }
    return false;
  }

  handleScroll = (event) => {
    const offset = event.nativeEvent.contentOffset.x - PAGE_WIDTH
    if (offset % PAGE_WIDTH == 0) {
      let pageIndex = offset / PAGE_WIDTH
      if (pageIndex == -1) {
        pageIndex = this.props.dataSource.length - 1
        this.showPage(pageIndex, false)
      }
      else if (pageIndex == this.props.dataSource.length) {
        pageIndex = 0
        this.showPage(pageIndex, false)
      }

      //Update the page indicator according to pageIndex
      this.setState({
        selectedPage: pageIndex
      })

      clearTimeout(this.timer)
      this.timer = setTimeout(()=>{
        this.showPage(this.state.selectedPage + 1, true)
      }, 5000)
    }
  }

  showPage = (pageIndex, animated = false) => {
    const offset = pageIndex * PAGE_WIDTH + PAGE_WIDTH
    this._scrollView.scrollTo({x: offset, y: 0, animated: animated})
  }

  renderFirstImage = () => {
    let length = this.props.dataSource.length
    if (length > 0) {
      return (
        this.renderPage(this.props.dataSource[length-1], length - 1)
      )
    } else {
      return <View />
    }
  }

  renderLastImage = () => {
    let length = this.props.dataSource.length
    if (length > 0) {
      return (
        this.renderPage(this.props.dataSource[0], 0)
      )
    } else {
      return <View />
    }
  }

  renderPage = (data, key) => {
    let actionType = data.actionType
    let action = data.action
    let title = data.title
     // console.log('action==========>',action)
    let payload = {
      url: action,
      showHeader: !!title,
      headerTitle: title,
      headerRightType: 'image',
      headerRightImageSource: require('../../assets/images/active_share.png'),
      headerRightPress: () => {Actions.SHARE({
        title: "汇邻优店",
        url: action,
        author: '邻家小二',
        abstract: "邻里互动，同城交易",
        cover: "https://simors.github.io/ljyd_blog/ic_launcher.png",
      })},
    }
    // console.log('payload==========>',payload)

    return (
      <TouchableWithoutFeedback
        key={key}
        onPress={()=> {
        //  console.log('data is ',data)
          if(actionType == 'link'){
            //console.log('here is touch',{payload})
            Actions.COMMON_WEB_VIEW({...payload})
          }
          else if(data.type == 'feed'){
            Actions.FEED_DETAIL({feedId: data.content.feedId, isOneWord: false})
          }else if (data.type == 'group'){
            Actions.GROUP_CONTENT({
              name: data.content.groupName,
              groupId: data.content.groupId,
              abstUser: data.content.abstUser
            })
          }
        }}>
        <CachedImage
          mutable
          style={[{width:PAGE_WIDTH,height: normalizeH(223)}]}
          resizeMode="stretch"
          source={typeof(data.image) == 'string' ? {uri: data.image} : data.image}
        />
      </TouchableWithoutFeedback>
    )
  }

  renderIndicator = () => {
    if (this.props.dataSource.length > 0) {
      return (
        <View style={styles.pagerContainer}>
          {this.props.dataSource.map((img, index)=> {
            return (
              <View key={index} style={styles.pager}>
                <View style={[
                  styles.pagerDot,
                  this.state.selectedPage == index ?
                    styles.pagerDotSelected : styles.pagerDotUnselected
                ]}/>
              </View>
            )
          })}
        </View>
      )
    }
  }

  render() {
    return (
      <View>
        <ScrollView
          style={styles.scrollView}
          ref={(scrollView)=> {
            this._scrollView = scrollView
          }}
          horizontal={true}
          decelerationRate={0}
          pagingEnabled={true}
          showsHorizontalScrollIndicator={false}
          onScroll={this.handleScroll}
          scrollEventThrottle={16}
        >
          {this.renderFirstImage()}
          {
            this.props.dataSource.map((data, index) => {
              return (
                this.renderPage(data, index)
              )
            })
          }
          {this.renderLastImage()}
        </ScrollView>
        {this.renderIndicator()}
      </View>
    );
  }
}

var styles = StyleSheet.create({
  scrollView: {
    backgroundColor: 'white',
  },
  page: {
    width: PAGE_WIDTH,
    height: PAGE_WIDTH / 2,
    resizeMode: 'cover'
  },
  pagerContainer: {
    position: 'absolute',
    left: 0,
    right: 10,
    bottom: 10,
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  pager: {
    paddingLeft: 4,
    paddingRight: 4,
  },
  pagerDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  pagerDotSelected: {
    backgroundColor: "#ffffff",
  },
  pagerDotUnselected: {
    backgroundColor: '#ffffff',
    opacity: 0.4
  }
});
