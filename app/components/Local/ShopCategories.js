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
  TouchableOpacity,
  Image,
  Platform
} from 'react-native'
import {Actions} from 'react-native-router-flux'

import {em, normalizeW, normalizeH, normalizeBorder} from '../../util/Responsive'
import THEME from '../../constants/themes/theme1'
import ShopCategory from './ShopCategory'

const PAGE_WIDTH = Dimensions.get('window').width

export default class ShopCategories extends Component {
  constructor(props) {
    super(props)
    this._initState = this._initState.bind(this)
    this._calContainer = this._calContainer.bind(this)
    this._totalRow = this._totalRow.bind(this)
    this._getCategoryWidth = this._getCategoryWidth.bind(this)
    this._getCategoryHeight = this._getCategoryHeight.bind(this)
    this.state = this._initState(this.props)
  }

  _initState(props) {
    let initState = {
      width: PAGE_WIDTH,
      height: normalizeH(183),
    }
    return initState
  }

  _calContainer(e) {
    if (this.state.height != e.nativeEvent.layout.height) {
      let width = e.nativeEvent.layout.width
      let height = e.nativeEvent.layout.height
      this.setState({
        width: width,
        height: height,
      })
    }
  }

  _totalRow() {
    let totalRow = 0
    if(this.props.shopCategories) {
      totalRow = this.props.shopCategories.length / 2
    }
    return totalRow
  }

  _getCategoryWidth() {
    let categoryWidth = this.state.width / 2
    return categoryWidth
  }

  _getCategoryHeight() {
    let categoryHeight = this.state.height / 3
    if(this.props.shopCategories) {
      let totalRow = this._totalRow()
      categoryHeight = this.state.height / totalRow
    }
    return categoryHeight
  }

  renderCategories() {
    let shopCategoriesViews = <View />
    if(this.props.shopCategories) {
      let categoryWidth = this._getCategoryWidth()
      let categoryHeight = this._getCategoryHeight()
      shopCategoriesViews = this.props.shopCategories.map((item, index)=>{
        return (
          <View
            style={{width: categoryWidth, height: categoryHeight}}
            key={'shop_category_' + index}
          >
            <ShopCategory
              imageSource={item.imageSource}
              text={item.text}
            />
          </View>
        )
      })
    }
    return shopCategoriesViews
  }

  renderRowLines() {
    let rowLineViews = null
    if(this.props.shopCategories) {
      let totalRow = this._totalRow()
      let categoryHeight = this._getCategoryHeight()
      rowLineViews = Array.apply(null,Array(totalRow - 1)).map(function(value, index){
        let _top = categoryHeight * (index + 1)
        return (
          <View style={[styles.rowLine, {top: _top}]} key={'row_line_' + index} />
        )
      })
    }
    return rowLineViews
  }

  render() {
    return (
      <View style={[styles.wrapper]} onLayout={this._calContainer}>
        {this.renderCategories()}
        <View style={[styles.colLine, {left: this.state.width / 2}]}/>
        {this.renderRowLines()}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
  },
  colLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderLeftWidth: normalizeBorder(),
    borderLeftColor: THEME.colors.lighterA
  },
  rowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: normalizeBorder(),
    borderTopColor: THEME.colors.lighterA
  },
  row: {
    flex: 1,
    flexDirection: 'row'
  },
  borderBottom: {
    borderBottomWidth: normalizeBorder(),
    borderBottomColor:THEME.colors.lighterA
  },
  

})