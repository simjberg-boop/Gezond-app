// Ontvangt pushberichten van de server en toont ze als melding,
// ook als de app helemaal gesloten is.
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Gezond', {
      body: data.body || 'Tijd voor je volgende moment.',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'gezond-push',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      if (list.length) return list[0].focus();
      return clients.openWindow('./');
    })
  );
});
