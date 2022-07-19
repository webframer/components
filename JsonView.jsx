import cn from 'classnames'
import React from 'react'
import JsonTree from 'react-json-tree' // do not use react-json-view because it breaks with recursive JSON and in Node.js
import Col from './Col.jsx'
import defaultTheme from './JsonView.themes.js'
import { type } from './types.js'

/**
 * Json nested Object Renderer - Pure Component.
 *
 * @param {Object|Array} data - collection to render
 * @param {Boolean} [inverted] - whether to render inverse background color, default is false
 * @param {Boolean} [expanded] - whether to expand all nested nodes, default is false
 * @param {Object} [theme] - color definitions
 * @param {String} [className] - css class name
 * @param {Object} [style] - css styles
 * @param {Boolean} [fill] - css styles
 * @param {*} props - other attributes to pass to `<div></div>`
 * @returns {Object} - React Component
 */
export function JsonView ({
  data,
  inverted,
  expanded,
  theme,
  className,
  style,
  fill,
  ...props
}) {
  if (expanded) props.shouldExpandNode = expandNode
  return (
    <Col className={cn('json-tree', className, {fill})} style={style}>
      <JsonTree hideRoot invertTheme={!inverted} theme={theme} data={data} {...props} />
    </Col>
  )
}

const expandNode = () => true

JsonView.propTypes = {
  // JSON data to show as JavaScript Object
  data: type.Collection.isRequired,
  theme: type.Object,
}

JsonView.defaultProps = {
  theme: defaultTheme,
}

export default React.memo(JsonView)
