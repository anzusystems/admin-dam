const FORM_TAG_NAMES = ['input', 'textarea']

export const keyboardEventTargetIsAnyFormElement = (keyboardEvent: KeyboardEvent, preventDefault = true) => {
  if (preventDefault) keyboardEvent.preventDefault()
  const target = keyboardEvent.target as HTMLElement
  if (target && target.tagName) {
    if (FORM_TAG_NAMES.includes(target.tagName.toLowerCase())) {
      return true
    }
    return false
  }
  return true
}
