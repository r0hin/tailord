import { firebaseApp } from './firebase_config'
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInAnonymously } from 'firebase/auth';
import { doc, getFirestore, onSnapshot } from "firebase/firestore"

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
setPersistence(auth, browserLocalPersistence)

onAuthStateChanged(auth, user => {
  if (user && user.email) {
    $(`#signedIn`).removeClass("hidden");
    $(`#signedOut`).addClass("hidden");
  }
  else {
    $(`#signedOut`).removeClass("hidden");
    $(`#signedIn`).addClass("hidden");

    // Basically sign in anonymously
    signInAnonymously(auth)
  }

  if (user && user.uid) {
    // Get measurements
    loadMeasurements(user);
    $(`#uid`).text(user.uid);

    chrome.tabs.query({active:true,currentWindow:true}, function(tab){
      //Be aware that `tab` is an array of Tabs 
      $(`#siginedtext`).text(`Signed in on ${tab[0].url}`)
    });
  }
});

async function loadMeasurements(user) {
  await onSnapshot(doc(db, `users/${user.uid}`), (userDoc) => {
    if (!userDoc.exists()) {
      $(`#noMeasurements`).removeClass("hidden");
      $(`#measurements`).addClass("hidden");
      $(`#noFillMeasurements`).removeClass("hidden");
      $(`#fillMeasurements`).addClass("hidden");
    }
    else {
      $(`#noMeasurements`).addClass("hidden");
      $(`#measurements`).removeClass("hidden");
      $(`#noFillMeasurements`).addClass("hidden");
      $(`#fillMeasurements`).removeClass("hidden");
    }
  })
}

$(`#signInButton`).get(0).onclick = async () => {
  const email = $(`#emailBox`).val();
  const password = $(`#passwordBox`).val();

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert(error.message);
  }
}

$(`#signUpButton`).get(0).onclick = async () => {
  const email = $(`#emailBox`).val();
  const password = $(`#passwordBox`).val();

  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert(error.message);
  }
}

$(`#signOut`).get(0).onclick = async () => {
  await signOut(auth);
}

$(`#testButton`).get(0).onclick = () => {
  chrome.runtime.sendMessage({ message: "scrape" }, response => {
    console.log(response.message);
    $(`#response`).text(`${response.message}`);
  });
}

function switchTab(tab) {
  $(`.footerButton`).removeClass("active");
  $(`#${tab}TabButton`).addClass("active");

  $(`.tab`).addClass("hidden");
  $(`#${tab}Tab`).removeClass("hidden");
}

$(`#fillTabButton`).get(0).onclick = () => {
  switchTab("fill");
}

$(`#scanTabButton`).get(0).onclick = () => {
  switchTab("scan");
}

$(`#settingsTabButton`).get(0).onclick = () => {
  switchTab("settings");
}