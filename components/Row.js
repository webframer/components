import React from 'react'
import { createView } from './View.js'

export const [Row, RowRef] = createView('row')
const RowMemo = React.memo(Row)
RowMemo.name = Row.name
RowMemo.propTypes = Row.propTypes
export default RowMemo
