import { useWebSocket } from '@vueuse/core'
import { envConfig } from '@/services/EnvConfigService'
import { useAlerts } from '@/composables/system/alerts'
import { i18n } from '@/plugins/i18n'

const notificationEventTarget = new EventTarget()
const { t } = i18n.global || i18n

export function useNotification() {
  const { open, ws } = useWebSocket(envConfig.notification.webSocketUrl, {
    immediate: false,
    autoReconnect: {
      retries: 10,
      delay: 5000,
    },
    heartbeat: {
      interval: 4000,
    },
  })

  const openConnection = () => {
    if (!envConfig.notification.enabled) return
    open()
    if (!ws.value) return
    ws.value.onopen = function (this: WebSocket, event: Event) {
      console.log('ws notification-server open', event)
    }
    ws.value.onerror = function (this: WebSocket, event: Event) {
      const { showWarning } = useAlerts()
      setTimeout(() => {
        showWarning(t('system.error.notificationsNotConnected'), -1)
      }, 3000)
      console.log('ws notification-server error', event)
    }
    ws.value.onmessage = function (this: WebSocket, event: MessageEvent) {
      const message = JSON.parse(event.data as string)
      console.log(message.eventName)
      notificationEventTarget.dispatchEvent(
        new CustomEvent(message.eventName, { detail: message.data.length ? JSON.parse(message.data) : '' })
      )
    }
  }

  const addNotificationListener = (eventName: string, callback: (event: Event) => void) => {
    notificationEventTarget.addEventListener(eventName, callback)
  }

  return {
    openConnection,
    addNotificationListener,
  }
}
