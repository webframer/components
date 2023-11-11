import * as React from 'react'
import { createView } from './View.js'

/**
 * @see https://webframe.app/docs/ui/components/Scroll
 *
 * Scroll requirements:
 *  a). Natural layout flow.
 *  b). Overflows when necessary.
 *  c). Overflows within max available height/width.
 *  d). Scrollbar within the scrollable area.
 *
 * Design:
 *  - It was decided that it is best to force users to use Scroll component for anything scrollable,
 *    because scrollable component is best suited for app like interfaces, instead of body scroll.
 *  - Scroll max-height/width calculation logic:
 *    1. On mount, traverse up the DOM tree to offset width/height of all ancestors' siblings
 *    2. Then set max-height and max-width for the direct parent element.
 *    3. On unmount reset the parent element style.
 *
 * Scroll CSS challenges:
 *  1. Wrapper flex with min-height/width inner flex
 *    @see: https://codepen.io/JosephSilber/pen/AEBLrR
 *    + Natural layout flow (takes only min-content needed - does not require explicit width/height)
 *    + Overflows when necessary.
 *    + Overflows within max available height.
 *    + Scrollbar within the scrollable area.
 *    => this works because max-height/width: '100%' within flex automatically deducts siblings.
 *    => the trick then is to guarantee correct max-height/width of the direct parent.
 *
 *    - The parent container of the scrollable must have max-height/width calculated if there are
 *      non-scrollable siblings in it, else the last children in it will get cut off when scrollable
 *      overflows.
 *    - requires all parent containers with the same flex-direction (up to the root) to have:
 *      { // these can be default behaviors for all views, since we are building apps
 *        max-height: 100%;
 *      } // may not be needed if max-height is set using pixels for the direct parent.
 *    => logic: only the direct parent of scrollable needs correct max-height/width set.
 *    => manual fix is no go solution, because it's too hard for newbies, or even pros.
 *    => or force users to set max-height/width offset manually (unfriendly interface, but works)
 *    => write script to detect available width/height of direct parent container after component
 *       did mount/update, then subtract the difference as max-size.
 *
 *  2. Position absolute within a wrapper flex
 *    @see: https://stackoverflow.com/questions/7060009/css-max-height-remaining-space
 *    + Overflows when necessary
 *    + Overflows within max available height (without setting max-height)
 *
 *    - Unnatural layout flow: requires the dimension along parent layout direction to be set
 *      (if within a row parent, it requires width set, else the scrollable wrap collapses to 0).
 *      -> this problem is recursive, and gets very complex in different row/col layouts.
 *    - Scrollbar outside the scrollable area, because of issues above (usually only .fill works).
 */
export const [Scroll] = createView('scroll')
const ScrollMemo = React.memo(Scroll)
ScrollMemo.name = Scroll.name
ScrollMemo.propTypes = Scroll.propTypes
export default ScrollMemo
