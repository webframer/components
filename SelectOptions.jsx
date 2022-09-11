import { isObject } from '@webframer/js'
import cn from 'classnames'
import React from 'react'
import { Row } from './Row.jsx'
import Text from './Text.jsx'

export function SelectOptions ({
  items, multiple, search, query, value, onFocus, onBlur, onClick, ...props
}) {
  const isActive = value != null ? (multiple ? (v => value.includes(v)) : (v => value === v)) : (v => false)
  return (<>
    {items.map((item) => {
      let t, k, selected
      if (isObject(item)) {
        const {text, value = text, key = String(value)} = item
        t = text
        k = key
        selected = isActive(value)
      } else {
        t = k = String(item)
        selected = isActive(item)
      }

      // Bolden the matched query
      if (search && query) {
        let i, q = query.toLowerCase(), text = t.toLowerCase()
        // to keep the logic simple, for now only use exact match once, case-insensitive
        if (q === text) t = <b>{t}</b>
        else if ((i = text.indexOf(q)) > -1)
          t = <>{t.substring(0, i)}<b>{t.substring(i, i + q.length)}</b>{t.substring(i + q.length)}</>
      }
      return <Row key={k} className={cn('select__option', {selected})}
                  onClick={function (e) {
                    e.stopPropagation()
                    onClick.call(this, item, ...arguments)
                  }}
                  onFocus={function () {onFocus.call(this, item, ...arguments)}}
                  onBlur={function () {onBlur.call(this, item, ...arguments)}}
                  children={<Text>{t}</Text>}
                  {...props} />
    })}
  </>)
}

export default React.memo(SelectOptions)
