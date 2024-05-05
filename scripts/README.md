Here is a directory with an admin scripts that can be run like
```
npm run remove-change-logs
```
As an admin, these scripts have access to read and write all data in prod environment, regardless of Security Rules

The Full list of scripts can be found in package.json, section "scripts"

Install dependencies for scripts here (not in root of a project) with command like
```
npm install -D <packagename>
```

To run scripts locally, you need private-key.json which can be downloaded at Firebase Settings > Service Accounts: 
https://console.firebase.google.com/u/0/project/sci-map-1982/settings/serviceaccounts/adminsdk
(see also https://firebase.google.com/docs/admin/setup?hl=en#prerequisites)
