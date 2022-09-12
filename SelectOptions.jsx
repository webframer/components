import { ips, isObject, toList, trimSpaces } from '@webframer/js'
import cn from 'classnames'
import React from 'react'
import { Row } from './Row.jsx'
import Text from './Text.jsx'

export function SelectOptions ({
  items, multiple, search, query, value, focusIndex, onFocus, onBlur, onClick,
  addOption, noOptionsMsg,
  ...props
}) {
  const isActive = value != null ? (multiple ? (v => value.includes(v)) : (v => value === v)) : (v => false)

  function renderItem (item, i) {
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
    return <Row key={k} className={cn('select__option', {focus: focusIndex === i, selected})}
                onClick={function (e) {
                  e.stopPropagation()
                  onClick.call(this, item, ...arguments)
                }}
                onFocus={function () {onFocus.call(this, item, ...arguments)}}
                onBlur={function () {onBlur.call(this, item, ...arguments)}}
                children={<Text>{t}</Text>}
                {...props} />
  }

  return (<>
    {items.map(renderItem)}
    {addOption && renderItem(addOption, items.length)}
    {noOptionsMsg && <Row className='select__option' children={<Text>{noOptionsMsg}</Text>} />}
  </>)
}

export default React.memo(SelectOptions)

/**
 * Create addOption item for SelectOptions component to render.
 * Logic to detect if addOption message should be shown:
 *  - query exists and does not match selected values or available options
 *
 * @param {string} query - current search query
 * @param {array<any>} options - all available options from the original Select props
 * @param {string} addOptionMsg - localised string with `term` placeholder to be replaced by `query`
 * @param {any} value - Select component's selected value state
 * @returns {{text: string, value: string}|void} option - if query can be added
 */
export function addOptionItem (query, options, addOptionMsg, value) {
  query = trimSpaces(query)
  if (!query) return
  let q = query.toLowerCase()
  if (value != null && toList(value).find(v => String(v).toLowerCase() === q)) return
  if (isObject(options[0])) {
    if (options.find(o => o.text.toLowerCase() === q)) return
  } else {
    if (options.find(o => String(o).toLowerCase() === q)) return
  }
  return {text: ips(addOptionMsg, {term: query}), value: query}
}

// Keep focus within options length
export function normalizeFocusIndex (focusIndex, options) {
  focusIndex = focusIndex % options.length
  if (focusIndex < 0) focusIndex = options.length + focusIndex
  return focusIndex
}
