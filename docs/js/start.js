const firebaseConfig = {
  apiKey: "AIzaSyBwkyeMAbLgiX3d5Deb8VTymswTTv-Fjqo",
  authDomain: "tailord5.firebaseapp.com",
  projectId: "tailord5",
  storageBucket: "tailord5.appspot.com",
  messagingSenderId: "861122476987",
  appId: "1:861122476987:web:f873a8da7569a04b96a29e"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

window.inputStep = 0;
window.accessCodeGenerated = false;

function signIn() {
  const email = $(`#email`).val();
  const password = $(`#password`).val();

  if (!email || !password) {
    alert("Please enter an email and password to sign in.");
    return;
  }

  auth.signInWithEmailAndPassword(email, password).catch((error) => {
    alert(error.message)
  });
}

function createAccount() {
  const email = $(`#email`).val();
  const password = $(`#password`).val();

  if (!email || !password) {
    alert("Please enter an email and password to register.");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password).catch((error) => {
    alert(error.message.replace("Firebase: ", ""))
  });
}

auth.onAuthStateChanged((user) => {
  if (user) {
    $(`#signedIn`).removeClass("hidden");
    $(`#signedOut`).addClass("hidden");

    db.collection("users").doc(user.uid).get().then((doc) => {
      if (doc.data().setup === false) {
        $(`#notsetup`).removeClass("hidden");
        $(`#setup`).addClass("hidden");
      }
      else {
        $(`#notsetup`).addClass("hidden");
        $(`#setup`).removeClass("hidden");
      }
    })

  } else {
    $(`#signedOut`).removeClass("hidden");
    $(`#signedIn`).addClass("hidden");
  }
});


$(`#scanYourselfButton`).get(0).onclick = async () => {
  $(`#step1`).addClass("hidden");
  $(`#scanFlow1`).removeClass("hidden");

  if (!accessCodeGenerated) {
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

    await db.collection("users").doc(auth.currentUser.uid).set({
      latest_access_code: accessCode,
    }, {merge: true});

    showQRCode(accessCode)
  }
}

function showQRCode(accessCode) {
  const url = `https://user.mirrorsize.com/home/${accessCode}`;

  $(`#qrcode`).empty();

  new QRCode(document.getElementById("qrcode"), {
    text: url,
    width: 256,
    height: 256,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
}

$(`#inputManuallyButton`).get(0).onclick = () => {
  $(`#step1`).addClass("hidden");
  $(`#inputFlow1`).removeClass("hidden");
  inputStep = 1;
}

function inputFlowBack() {
  $(`.inputFlow`).addClass("hidden");
  $(`#inputFlow${window.inputStep - 1}`).removeClass("hidden");
  window.inputStep--;
}

function inputFlowNext() {
  $(`.inputFlow`).addClass("hidden");
  $(`#inputFlow${window.inputStep + 1}`).removeClass("hidden");
  window.inputStep++;
}

$(`#returnHome`).get(0).onclick = () => {
  $(`#scanFlow1`).addClass("hidden");
  $(`#step1`).removeClass("hidden");
}

$(`#returnHome2`).get(0).onclick = () => {
  $(`.inputFlow`).addClass("hidden");
  $(`#step1`).removeClass("hidden");
}

$(`#completeScan`).get(0).onclick = async () => {
  const userDoc = db.collection("users").doc(auth.currentUser.uid).get();
  const accessCode = (await userDoc).data().latest_access_code;

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

  if (!data) {
    alert("No measurements imported. Please try again or restart the process by refreshing this page.")
    return;
  }

  await db.collection("users").doc(auth.currentUser.uid).set({
    measurements: data,
    setup: true,
    latest_access_code: "",
  }, {merge: true});
}


$(`#finalizeInputData`).get(0).onclick = async () => {
  const age = $(`#age`).val();
  const height = $(`#height`).val();
  const gender = $(`#gender`).val();
  const weight = $(`#weight`).val();
  const chest = $(`#chest`).val();
  const hip = $(`#hip`).val();
  const arm = $(`#arm`).val();
  const waist = $(`#waist`).val();

  const missing = [];
  !age && missing.push("age");
  !height && missing.push("height");
  !gender && missing.push("gender");
  !weight && missing.push("weight");
  !chest && missing.push("chest");
  !hip && missing.push("hip");
  !arm && missing.push("arm");
  !waist && missing.push("waist");

  if (missing.length) {
    alert(`Please enter the following fields: ${missing.join(", ")}`);
    return;
  }

  await db.collection("users").doc(auth.currentUser.uid).set({
    setup: true,
    "measurements": {"measurement": [{
      "displayName":"Back chest width",
      "description":"Linear horizontal distance between the extreme two back chest points, following the body",
      "valueIninch":"Unset",
      "pointName":"backchestwidth"
    },
    {
      "displayName":"Chest girth",
      "valueIninch":`${chest}`,
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
      "valueIninch":`${hip}`,
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
      "valueIninch":`${arm}`,
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
      "valueIninch":`${waist}`,
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
    "age":`${age}`,
    "weight":`${weight}`,
    "name":"",
    "gender":`${gender}`,
    "height":`${height}`}
  });

  alert("Your measurements have been saved!")
  window.location.reload();
}