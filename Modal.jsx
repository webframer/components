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
    <View className={'app__modal fade-in' + (open ? ' active' : '')}>
      <View className='app__modal__backdrop no-outline'
            onClick={(canClose && onClose) ? onClose : void 0} />
      {open &&
        <View className={cn(className, 'app__modal__box')}>
          <View className='app__modal__box__content'>
            {children}
          </View>
        </View>}
    </View>
  )
}

export default React.memo(Modal)
