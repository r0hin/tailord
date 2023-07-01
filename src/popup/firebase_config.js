import { initializeApp } from 'firebase/app';

// TODO Fill Me! 
// Find my details from Firebase Console

// config after registering firebase App 
const config = {
    apiKey: "AIzaSyBwkyeMAbLgiX3d5Deb8VTymswTTv-Fjqo",
    authDomain: "tailord5.firebaseapp.com",
    projectId: "tailord5",
    storageBucket: "tailord5.appspot.com",
    messagingSenderId: "861122476987",
    appId: "1:861122476987:web:62d0ad232def44d296a29e"
  };

// This creates firebaseApp instance
// version: SDK 9
const firebaseApp = initializeApp(config)

export{
    firebaseApp
}