import cn from 'classnames'
import * as React from 'react'
import { type } from '../types.js'
import View from './View.js'

/**
 * Modal to overlay content with a closable popup screen
 */
export function Modal ({
  open,
  canClose,
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

Modal.defaultProps = {
  canClose: true,
}

Modal.propTypes = {
  // Whether to allow closing of the Modal
  canClose: type.Boolean,
  // Whether to open the Modal (i.e. set it to `active`)
  open: type.Boolean,
  // Callback (e: Event) => void  for Modal close event
  onClose: type.Function,
}

const ModalMemo = React.memo(Modal)
ModalMemo.name = Modal.name
ModalMemo.propTypes = Modal.propTypes
ModalMemo.defaultProps = Modal.defaultProps
export default ModalMemo
