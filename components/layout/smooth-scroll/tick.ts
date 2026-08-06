/**
 * Timestamp of the last time the render loop advanced Lenis.
 *
 * Lenis runs with `autoRaf: false` so the canvas can tick it in a known order
 * relative to View measurement. That hands the page's scrolling to the GPU
 * loop, which is fine until the loop is not there — a renderer that fails to
 * initialise would otherwise leave the page unscrollable, which is a far worse
 * failure than losing an effect.
 *
 * The canvas stamps this each frame and a watchdog in `SmoothScroll` takes over
 * if the stamp goes stale.
 */
export const scrollTick = { last: 0 }
