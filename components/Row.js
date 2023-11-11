import * as React from 'react'
import { createView } from './View.js'

export const [Row] = createView('row')
/**
 * @see https://webframe.app/docs/ui/components/Row
 */
const RowMemo = React.memo(Row)
RowMemo.name = Row.name
RowMemo.propTypes = Row.propTypes
export default RowMemo
