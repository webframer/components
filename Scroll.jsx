import React from 'react'
import { createView } from './View.jsx'

export const [Scroll, ScrollRef] = createView('scroll')
export default React.memo(Scroll)
