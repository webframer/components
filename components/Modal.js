import cn from 'classnames'
import React from 'react'
import View from './View.js'

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

const ModalMemo = React.memo(Modal)
ModalMemo.name = Modal.name
ModalMemo.propTypes = Modal.propTypes
ModalMemo.defaultProps = Modal.defaultProps
export default ModalMemo
