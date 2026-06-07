/** Alt+Shift+L / Option+Shift+L — use `code` so macOS Option layouts still match. */
export function isLiteratureEditShortcut(event: KeyboardEvent): boolean {
  if (event.repeat || event.metaKey || event.ctrlKey) {
    return false;
  }
  return event.altKey && event.shiftKey && event.code === "KeyL";
}
