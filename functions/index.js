const { onRequest } = require("firebase-functions/v2/https");
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