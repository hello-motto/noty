self.addEventListener('install', function(event) {
  self.skipWaiting();
  console.log('worker installed', event);
});

self.addEventListener('activate', function(event) {
  console.log('worker activated', event);
});

self.addEventListener('push', function(event) {
  console.log('push fired', event);

  var data = event.data.json();

  const options = {
    body: data.body,
    icon: data.icon,
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, options)
    ])
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('notificationclick fired', event);

  // INFO: You can customize this callback for your needs

  // currently we are closing notification on click
  event.notification.close();

  // then if url is provided open a new window
  var clickResponsePromise = Promise.resolve();
  if (event.notification.data && event.notification.data.url) {
    clickResponsePromise = clients.openWindow(event.notification.data.url);
  }

  event.waitUntil(
    Promise.all([
      clickResponsePromise
    ])
  );
});