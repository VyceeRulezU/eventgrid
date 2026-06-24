self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('push', (event) => {
  let data = { title: 'NaliGrid', body: '', url: '/', icon: '/logo-192.png', badge: '/badge-72.png', tag: '' }
  try {
    data = event.data ? JSON.parse(event.data.text()) : data
  } catch {}

  const options = {
    body: data.body || '',
    icon: data.icon || '/logo-192.png',
    badge: data.badge || '/badge-72.png',
    tag: data.tag || '',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'view', title: 'Open Live Feed' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action && event.action !== 'view') return
  const urlToOpen = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url === urlToOpen && 'focus' in c)
      if (existing) { existing.focus(); return }
      clients.openWindow(urlToOpen)
    })
  )
})
