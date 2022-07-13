<script>
  import { cn } from 'utils-pack/components'

  export let fill, reverse, rtl, left, right, top, bottom, center, middle
  let className
  export { className as class }
</script>
<div class={cn(className, 'col', {
  fill, reverse, rtl, left, right, top, bottom, center, middle, pointer: $$props.onClick})
  } {...$$restProps}>
  <slot/>
</div>
