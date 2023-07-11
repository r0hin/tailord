import { firebaseApp } from './firebase_config'
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const auth = getAuth(firebaseApp);
setPersistence(auth, browserLocalPersistence)

onAuthStateChanged(auth, user => {
  if (user) {
    $(`#signedIn`).removeClass("hidden");
    $(`#signedOut`).addClass("hidden");

    chrome.tabs.query({active:true,currentWindow:true}, function(tab){
      //Be aware that `tab` is an array of Tabs 
      $(`#siginedtext`).text(`Signed in on ${tab[0].url}`)
    });

  }
  else {
    $(`#signedOut`).removeClass("hidden");
    $(`#signedIn`).addClass("hidden");
  }
});

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