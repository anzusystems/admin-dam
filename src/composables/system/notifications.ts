import { useWebSocket } from '@vueuse/core'
import { envConfig } from '@/services/EnvConfigService'

const notificationEventTarget = new EventTarget()

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
