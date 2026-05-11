const admin = require("firebase-admin");
var serviceAccount = require("/etc/secrets/serviceAccount.json");
const Logging = require("../utilities/logging");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

Logging.info("Firebase Admin initialized successfully.");

module.exports = {
    admin,
}