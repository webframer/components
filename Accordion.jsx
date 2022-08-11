import cn from 'classnames'
import View from './View.jsx'

export function Accordion ({className, ...props}) {
  return <View className={cn(className, 'accordion')} {...props} />
}
