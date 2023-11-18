import { firebaseApp } from './firebase_config'
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInAnonymously, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
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
    chrome.storage.sync.set({'uid': user.uid}, function() {
      console.log('Settings saved');
    });

    $(`#email`).text(user.email);
  }
  else {
    $(`#signedOut`).removeClass("hidden");
    $(`#signedIn`).addClass("hidden");

    // Basically sign in anonymously
    signInAnonymously(auth)
    $(`#email`).text("Guest")
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
  onSnapshot(doc(db, `users/${user.uid}`), async (userDoc) => {
    cacheUser = userDoc.data();

    // Import sample data
    // const jacksdock = await getDoc(doc(db, `users/4bNJ7Z6WzKTqvpRjaBz4IpolIZ13`));
    // const jacksdockMeasurements = jacksdock.data().measurements;
    // updateDoc(doc(db, `users/${user.uid}`), {
    //   measurements: jacksdockMeasurements,
    // });

    if (userDoc.exists() && Object.keys(userDoc.data().measurements || {}).length) {
      // Measurements exist
      $(`#noMeasurements`).addClass("hidden");
      $(`#yesMeasurements`).removeClass("hidden");
      $(`#beginScanButton`).html(`Scan Again`);

      if (Object.keys(userDoc.data().measurements).length) {
        $(`#measurementsTabButton`).removeClass("hidden");
      }

      // Populate measurements
      $(`#age`).text(userDoc.data().measurements.age);
      $(`#height`).text(userDoc.data().measurements.height);
      $(`#weight`).text(userDoc.data().measurements.weight);
      const gender = userDoc.data().measurements.gender;
      const cpitalizedGender = gender.charAt(0).toUpperCase() + gender.slice(1);
      $(`#gender`).text(cpitalizedGender);

      $(`#measurementTable`).empty();
      $(`#measurementTable`).append(`
        <tr>
          <th>Measurement</th>
          <th>Value (In)</th>
        </tr>
      `)

      userDoc.data().measurements.measurement.forEach((measurement) => {
        $(`#measurementTable`).append(`
          <tr>
            <td class="measurementTableNameCell"><i id="infoButton${measurement.pointName}" class="bx bx-info-circle"></i> ${measurement.displayName}</td>
            <td class="editableCell" id="${measurement.pointName}editable">${Math.ceil(parseFloat(measurement.valueIninch))}</td>
          </tr>
        `)

        $(`#${measurement.pointName}editable`).get(0).onclick = async () => {
          let measurements = userDoc.data().measurements;
          const newValue = prompt(`Enter a new value for ${measurement.displayName} in inches.`);

          if (newValue && parseFloat(newValue)) {
            measurements.measurement.forEach((measurementCheck) => {
              if (measurement.pointName === measurementCheck.pointName) {
                measurements.measurement[measurements.measurement.indexOf(measurementCheck)].valueIninch = newValue;
              }
            })

            await updateDoc(doc(db, `users/${user.uid}`), {
              measurements: measurements,
            });
          }
          else {
            alert("Invalid value.")
          }
        }

        $(`#infoButton${measurement.pointName}`).get(0).onclick = () => {
          alert(measurement.description);
        }
      })

    }
    else {
      // No measurements exist
      $(`#noMeasurements`).removeClass("hidden");
      $(`#yesMeasurements`).addClass("hidden");
      $(`#beginScanButton`).html(`Create a Scan`);
      $(`#measurementsTabButton`).addClass("hidden");
    }

    if (userDoc.exists() && userDoc.data().latest_access_code) {
      $(`#scanning`).removeClass("hidden");
      $(`#notScanning`).addClass("hidden");
      showQRCode(userDoc.data().latest_access_code);
    }
  })
  
  $(`#beginScanButton`).get(0).onclick = async () => {
    if (!user.email) {
      switchTab("settings");
      return;
    }

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
    }, {merge: true});

    showQRCode(accessCode)
  }
}

window.editMeasurement = (pointName) => {
  alert(pointName)
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
  console.log(data)
  if (!data) {
    alert("No measurements imported.")
    updateDoc(doc(db, `users/${user.uid}`), {
      latest_access_code: "",
    });
    return;
  }
  updateDoc(doc(db, `users/${user.uid}`), {
    latest_access_code: "",
    measurements: data,
  });

}

$(`#signInButton`).get(0).onclick = async () => {
  const email = $(`#emailBox`).val();
  const password = $(`#passwordBox`).val();
  let toPreserveMeasurements = false;
  const measurements = cacheUser ? cacheUser.measurements : null;

  // If already have measurements
  if (cacheUser && Object.keys(cacheUser.measurements || {}).length) {
    toPreserveMeasurements = true;
  }

  console.log(toPreserveMeasurements, measurements)
  try {    
    const credential = await signInWithEmailAndPassword(auth, email, password);

    const existingUserDoc = await getDoc(doc(db, `users/${credential.user.uid}`));
    if (toPreserveMeasurements && (measurements !== null)) {
      if (!existingUserDoc.exists() || !existingUserDoc.data().measurements) {
        // No measurements exist
        await setDoc(doc(db, `users/${credential.user.uid}`), {
          measurements: measurements,
        });
      }
    }
  } catch (error) {
    alert(error.message);
  }
}

$(`#signUpButton`).get(0).onclick = async () => {
  const email = $(`#emailBox`).val();
  const password = $(`#passwordBox`).val();

  let toPreserveMeasurements = false;
  const measurements = cacheUser ? cacheUser.measurements : null;

  // If already have measurements
  if (cacheUser && Object.keys(cacheUser.measurements || {}).length) {
    toPreserveMeasurements = true;
  }

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    const existingUserDoc = await getDoc(doc(db, `users/${credential.user.uid}`));
    if (toPreserveMeasurements && (measurements !== null)) {
      if (!existingUserDoc.exists() || !existingUserDoc.data().measurements) {
        // No measurements exist
        await setDoc(doc(db, `users/${credential.user.uid}`), {
          measurements: measurements,
        });
      }
    }
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

$(`#measurementsTabButton`).get(0).onclick = () => {
  switchTab("measurements");
}

$(`#deleteAccountButton`).get(0).onclick = () => {
  // Confirmation
  const confirmed = confirm("Are you sure you want to delete your account? This action cannot be undone.");
  if (!confirmed) {
    return;
  }

  // Prompt for password
  const password = prompt("Please enter your password to confirm deletion.");
  if (!password) {
    return;
  }

  // Reauthenticate
  const credential = EmailAuthProvider.credential(
    user.email,
    password
  );

  reauthenticateWithCredential(user, credential).then((credential) => {
    // User re-authenticated.
    credential.user.delete().then(() => {
      // User deleted.
      alert("Account deleted successfully.")
    })
  })
}

$(`#contactSupport`).get(0).onclick = () => {
  window.open("mailto:jacksdorr@icloud.com");
}