
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');

admin.initializeApp()
getAuth()
  .getUserByEmail('igbatov@gmail.com')
  .then((user) => {
    // Confirm user is verified.
    if (user.emailVerified) {
      // Add custom claims for additional privileges.
      // This will be picked up by the user on token refresh or next sign in on new device.
      return getAuth().setCustomUserClaims(user.uid, {
        role: "map_editor",
      });
    }
  })
  .catch((error) => {
    console.log(error);
  });

