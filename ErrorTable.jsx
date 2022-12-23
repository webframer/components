import { _, get, hasListValue, l, translate } from '@webframer/js'
import cn from 'classnames'
import React from 'react'
import { type } from './types.js'

/**
 * Error Table Listing - Pure Component.
 */
export function ErrorTable ({
  items,
  inverted,
  striped,
  className,
  ...props
}) {
  const hasId = !!get(items, '[0].id')
  const hasStatus = !!get(items, '[0].status') || !!get(items, '[0].statusCode') || !!get(items, '[0].code')
  const hasTitle = !!get(items, '[0].title') || !!get(items, '[0].error')
  return (
    <table className={cn(className, {inverted, striped})}  {...props}>
      <thead className='font-normal'>
      <tr>
        {hasId && <th>{_.ERROR_ID}</th>}
        {hasStatus && <th>{_.STATUS}</th>}
        {hasTitle && <th>{_.ERROR}</th>}
        <th>{_.MESSAGE}</th>
      </tr>
      </thead>
      <tbody>
      {hasListValue(items) &&
        items.map(({id, status, statusCode, code, title, error, content, detail, message, msg, ...data}, index) => (
          <tr key={id || index}>
            {hasId && <td scope='row' className='font-smaller'>{id}</td>}
            {hasStatus && <td>{status || statusCode || code}</td>}
            {hasTitle && <td>{title || error}</td>}
            <td style={styleMsg}>
              {content || detail || message || msg || get(data, 'details[0].message', String(items[index]))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

ErrorTable.propTypes = {
  items: type.ListOf(type.OneOf([
    type.String,
    type.Number,
    type.Obj({
      id: type.Any,
      status: type.Number,
      title: type.String,
      detail: type.String,
      message: type.String,
    }),
  ])).isRequired,
}

export default React.memo(ErrorTable)

const styleMsg = {wordBreak: 'break-word'}

translate({
  ERROR: {
    [l.ENGLISH]: 'Error',
  },
  ERROR_ID: {
    [l.ENGLISH]: 'Error ID',
  },
  MESSAGE: {
    [l.ENGLISH]: 'Message',
  },
  STATUS: {
    [l.ENGLISH]: 'Status',
  },
})
