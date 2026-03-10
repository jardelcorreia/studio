importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// O Firebase App Hosting injeta as configurações, mas para o SW
// usamos a inicialização compat para interceptar mensagens em background.
firebase.initializeApp({
  apiKey: "AIzaSyA6noJTkCcRypfeqi91qa6a2hDEcQ606N0",
  authDomain: "studio-7344387368-26e1e.firebaseapp.com",
  projectId: "studio-7344387368-26e1e",
  storageBucket: "studio-7344387368-26e1e.firebasestorage.app",
  messagingSenderId: "276111019128",
  appId: "1:276111019128:web:e7b5e0343df79e6da0318d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem recebida em background: ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/android-chrome-192x192.png',
    data: {
      url: payload.data?.link || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
