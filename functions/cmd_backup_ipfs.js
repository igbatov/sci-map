/**
 * Save backup to decentralized storage
 */
const functions = require('firebase-functions/v1');
const AWS = require('aws-sdk');
const axios = require("axios");
const CIDsListPath = 'https://api.github.com/repos/igbatov/scimap-backup-list/contents/backup-list.json'

const githubCommit = async function(token, text) {
  const content = btoa(text)
  let sha = ''

  try {
    const response = await axios.get(CIDsListPath)
    sha = response.data.sha
  } catch (e) {
    functions.logger.error("githubCommit get error", e)
    return e && e.response ? e.response.data : e
  }

  try {
    const response = await axios.put(
      CIDsListPath,
      `{"message":"autocommit of new cid list", "sha":"${sha}", "content":"${content}", "committer":{"name":"Firebase Function OnCommandBackupIpfs","email":"igbatov@gmail.com"}}`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response ? response.data : null;
  } catch (e) {
    functions.logger.error("githubCommit put error", e)
    return e && e.response ? e.response.data : e
  }
}

const saveCIDs = async function (githubSecret, firestore) {
  const cidListResult = await firestore
    .collection('backup_ipfs_cid_list')
    .orderBy('timestamp', 'desc')
    .get();
  const cidList = []
  if (cidListResult && cidListResult.docs.length > 0) {
    cidListResult.docs.forEach((doc) => {
      cidList.push({
        url: `https://ipfs.filebase.io/ipfs/${doc.data()['cid']}`,
        cid: doc.data()['cid'],
        timestamp: doc.data()['timestamp'],
        datetime:(new Date(doc.data()['timestamp'])).toISOString()
      })
    })
  }

  if (cidList.length) {
    await githubCommit(
      githubSecret,
      JSON.stringify(cidList)
    )
  }
}

// [START GetOnCommandBackupIpfs]
// Listens for changes in /cmd/backup_ipfs and send digests to subscribers
exports.GetOnCommandBackupIpfs = (firestore, database) => functions
  // Make the secret available to this function
  .runWith({ secrets: ["FILEBASE_IPFS_KEY", "FILEBASE_IPFS_SECRET", "GITHUB_SCIMAP_BACKUP_KEY"] })
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

      // update a list of backup URLs in GitHub
      await saveCIDs(
        // Expires on Mon, May 12 2025, regenerate here https://github.com/settings/personal-access-tokens/3267003
        process.env.GITHUB_SCIMAP_BACKUP_KEY,
        firestore
      )
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
