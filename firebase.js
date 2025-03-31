const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // Download from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "your-project-id.appspot.com" // Replace with your bucket URL
});

const bucket = admin.storage().bucket();
module.exports = { bucket, admin };