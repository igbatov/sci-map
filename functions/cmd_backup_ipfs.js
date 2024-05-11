/**
 * Save backup to decentralized storage
 */
const functions = require('firebase-functions/v1');
const AWS = require('aws-sdk');

// [START GetOnCommandBackupIpfs]
// Listens for changes in /cmd/backup_ipfs and send digests to subscribers
exports.GetOnCommandBackupIpfs = (firestore, database) => functions
  // Make the secret available to this function
  .runWith({ secrets: ["FILEBASE_IPFS_KEY", "FILEBASE_IPFS_SECRET"] })
  .database.ref('/cmd/backup_ipfs')
  .onWrite(async (change, context) => {
    if (change.after.val() !== '1') {
      return
    }
    const s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      accessKeyId: process.env.FILEBASE_IPFS_KEY,
      secretAccessKey: process.env.FILEBASE_IPFS_SECRET,
      endpoint: 'https://s3.filebase.com',
      region: 'us-east-1',
      s3ForcePathStyle: true
    });
    const now = new Date().getTime();

    const data = await database.ref('/').get()

    const params = {
      Bucket: 'scimap-backup',
      Key: 'db/'+now+'.json',
      ContentType: "application/json",
      Body: JSON.stringify(data.val()),
      ACL: 'public-read',
    };

    const request = s3.putObject(params);
    request.on('httpHeaders', async (statusCode, headers) => {
      await firestore
        .collection('backup_ipfs_cid_list')
        .add({
          cid: headers['x-amz-meta-cid'],
          timestamp: now,
        })
      functions.logger.info("upload file to ipfs got cid", {
        cid: headers['x-amz-meta-cid'],
      });
    });

    request.send((err, data) => {
      if (err) {
        functions.logger.error("upload file to ipfs error", {
          err,
        });
      }
      if (data) {
        functions.logger.info("upload file to ipfs success", {
          data,
        });
      }
    });
  });
// [END GetOnCommandBackupIpfs]
