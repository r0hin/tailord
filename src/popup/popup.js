import { firebaseApp } from './firebase_config'
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';

const auth = getAuth(firebaseApp);
setPersistence(auth, browserLocalPersistence)

onAuthStateChanged(auth, user => {
  if (user) {
    console.log(user);
  }
});