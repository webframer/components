import React from 'react'
import { createView } from './View.jsx'

export const [Row, RowRef] = createView('row')
export default React.memo(Row)
