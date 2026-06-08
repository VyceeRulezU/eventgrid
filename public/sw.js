self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('push', (event) => {
  let data = { title: 'EventGrid', body: '', icon: '/favicon/favicon-96x96.png', badge: '/favicon/favicon-96x96.png' }
  try {
    data = event.data ? JSON.parse(event.data.text()) : data
  } catch {}

  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon/favicon-96x96.png',
    badge: data.badge || '/favicon/favicon-96x96.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const urlToOpen = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url === urlToOpen && 'focus' in c)
      if (existing) { existing.focus(); return }
      clients.openWindow(urlToOpen)
    })
  )
})
