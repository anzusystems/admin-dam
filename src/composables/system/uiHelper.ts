import { reactive } from 'vue'

export type ButtonName = 'create' | 'save' | 'saveAndClose' | 'delete' | 'edit' | 'status' | 'login'
export type LoaderName = 'detail' | 'list' | 'edit' | 'create'

const btn = reactive({
  create: {
    loading: false,
    disabled: false,
  },
  save: {
    loading: false,
    disabled: false,
  },
  saveAndClose: {
    loading: false,
    disabled: false,
  },
  delete: {
    loading: false,
    disabled: false,
  },
  edit: {
    loading: false,
    disabled: false,
  },
  status: {
    loading: false,
    disabled: false,
  },
  login: {
    loading: false,
    disabled: false,
  },
})

const loader = reactive({
  detail: false,
  list: false,
  edit: false,
  create: false,
})

const dialog = reactive({
  delete: false,
})

const btnReset = (...args: ButtonName[]) => {
  for (let i = 0; i < args.length; i++) {
    btn[args[i]].loading = false
    btn[args[i]].disabled = false
  }
}

const btnDisable = (...args: ButtonName[]) => {
  for (let i = 0; i < args.length; i++) {
    btn[args[i]].disabled = true
  }
}

const btnEnable = (...args: ButtonName[]) => {
  for (let i = 0; i < args.length; i++) {
    btn[args[i]].disabled = false
  }
}

const btnLoadingOn = (...args: ButtonName[]) => {
  for (let i = 0; i < args.length; i++) {
    btn[args[i]].loading = true
  }
}

const btnLoadingOff = (...args: ButtonName[]) => {
  for (let i = 0; i < args.length; i++) {
    btn[args[i]].loading = false
  }
}

const loaderOn = (name: LoaderName) => {
  loader[name] = true
}

const loaderOff = (name: LoaderName) => {
  loader[name] = false
}

const closeDeleteDialog = () => {
  dialog.delete = false
}

// Note: use only on common CRUD actions, for more complex situations create custom loading/disabled states
export function useUiHelper() {
  return {
    btn,
    btnReset,
    btnDisable,
    btnEnable,
    btnLoadingOn,
    btnLoadingOff,
    loader,
    loaderOn,
    loaderOff,
    dialog,
    closeDeleteDialog,
  }
}
