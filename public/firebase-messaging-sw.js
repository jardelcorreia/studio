// Scripts necessários para o Firebase Messaging no Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Configuração do Firebase (deve ser idêntica à do app)
// O Service Worker usa a versão compat (v9/v10 compat) para facilitar a implementação offline
firebase.initializeApp({
  apiKey: "AIzaSyA6noJTkCcRypfeqi91qa6a2hDEcQ606N0",
  authDomain: "studio-7344387368-26e1e.firebaseapp.com",
  projectId: "studio-7344387368-26e1e",
  storageBucket: "studio-7344387368-26e1e.firebasestorage.app",
  messagingSenderId: "276111019128",
  appId: "1:276111019128:web:e7b5e0343df79e6da0318d"
});

const messaging = firebase.messaging();

// Handler opcional para mensagens em segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem em segundo plano recebida: ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/android-chrome-192x192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
