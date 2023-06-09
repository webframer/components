import React from 'react'
import { createView } from './View.js'

export const [Row, RowRef] = createView('row')
export default React.memo(Row)
