import { hasListValue, isObject } from '@webframer/js'
import cn from 'classnames'
import React from 'react'
import { renderProp } from '../react/render.js'
import { type } from '../types.js'
import { Row } from './Row.js'

/**
 * Breadcrumb links
 */
export function Breadcrumb (props) {
  const {items, className, children, ..._props} = props
  return <Row className={cn(className, 'breadcrumb')} {..._props}>
    {hasListValue(items) && items.map((item, index) => {
      if (isObject(item) && item.text) return (
        <a key={item.id || index} href={item.to} className='breadcrumb__item'>{item.text}</a>
      )
      else renderProp(item, {props, index})
    })}
    {children != null && renderProp(children, {props})}
  </Row>
}

Breadcrumb.propTypes = {
  // Breadcrumb item
  items: type.ListOf(type.OneOf([
    type.Obj({
      icon: type.String,
      text: type.String.isRequired,
      // Path name or URL to link to
      to: type.String,
    }),
    type.NodeOrFunction,
  ])),
  // Custom breadcrumb items
  children: type.NodeOrFunction,
}
export default React.memo(Breadcrumb)
