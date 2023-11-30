const { onRequest } = require("firebase-functions/v2/https");
// Import functions v1
const functions = require('firebase-functions/v1')

const { initializeApp } = require("firebase-admin/app")
const { getFirestore } = require("firebase-admin/firestore")

initializeApp();

exports.getMeasurements = onRequest(async (request, response) => {
  response.set('Access-Control-Allow-Origin', '*');
  const uid = request.query.uid
  console.log(uid)

  const db = getFirestore();

  const userDoc = await db.doc(`users/${uid}`).get();
  if (userDoc.exists) {
    const measurements = userDoc.data().measurements;
    return response.status(200).send({
      measurements: measurements
    });
  }
  else {
    return response.status(200).send({
      measurements: {}
    });
  }

});

exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
  const email = user.email;

  console.log(email)
  // Send welcome email
})