importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
const firebaseConfig = {
  apiKey: "API_KEY", // Note: The SW will fetch config automatically from the project if we use generic, but to be safe we should provide it. Since this is public, we can just use the project's config. Wait, the user has their config in .env. We'll leave placeholders and rely on the client injection, or use a generic config.
  // Actually, V10 modular SDK allows us to not hardcode config if we use firebase-app-compat, but it's better to just leave it as is or fetch from URL params. 
  // Let's hardcode the default project id or we can leave it empty and let the SW be registered from the client with the proper config.
};

// Instead of hardcoding, we can wait for a message from the client to initialize
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    if (!firebase.apps.length) {
      firebase.initializeApp(event.data.config);
      const messaging = firebase.messaging();
      
      messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
          body: payload.notification.body,
          icon: '/Images/RBT Logo.jpeg'
        };
      
        self.registration.showNotification(notificationTitle, notificationOptions);
      });
    }
  }
});
