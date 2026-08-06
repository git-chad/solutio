/**
 * Interaction treatment shared by text links and small controls.
 *
 * 200ms ease-out is the standard UI transition — fast enough to read as a
 * response rather than an animation, and ease-out front-loads the movement so
 * it feels immediate. The 0.97 press scale is the tactile feedback.
 *
 * Under `prefers-reduced-motion` the scale is dropped but the colour change is
 * kept: removing the feedback entirely leaves an interface feeling dead rather
 * than calm.
 */
export const INTERACTIVE =
  "transition-[color,background-color,transform] duration-200 ease-out active:scale-[0.97] motion-reduce:transition-[color,background-color] motion-reduce:active:scale-100"

/**
 * The wordmark. Shared by the header and the footer at the same size, so the
 * brand reads identically at both ends of the page.
 */
export const WORDMARK =
  "font-serif text-white tracking-[-0.02em] text-[1.625rem]/8 desktop:text-[1.875rem]/9"
