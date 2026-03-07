
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuração idêntica à do app para o Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyA6noJTkCcRypfeqi91qa6a2hDEcQ606N0",
  authDomain: "studio-7344387368-26e1e.firebaseapp.com",
  projectId: "studio-7344387368-26e1e",
  storageBucket: "studio-7344387368-26e1e.firebasestorage.app",
  messagingSenderId: "276111019128",
  appId: "1:276111019128:web:e7b5e0343df79e6da0318d"
});

const messaging = firebase.messaging();

// Lida com o clique na notificação
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.link || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Se já houver uma aba aberta, foca nela e navega
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(c => c.navigate(urlToOpen));
        }
      }
      // Se não houver, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
