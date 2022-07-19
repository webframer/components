import React from 'react'
import { createView } from './View.jsx'

export const Row = createView('row')
export const RowRef = React.forwardRef(Row)
export default React.memo(Row)
