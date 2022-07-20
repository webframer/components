import React from 'react'
import { createView } from './View.jsx'

export const [Col, ColRef] = createView('col')
export default React.memo(Col)
