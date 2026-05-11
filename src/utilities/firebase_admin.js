const admin = require("firebase-admin");
var serviceAccount = require("/etc/secrets/serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = {
    admin,
}