import { firebaseApp } from './firebase_config'
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, getFirestore, onSnapshot, setDoc, updateDoc } from "firebase/firestore"
import QRCode from "qrcode"

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
setPersistence(auth, browserLocalPersistence)
window.user = null;
window.cacheUser = null;

onAuthStateChanged(auth, user => {
  if (user && user.email) {
    $(`#signedIn`).removeClass("hidden");
    $(`#signedOut`).addClass("hidden");

    // TO CHANGE BACK TO USER.UID
    chrome.storage.sync.set({'uid': "4bNJ7Z6WzKTqvpRjaBz4IpolIZ13"}, function() {
      console.log('Settings saved');
    });

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

    chrome.tabs.query({active:true,currentWindow:true}, function(tab){
      //Be aware that `tab` is an array of Tabs 
      $(`#siginedtext`).text(`Signed in on ${tab[0].url}`)
    });

    window.user = user;
  }
});

async function loadMeasurements(user) {
  await onSnapshot(doc(db, `users/${user.uid}`), (userDoc) => {
    cacheUser = userDoc.data();
    if (userDoc.exists() && Object.keys(userDoc.data().measurements || {}).length) {
      // Measurements exist
      $(`#noMeasurements`).addClass("hidden");
      $(`#yesMeasurements`).removeClass("hidden");
      $(`#beginScanButton`).html(`Scan Again`);
    }
    else {
      // No measurements exist
      $(`#noMeasurements`).removeClass("hidden");
      $(`#yesMeasurements`).addClass("hidden");
      $(`#beginScanButton`).html(`Begin Scan`);
    }

    if (userDoc.exists() && userDoc.data().latest_access_code) {
      $(`#scanning`).removeClass("hidden");
      $(`#notScanning`).addClass("hidden");
      showQRCode(userDoc.data().latest_access_code);
    }
  })
  
  $(`#beginScanButton`).get(0).onclick = async () => {
    const response = await fetch(`https://api.user.mirrorsize.com/api/webBrowser/generateAccessCode/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "apiKey": "jna56MCc6I8YQoD7ItKhJLcQSbqLK9s9FMv8xpBnllF9BV02TpyebdBFS2A63dkL",
        "merchantID": "jacksdorr@gmail.com",
        "productname": "GET_MEASURED",
      })
    });

    $(`#scanning`).removeClass("hidden");
    $(`#notScanning`).addClass("hidden");

    const jsonData = await response.json();

    const accessCode = jsonData.data.accessCode;

    await setDoc(doc(db, `users/${user.uid}`), {
      latest_access_code: accessCode,
    });

    showQRCode(accessCode)
  }
}

function showQRCode(accessCode) {
  const url = `https://user.mirrorsize.com/home/${accessCode}`;

  // Generate QR code
  $(`#qrcode`).empty();


  QRCode.toCanvas($(`#qrCode`).get(0), url, {
    width: 240,
    height: 240,
  }, () => {});

  
}

$(`#endScanButton`).get(0).onclick = async () => {
  $(`#scanning`).addClass("hidden");
  $(`#notScanning`).removeClass("hidden");

  const accessCode = cacheUser.latest_access_code;

  const response = await fetch(`https://api.user.mirrorsize.com/api/webBrowser/getmeasurement`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "apiKey": "jna56MCc6I8YQoD7ItKhJLcQSbqLK9s9FMv8xpBnllF9BV02TpyebdBFS2A63dkL",
      "merchantID": "jacksdorr@gmail.com",
      "accessCode": accessCode,
    })
  })

  const jsonData = await response.json();

  const data = jsonData.data;

  updateDoc(doc(db, `users/${user.uid}`), {
    latest_access_code: "",
    measurements: data,
  });
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

function switchTab(tab) {
  $(`.footerButton`).removeClass("active");
  $(`#${tab}TabButton`).addClass("active");

  $(`.tab`).addClass("hidden");
  $(`#${tab}Tab`).removeClass("hidden");
}

$(`#scanTabButton`).get(0).onclick = () => {
  switchTab("scan");
}

$(`#settingsTabButton`).get(0).onclick = () => {
  switchTab("settings");
}