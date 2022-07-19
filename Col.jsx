import React from 'react'
import { createView } from './View.jsx'

export const Col = createView('col')
export const ColRef = React.forwardRef(Col)
export default React.memo(Col)
