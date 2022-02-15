# sci-map-vue3-ts

## Concept
The main goal of the project is to enforce one's curiosity in science
and channel it to practical action - job change or crowdfunding support

We are implementing it with the crowdsources-based map of knowledge.

Hypothesis is that such map will help discover new knowledge efficiently and one will start making her own notes
and eventually be ready to change job to more suitable or choose crowdfunding project to support.

Specific rules that define how sci-map should be organized is defined by community.

### The first draft of rules
First draft of rules is based on [Zettelkasten](https://writingcooperative.com/zettelkasten-how-one-german-scholar-was-so-freakishly-productive-997e4e0ca125)
but adds some structure.

Any registered user can add new node and as well as delete old connections and add new ones (connected node is seen as a children nodes).

Node can have the following types
- phenomena - description of some phenomena that produces facts. For example Hydrogen Atom is a phenomena that generates facts
- fact - is a result of one or several experiments and used as an argument for or against a concept
- concept - some definition that is helpful in description of phenomena. For example "integral" is a useful concept
- problem - is an open question that has no yet answered. For example "Measurement Problem" in quantum mechanics
- group - used as a category to group together some other nodes, for example "Atoms" is group for phenomena nodes "Hydrogen Atom", "Helium Atom" and so on

There are some common group names, one should consider using then before any new group
- produces - group for phenomenas that is based on the parent phenomena (there maybe multiple parents)
- concepts - group of concepts useful for understanding phenomena under consideration
- facts - group of known result of experiments
- structure - description of parts and functions of phenomena
- problems - group of questions that need to be answered

```
Example
Say we want to add a node that describes "Godel incompleteness theorem" - this is phenomena 
(not fact because it is not result of an experiment).
To find node to add it, please, try to think about phenomenas that give rise to this.
If you will think about it you will have better understanding of phenomena and better place to fit on map.
In our case it seems that Logic and Arithmetic produces "Godel incompleteness theorem".

While adding select will provide you with nodes that may already represent the one you're trying to add.
```

When one is ready to publish her changes for public map she pushes the "Сommit" button
Modification is added to other users maps and those who edited node or subscribed to node changes will receive email on modification.
They may also do some edits. If someone is also editing node locally, it will be visible to all viewers.
If after commit conflict is detected, then user will see changes commited before him and his own (uncommited because of conflict)
version and act accordingly - manually merge person edits and do commit again.

Not all nodes maybe of interest for particular person. Those that are personal interest can be marked as "personal interest"
and be more viewable than peer nodes.

### Node contents

Node content contains
1) user personal description of the topic (theory/fact/concept/problem)
2) links to resources (books, videos, blog articles etc) that describes topic in details
3) links to the jobs that help humanity make progress on the topic
4) links to crowdfunding campaigns that push this topic forward
5) children nodes that are somehow connected the described node

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



