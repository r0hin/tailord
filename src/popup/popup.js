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
  window.user = user;
  if (user && user.email) {
    $(`#signedIn`).removeClass("hidden");
    $(`#signedOut`).addClass("hidden");

    loadMeasurements(user);
    chrome.tabs.query({active:true,currentWindow:true}, function(tab){
      $(`#siginedtext`).text(`Signed in on ${tab[0].url}`)
    });
    
    $(`#measurementsTabButton`).removeClass("hidden")

    // TO CHANGE BACK TO USER.UID
    chrome.storage.sync.set({'uid': user.uid}, function() {
      console.log('Settings saved');
    });

    $(`#email`).text(user.email);
  }
  else {
    $(`#signedOut`).removeClass("hidden");
    $(`#signedIn`).addClass("hidden");

    switchTab("settings")
    $(`#measurementsTabButton`).addClass("hidden")
  }
});

async function loadMeasurements(user) {
  onSnapshot(doc(db, `users/${user.uid}`), async (userDoc) => {
    if (!userDoc.exists()) {
      await setDoc(doc(db, `users/${user.uid}`), {
        setup: false,
        "measurements": {"measurement": [{
          "displayName":"Back chest width",
          "description":"Linear horizontal distance between the extreme two back chest points, following the body",
          "valueIninch":"Unset",
          "pointName":"backchestwidth"
        },
        {
          "displayName":"Chest girth",
          "valueIninch":"Unset",
          "pointName":"chest",
          "description":"Horizontal girth around the chest, passing over the nipples"
        },
        {
          "description":"Vertical distance from cervical point to the foot",
          "pointName":"cervicallength",
          "valueIninch":"Unset",
          "displayName":"Cervical length"
        },
        {
          "displayName":"Upper neck girth",
          "description":"Horizontal girth around the mid-neck",
          "pointName":"upperneck",
          "valueIninch":"Unset"
        },
        {
          "displayName":"Natural waist girth",
          "valueIninch":"Unset",
          "pointName":"naturalwaistgirth",
          "description":"Horizontal girth around the narrowest waist point"
        },
        {
          "description":"Maximum horizontal girth around the hip",
          "valueIninch":"Unset",
          "displayName":"Hip girth",
          "pointName":"hip"
        },
        {
          "valueIninch":"Unset",
          "displayName":"Shoulder across",
          "pointName":"shoulderacross",
          "description":"Horizontal curved length between two shoulder points"
        },
        {
          "valueIninch":"Unset",
          "description":"Linear distance between shoulder point and wrist bone",
          "pointName":"armslength",
          "displayName":"Arm length"
        },
        {
          "pointName":"centerbacklength",
          "description":"Vertical distance from cervical point to the crotch point",
          "valueIninch":"Unset",
          "displayName":"Center back length"
        },
        {
          "description":"Distance from the cervical point to mid-palm",
          "displayName":"Full sleeve length",
          "valueIninch":"Unset",
          "pointName":"sleevelengthfull"
        },
        {
          "valueIninch":"Unset",
          "displayName":"Waist girth",
          "description":"Horizontal girth around the waist line",
          "pointName":"waist"
        },
        {
          "pointName":"sleevelength",
          "displayName":"Sleeve length",
          "description":"Linear distance from the shoulder point to mid-palm",
          "valueIninch":"Unset"
        },
        {
          "pointName":"leglength",
          "valueIninch":"Unset",
          "displayName":"Leg length",
          "description":"Vertical distance from waist bone point to the foot - just above the ground."
        }],
        "emailId":"",
        "age":"Unset",
        "weight":"Unset",
        "name":"",
        "gender":"Unset",
        "height":"Unset"}
      });
    }

    
    cacheUser = userDoc.data();

    // Import sample data
    // const jacksdock = await getDoc(doc(db, `users/4bNJ7Z6WzKTqvpRjaBz4IpolIZ13`));
    // const jacksdockMeasurements = jacksdock.data().measurements;
    // updateDoc(doc(db, `users/${user.uid}`), {
    //   measurements: jacksdockMeasurements,
    // });

    if (userDoc.exists() && Object.keys(userDoc.data().measurements || {}).length) {
      // Make sure valueIninch is not "Unset"
      let anyUnset = false;
      userDoc.data().measurements.measurement.forEach((measurement) => {
        if (measurement.valueIninch.toLowerCase() == "unset") {
          anyUnset = true;
        }
      })

      if (!anyUnset) {
        // Measurements exist
        $(`#noMeasurements`).addClass("hidden");
        $(`#yesMeasurements`).removeClass("hidden");
        $(`#beginScanButton`).html(`Scan Again`);
      }


      // if (Object.keys(userDoc.data().measurements).length) {
        // $(`#measurementsTabButton`).removeClass("hidden");
      // }

      // Populate measurements
      $(`#age`).val(userDoc.data().measurements.age);
      $(`#height`).val(userDoc.data().measurements.height);
      $(`#weight`).val(userDoc.data().measurements.weight);
      $(`#gender`).val(userDoc.data().measurements.gender);

      if (!$(`#measurementTable`).children().length) {
        $(`#measurementTable`).append(`
          <tr>
            <th>Required Measurement</th>
            <th>Value (Inches)</th>
          </tr>
        `)
  
        $(`#nonRequiredMeasurementTable`).append(`
          <tr>
            <th>Optional Measurement</th>
            <th>Value (Inches)</th>
          </tr>
        `)
      }

      $(`#age`).get(0).oninput = async () => {
        let measurements = userDoc.data().measurements;
        const newValue = $(`#age`).val();
        if (newValue && parseFloat(newValue)) {
          measurements.age = newValue;
          await updateDoc(doc(db, `users/${user.uid}`), {
            measurements: measurements,
          });
        }
      }

      $(`#height`).get(0).oninput = async () => {
        let measurements = userDoc.data().measurements;
        const newValue = $(`#height`).val();
        if (newValue && parseFloat(newValue)) {
          measurements.height = newValue;
          await updateDoc(doc(db, `users/${user.uid}`), {
            measurements: measurements,
          });
        }
      }

      $(`#weight`).get(0).oninput = async () => {
        let measurements = userDoc.data().measurements;
        const newValue = $(`#weight`).val();
        if (newValue && parseFloat(newValue)) {
          measurements.weight = newValue;
          await updateDoc(doc(db, `users/${user.uid}`), {
            measurements: measurements,
          });
        }
      }

      $(`#gender`).get(0).oninput = async () => {
        let measurements = userDoc.data().measurements;
        const newValue = $(`#gender`).val();
        if (newValue && (newValue.toLowerCase() == "male" || newValue.toLowerCase() == "female")) {
          measurements.gender = newValue.toLowerCase();
          await updateDoc(doc(db, `users/${user.uid}`), {
            measurements: measurements,
          });
        }
      }

      userDoc.data().measurements.measurement.forEach((measurement) => {
        if ($(`#${measurement.pointName}editable`).length) {
          return;
        }

        let tgt = `measurementTable`;
        let required = ["chest", "hip", "waist", "armslength"];
        if (!required.includes(measurement.pointName)) {
          tgt = `nonRequiredMeasurementTable`;
        }

        $(`#${tgt}`).append(`
          <tr>
            <td class="measurementTableNameCell"><i id="infoButton${measurement.pointName}" class="bx bx-info-circle"></i> ${measurement.displayName}</td>
            <td class="editableCell" id="${measurement.pointName}editable"><input id="${measurement.pointName}input" value="${Math.ceil(parseFloat(measurement.valueIninch)) || "Unset"}" /></td>
          </tr>
          <tr class="hidden" id="${measurement.pointName}infoCell">
            <td colspan="2">${measurement.description}</td>
          </tr>
        `)

        $(`#${measurement.pointName}input`).get(0).oninput = async () => {
          let measurements = userDoc.data().measurements;
          const newValue = $(`#${measurement.pointName}input`).val();

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
          $(`#${measurement.pointName}infoCell`).toggleClass("hidden");
        }
      })

    }
    else {
      // No measurements exist
      $(`#noMeasurements`).removeClass("hidden");
      $(`#yesMeasurements`).addClass("hidden");
      $(`#beginScanButton`).html(`Create a Scan`);
      // $(`#measurementsTabButton`).addClass("hidden");
    }

    if (userDoc.exists() && (userDoc.data().setup === false)) {
      $(`#notsetup`).removeClass("hidden");
      $(`#setup`).addClass("hidden");
    }
    else {
      $(`#notsetup`).addClass("hidden");
      $(`#setup`).removeClass("hidden");
    }

    if (userDoc.exists() && userDoc.data().latest_access_code) {
      $(`#scanning`).removeClass("hidden");
      $(`#notScanning`).addClass("hidden");
      showQRCode(userDoc.data().latest_access_code);
    }
  })
  
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

$(`#signInButton`).get(0).onclick = async () => {
  const email = $(`#emailBox`).val();
  const password = $(`#passwordBox`).val();

  if (!email || !password) {
    alert("Please enter an email and password to sign in.");
    return;
  }
  try {    
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert(error.message.replace("Firebase: ", ""));
  }
}

$(`#signUpButton`).get(0).onclick = async () => {
  const email = $(`#emailBox`).val();
  const password = $(`#passwordBox`).val();

  if (!email || !password) {
    alert("Please enter an email and password to sign in.");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert(error.message.replace("Firebase: ", ""));
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

$(`#settingsTabButton`).get(0).onclick = () => {
  switchTab("settings");
}

$(`#measurementsTabButton`).get(0).onclick = () => {
  switchTab("measurements");
}

$(`#openStartPage`).get(0).onclick = () => {
  window.open("https://tailord.ca/start")
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