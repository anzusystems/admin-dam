const FORM_TAG_NAMES = ['input', 'textarea']

/*
 * Inputs the arrow keys do nothing to: a checkbox, which includes a switch. In other inputs the arrows move the caret.
 */
const isCheckbox = (target: HTMLElement) => target instanceof HTMLInputElement && target.type === 'checkbox'

export const keyboardEventTargetIsAnyFormElement = (keyboardEvent: KeyboardEvent, preventDefault = true) => {
  if (preventDefault) keyboardEvent.preventDefault()
  const target = keyboardEvent.target as HTMLElement
  if (target && target.tagName) {
    if (FORM_TAG_NAMES.includes(target.tagName.toLowerCase()) && !isCheckbox(target)) {
      return true
    }
    return false
  }
  return true
}

const OPEN_DIALOG_OR_MENU = '.v-dialog.v-overlay--active, .v-menu.v-overlay--active'

/**
 * Whether a dialog or menu other than `own` is open.
 * Vuetify marks every open overlay with `v-overlay--active`, but tooltips and alerts are overlays too and are excluded.
 */
export const anotherDialogOrMenuIsOpen = (own?: string) =>
  Array.from(document.querySelectorAll(OPEN_DIALOG_OR_MENU)).some((overlay) => !own || !overlay.matches(own))
