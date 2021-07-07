# sci-map-vue3-ts

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Run your unit tests
```
yarn test:unit
```

### Run your end-to-end tests
```
yarn test:e2e
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

# Firebase commands
You can deploy security rules for realtime database and storage as well as function definitions with following command
## Deploy security rules
### Storage rules
Sits in file storage.rules
You can deploy it in production with
```shell
firebase deploy --only storage
```

### Storage rules
Sits in file database.rules.json
You can deploy it in production with
```shell
firebase deploy --only database
```
## Firebase function
### Install firebase-tools (once)
```shell
$ npm install -g firebase-tools
$ firebase logout
$ firebase login
```
### Choose emulators to run
```shell
firebase init emulators
```
### Run empty emulator
```shell
$ firebase emulators:start
```
### Save data from running emulator
```shell
firebase emulators:export functions/data
```
### Run emulator with exported data
```shell
firebase emulators:start --import=functions/data
```
### Deploy functions on production
```shell
$ firebase deploy --only functions
```
### Look for logs in production
https://console.cloud.google.com/logs/query
https://console.firebase.google.com/project/sci-map-1982/functions/logs

### Run app on emulator
Set in src/api/api.ts
```shell
export VUE_APP_IS_EMULATOR=true
yarn serve
```

#### Emulate schedule function
Emulator do not support schedule
To imitate schedule locally you can run it in shell:
```shell
firebase functions:shell
>setInterval(() => cleanProcessedEventIDs(), 60000)
````

## Run app in docker
```shell script
docker build -t sci-map .
docker run -d -p 80:80 --rm --name sci-map sci-map
```

## Deploy on gitlab
https://blog.logrocket.com/how-to-auto-deploy-a-vue-application-using-gitlab-ci-cd-on-ubuntu/
Don't forget to disable shared runners in your gitlab.com account (section Ruuners in https://gitlab.com/<username>/sci-map/-/settings/ci_cd)

### If deploy job fails with "no space left on device"
Just ssh to your host and do
```shell
docker system prune --all
```

## Rules of classification
General rule of classification is somewhat similar to Barbara Minto pyramid ([summary](https://medium.com/lessons-from-mckinsey/the-pyramid-principle-f0885dd3c5c7)):
 - parent node gives a summary of its children nodes and contains a mental picture of context, situation or complication
 - parent node is more abstract and tend to be more fun and popular - one of its main goals is to give the reader a sense of the theme and arouse curiosity
 - children nodes give mutually exclusive and completely exhaustive partition of the parent content
 - children nodes also logically connected and structured in obvious manner - by size or timeline or academic field, etc
 - number of children should be kept small, no more than 12 (ideally around 5-7)
 
Every node must have a link to a wikipedia article and may have links to other resources
(articles, books chapters, online lecture, etc) that explains the same idea with different words and examples 

