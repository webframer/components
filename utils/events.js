import { isFunction } from '@webframer/utils'

/**
 * Spread Event Handler Props ('onClick', etc) for Svelte element
 * @example:
 *    <div use:onEvents={$$restProps} {...removeEvents($$restProps)}>...</div>
 * @note:
 *    - Svelte does not pass down directives as props
 *      <Component on:click={will_not_be_in_$$props} />
 *    - use cameCase event names, like React convention ('onClick')
 *
 * @param {HTMLElement} node - DOM element
 * @param {object} props - containing event handlers
 * @param {string} [startWith]
 * @returns {{update(*): void, destroy(): void}}
 */

export function onEvents (node, props, startWith = 'on') {
  let prefixLength = startWith.length
  let _props = props
  let events = Object.keys(props).filter(key => key.startsWith(startWith) && isFunction(props[key]))
  const addEvt = (e, f) => node.addEventListener(e, f)
  const remEvt = (e, f) => node.removeEventListener(e, f)
  const setup = key => addEvt(key.substring(prefixLength).toLowerCase(), _props[key])
  const teardown = key => remEvt(key.substring(prefixLength).toLowerCase(), _props[key])
  events.map(setup)

  return {
    update (props) {
      events.forEach(teardown)
      _props = props
      events = Object.keys(props).filter(key => key.startsWith(startWith) && isFunction(props[key]))
      events.forEach(setup)
    },
    destroy () {
      events.forEach(teardown)
    },
  }
}

/**
 * Filter out on<Event> props - for use alongside `use:onEvents`
 */
export function removeEvents ({ ...props }, startWith = 'on') {
  for (const key in props) {
    if (key.startsWith(startWith) && isFunction(props[key])) delete props[key]
  }
  return props
}
