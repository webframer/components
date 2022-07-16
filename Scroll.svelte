<script>
  import { cn } from '@webframer/utils/components.js'

  export let row, fill, rtl, reverse, center, classInner, styleInner
  let className
  export { className as class }
</script>
<!-- Scroll View -->
<div class={cn(
       className, 'overflow-scroll',
       row ? 'row max-width' : 'col max-height',
       {fill, rtl, center: center && !row},
     )} {...$$restProps}>
  <div
    class={cn(
      classInner, row ? 'row min-width' : 'col min-height',
      {fill, reverse, rtl, 'margin-auto': center, pointer: $$props.onClick},
    )}
    style={styleInner}>
    <slot/>
  </div>
</div>
