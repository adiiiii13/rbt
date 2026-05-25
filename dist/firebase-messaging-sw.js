importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const urlParams = new URLSearchParams(location.search);

const firebaseConfig = {
  apiKey: urlParams.get('apiKey'),
  projectId: urlParams.get('projectId'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId')
};

if (firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();
  
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/Images/RBT Logo.jpeg'
    };
  
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}
