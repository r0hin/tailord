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

function signIn() {
  const email = $(`#email`).val();
  const password = $(`#password`).val();

  auth.signInWithEmailAndPassword(email, password).catch((error) => {
    alert(error.message)
  });
}

function createAccount() {
  const email = $(`#email`).val();
  const password = $(`#password`).val();

  auth.createUserWithEmailAndPassword(email, password).catch((error) => {
    alert(error.message)
  });
}

auth.onAuthStateChanged((user) => {
  if (user) {
    $(`#signedIn`).removeClass("hidden");
    $(`#signedOut`).addClass("hidden");
    $(`#note`).html("Welcome to TailorD! You can download the extension <a href='extension.html'>here</a>.");
  } else {
    $(`#signedOut`).removeClass("hidden");
    $(`#signedIn`).addClass("hidden");
  }
});


function newScan() {
  const uid = auth.currentUser.uid;
  const scan = {
    measurements: {},
  };
  db.collection("users").doc(uid).collection("scans").add(scan).then((doc) => {
    window.location.href = `scan.html?id=${doc.id}`;
  });
}

// auth.signOut()