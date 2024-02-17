// [START GetOnCommandSendDigest]
// Listens for changes in /cmd/send_digest
const functions = require('firebase-functions/v1');
const nodemailer = require('nodemailer');
const APP_NAME = "scimap.org"

exports.GetOnCommandSendDigest = (database) => functions
  // Make the secret available to this function
  .runWith({ secrets: ["IGBATOVSM_PWD"] }).database.ref('/cmd/send_digest')
  .onWrite(async (change, context) => {
    functions.logger.info()
    const mailTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "igbatovsm@gmail.com",
        pass: process.env.IGBATOVSM_PWD,
      },
    });
    const email = "igbatov@gmail.com"
    const mailOptions = {
      from: `${APP_NAME} <noreply@firebase.com>`,
      to: email,
    };

    // The user subscribed to the newsletter.
    mailOptions.subject = `Welcome to ${APP_NAME}!`;
    mailOptions.text = `Welcome to ${APP_NAME}. I hope you will enjoy our service.`;
    //await mailTransport.sendMail(mailOptions);
    functions.logger.log('New welcome email sent to:', email);
    if (change.after && change.after.val() === "1") {
      functions.logger.log('change.after.val()', change.after.val());
      database.ref('/cmd/send_digest').set("0")
    }
  });
// [END GetOnCommandSendDigest]
