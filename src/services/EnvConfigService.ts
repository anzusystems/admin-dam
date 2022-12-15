import type { EnvConfig } from '@/types/EnvConfig'

export const envConfig: EnvConfig = {
  appEnvironment: '',
  appVersion: '',
  apiLogError: {
    enabled: false,
    apiUrl: '',
  },
  logoutCoreDamUrl: '',
  cookies: {
    refreshTokenExistsName: 'anz_rte',
    jwtPayloadName: 'anz_jp',
  },
  dam: {
    apiUrl: '',
    apiTimeout: 1,
    imageUrl: '',
  },
  notification: {
    enabled: true,
    webSocketUrl: '',
  },
}

const setEnvConfig = (data: EnvConfig) => {
  try {
    envConfig.appEnvironment = data.appEnvironment
    envConfig.appVersion = data.appVersion
    envConfig.apiLogError.enabled = data.apiLogError.enabled
    envConfig.apiLogError.apiUrl = data.apiLogError.apiUrl
    envConfig.logoutCoreDamUrl = data.logoutCoreDamUrl
    envConfig.cookies.refreshTokenExistsName = data.cookies.refreshTokenExistsName
    envConfig.cookies.jwtPayloadName = data.cookies.jwtPayloadName
    envConfig.dam.apiUrl = data.dam.apiUrl
    envConfig.dam.apiTimeout = data.dam.apiTimeout
    envConfig.dam.imageUrl = data.dam.imageUrl
    envConfig.notification.enabled = data.notification.enabled
    envConfig.notification.webSocketUrl = data.notification.webSocketUrl
  } catch (err) {
    throw new Error('Unable to load env config. Incorrect fields in json.')
  }
}

const getNavigatorLanguage = (): string => {
  return window.navigator.languages && window.navigator.languages.length
    ? window.navigator.languages[0]
    : navigator.language || 'en'
}

const onConfigError = (error: Error) => {
  const userLang = getNavigatorLanguage()
  let errorMessage = 'Fatal error. Please contact administrator.'
  if (userLang === 'sk-SK' || userLang === 'sk') {
    errorMessage = 'Fatálna chyba. Prosím kontaktujte administrátora.'
  }
  const appDiv = document.getElementById('app')
  appDiv?.insertAdjacentHTML(
    'beforeend',
    `<div style='color:red;text-align:center;font-weight:bold;margin:20px;'>${errorMessage}</div>`
  )
  console.error(error)
}

export const loadEnvConfig = (callback: () => void) => {
  fetch('/config.json?random=' + Date.now())
    .then((res) => {
      if (res.ok) {
        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Unable to load env config. Incorrect content type.')
        }
        return res.json()
      }
      throw new Error('Unable to load env config. Incorrect response code.')
    })
    .then((config) => {
      if (Object.keys(config).length < 1) {
        throw new Error('Unable to load env config. Incorrect response body.')
      }
      setEnvConfig(config)
      callback()
    })
    .catch((err) => {
      onConfigError(err)
    })
}
