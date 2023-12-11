var admin = require("firebase-admin");

var serviceAccount = require("./admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

admin.auth().listUsers().then(async (listUsersResult) => {
  for (let i = 0; i < listUsersResult.users.length; i++) {
    const userRecord = listUsersResult.users[i];
    if (!userRecord.email) {
      admin.auth().deleteUser(userRecord.uid).then(() => {
        console.log("Successfully deleted user");
      }).catch((error) => {
        console.log("Error deleting user:", error);
      });
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
})