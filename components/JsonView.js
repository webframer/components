import cn from 'classnames'
import * as React from 'react'
import { JSONTree } from 'react-json-tree' // do not use react-json-view because it breaks with recursive JSON and in Node.js
import { type } from '../types.js'
import defaultTheme from './JsonView.themes.js'
import { View } from './View.js'

/**
 * JSON Data Renderer for Nested Collections
 */
export function JsonView ({data, dark, open, theme, className, style, fill, ...props}) {
  if (open) props.shouldExpandNode = expandNode
  return (
    <View className={cn('json-tree', className, {fill})} style={style}>
      <JSONTree hideRoot invertTheme={!!dark} theme={theme} data={data} {...props} />
    </View>
  )
}

const expandNode = () => true

JsonView.propTypes = {
  // JSON data to display (as `Collection` of values)
  data: type.Collection.isRequired,
  // Whether to render in dark mode with inverted theme color
  dark: type.Boolean,
  // Whether to expand all nodes
  open: type.Boolean,
  // Color scheme
  theme: type.Object,
}

JsonView.defaultProps = {
  theme: defaultTheme,
}

const JsonViewMemo = React.memo(JsonView)
JsonViewMemo.name = JsonView.name
JsonViewMemo.propTypes = JsonView.propTypes
JsonViewMemo.defaultProps = JsonView.defaultProps
export default JsonViewMemo
