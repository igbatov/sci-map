// These ROOT_WIDTH and ROOT_HEIGHT is used only to scale to a device window proportionally,
// An actual proportion and border of map is hardcoded in store/tree ROOT_WIDTH/ROOT_HEIGHT/ROOT_BORDER
export default {
  ROOT_WIDTH:
    (typeof window === 'undefined') ? 1000 : (window.innerWidth > window.innerHeight
      ? 0.7 * window.innerWidth
      : 1.5 * 0.95 * window.innerWidth),
  ROOT_HEIGHT:
    (typeof window === 'undefined') ? 1000 : (window.innerWidth > window.innerHeight
      ? 0.95 * window.innerHeight
      : 1.5 * window.innerHeight),
  ROOT_CENTER_X:
    (typeof window === 'undefined') ? 500 : (window.innerWidth > window.innerHeight
      ? 0.3 * window.innerWidth + (0.7 * window.innerWidth) / 2
      : window.innerWidth / 2),
  ROOT_CENTER_Y:
    (typeof window === 'undefined') ? 500 : (window.innerWidth > window.innerHeight
      ? window.innerHeight / 2
      : (0.75 * window.innerHeight) / 2),
  ST_WIDTH: 1000,
  ST_HEIGHT: 1000,
}
