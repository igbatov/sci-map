# sci-map-vue3-ts

## Concept
The main goal of the project is to enforce one's curiosity in science
and channel it to practical action - job change or crowdfunding support

We try to implement it with the crowdsources-based map of knowledge.

Hypothesis is that one will use it to discover new knowledge as well as add her own notes
and eventually be ready to change job or choose right crowdfunding project and support it.

Specific rules that define how sci-map should work is defined by community

### The first draft
First draft of rules is based on [Barbara Minto pyramid](https://medium.com/lessons-from-mckinsey/the-pyramid-principle-f0885dd3c5c7) and
[Zettelkasten](https://writingcooperative.com/zettelkasten-how-one-german-scholar-was-so-freakishly-productive-997e4e0ca125)

Namely - node contains
1) one's personal description of the topic (theory/fact/concept/problem)
2) links to resources (books, videos, blog articles etc) that describes topic in details
3) links to the jobs that let one make progress on the topic
4) links to crowdfunding campaigns that push this topic forward
5) children nodes that are somehow connected the described node

### Process of adding new node 
Any registered user can add new node and as well as connect/move any nodes (connected node is seen as a children node).
User tries to categorize children nodes according to Minto principles
When he is ready to publish her changes for public map he pushes the commit button
New node is added to other users maps and those of them who saw the node whether moves it, deletes or does nothing.

After sometime majority will have some common form of this new/connect/move. This change will be applied to maps of those who
did not check (=looked on) those changes. And this change will also be offered to this who did their own changes (including initial user)
making their own changes uncommited.

This way every person will have its own common and uncommited version of nodes he checked and common version of nodes did not check yet.

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



