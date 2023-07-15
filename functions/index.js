const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app")
const { getFirestore } = require("firebase-admin/firestore")

initializeApp();

exports.addMeasurements = onRequest(async (request, response) => {
  if (request.method !== "POST") {
    response.status(400).send("Invalid request method");
    return;
  }

  const postData = request.body;

  const uid = postData.uid;
  const measurements = postData.measurements;

  const db = getFirestore();
  db.collection("users").doc(uid).set(measurements, {
    merge: true
  })

  response.status(200).send("OK.");
});
