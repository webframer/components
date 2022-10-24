import cn from 'classnames'
import React from 'react'
import View from './View.jsx'

/**
 * Modal - Pure Component
 */
export function Modal ({
  open,
  canClose = true,
  onClose,
  className,
  children,
}) {
  return (
    <View className={'modal fade-in' + (open ? ' active' : '')}>
      <View className='modal__backdrop no-outline'
            onClick={(canClose && onClose) ? onClose : void 0} />
      {open &&
        <View className={cn(className, 'modal__box')}>
          <View className='modal__content'>
            {children}
          </View>
        </View>}
    </View>
  )
}

export default React.memo(Modal)
