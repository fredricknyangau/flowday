import { useState, useEffect } from 'react'
import axios from 'axios'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  )

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const subscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported by your browser.')
      return
    }

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm === 'granted') {
        const registration = await navigator.serviceWorker.ready
        const applicationServerKey = urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY
        )

        let subscription = await registration.pushManager.getSubscription()
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          })
        }

        // Send to backend
        const subJson = subscription.toJSON()
        await axios.post(
          `${import.meta.env.VITE_API_URL || ''}/push/subscribe`,
          subJson
        )
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
    }
  }

  return { permission, subscribe }
}
