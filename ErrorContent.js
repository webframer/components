import { hasListValue } from '@webframer/js'
import React, { Fragment } from 'react'
import { ErrorTable } from './ErrorTable.js'
import View from './View.js'

/**
 * Error Alert Message Content - Pure Component.
 */
export function ErrorContent ({
  items,
  ...props
}) {
  items = items.filter(v => v) // remove null errors
  // Filter out User vs Server Errors
  const serverErrors = items.filter(({
    status,
    statusCode,
    code,
  }) => (((status || statusCode || code) >= 500) || ((status || statusCode || code) == null)))
  const userErrors = items.filter(({status, statusCode, code}) => ((status || statusCode || code) < 500))
  return (
    <Fragment>
      {hasListValue(serverErrors) &&
        <View className='border radius'>
          <ErrorTable className='margin' items={serverErrors} {...props} />
        </View>
      }
      {hasListValue(userErrors) &&
        <View className={'border radius' + (hasListValue(serverErrors) ? ' margin-top' : '')}>
          <ErrorTable className='margin' items={userErrors} {...props} />
        </View>
      }
    </Fragment>
  )
}

ErrorContent.propTypes = {
  items: ErrorTable.propTypes.items,
}

export default React.memo(ErrorContent)
