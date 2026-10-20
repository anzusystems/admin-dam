const FORM_TAG_NAMES = ['input', 'textarea']

/* Inputs the arrow keys do nothing to: a checkbox, and a switch, which is one as well. Text typed into the others
 * moves its caret by them. */
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
 * Whether a dialog or a menu is open, the one that matches `own` aside. Vuetify marks every open overlay with
 * `v-overlay--active`; a tooltip and an alert are overlays as well, and are neither.
 */
export const anotherDialogOrMenuIsOpen = (own?: string) =>
  Array.from(document.querySelectorAll(OPEN_DIALOG_OR_MENU)).some((overlay) => !own || !overlay.matches(own))
