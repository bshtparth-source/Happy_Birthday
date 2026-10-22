/**
 * Dev-only preview bridge for instant hot updates from the Content Studio.
 * Exclusively loaded when import.meta.env.DEV is true.
 * @param {(newContent: object) => void} applyContent
 */
export function init(applyContent) {
  function handleMessage(event) {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === 'STUDIO_PREVIEW_UPDATE' && event.data.content) {
      applyContent(event.data.content);
    }
  }

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}
