# sci-map-vue3-ts

## Concept
The main goal of the project is to enforce one's curiosity in exploring science
and ease channeling this curiosity to practical action - job change or crowdfunding support

The idea is to create crowdsources-based map that gives structure in scientific knowledge, job internships and crowdfunding projects.

Hypothesis is that such map will help discover new knowledge efficiently and one will start making her own notes
and eventually be ready to change job to more suitable or choose crowdfunding project to support.

Specific rules that define how sci-map should be organized is defined by community.

### The first draft of rules
First draft of rules is based on [Zettelkasten](https://writingcooperative.com/zettelkasten-how-one-german-scholar-was-so-freakishly-productive-997e4e0ca125)
but adds some structure.

We postulate that everything in the world is the phenomena that has some internal structure is produced
by one multiple other phenomenas.

For example fields produces atoms, atoms produces molecules, molecules produces cells, cell produces animals,
animals produces Humans, Culture, Social groups and so on.

So basically we have a graph of phenomenas that is connected by which produces which.

However, number of phenomenas is enormous, so to ease exploration we organize them in groups.
For example Human produces Science, Languages, Arts, Philosophy, Countries, Companies and so on
And Science is just and name for group of other groups - namely Physics, Medicine, Mathematics, Economics and so on.

Also, very often we do not know exactly what produces phenomena, but know correlations and have some ideas (hypothesis, theories)
of production mechanism and some maybe some facts these ideas is based.
This production mechanisms should be verified by further experiments.

And also some phenomenas is a complex concepts that his its non-trivial structure.
For example cell or human body is such a complex phenomenas with its structure.

And last but not least we have questions that one wants to answer.

Node can have the following types of nodes
- phenomena
- fact - is a special type of phenomena that can be described as a result of one or several experiments and used as an argument for or against a concept
- theory (idea, hypothesis) - description of some theory that explains phenomenas (facts is also phenomenas). Theory may have alternatives. For example theory of strings has different alternatives.
- group - used as a category to group together some other phenomenas, for example "Atoms" is group for phenomena nodes "Hydrogen Atom", "Helium Atom" and so on
- question - is an open question that has no yet answered. For example "Measurement Problem" in quantum mechanics

And there are following type of connections between nodes
- produces - connect phenomena-causes to phenomena-consequences
- structure - nodes that explains structure of phenomena
- is a subgroup - used to connect classification of phenomenas

```
Example
Say we want to add a node that describes "Godel incompleteness theorem" - this is phenomena.
To find node to add it, please, try to think about phenomenas that produces this phenomena, what it is based on.
If you will think about it you will have better understanding of phenomena and better place to fit on map.
In our case it seems that Logic and Arithmetic produces "Godel incompleteness theorem".

While adding select will provide you with nodes that may already represent the one you're trying to add.
```

Any registered user can add new node and as well as delete old connections and add new ones (connected node is seen as a children nodes).

When one is ready to publish her changes for public map she pushes the "Сommit" button
Modification is added to other users maps and those who edited node or subscribed to node changes will receive email on modification.
They may also do some edits. If someone is also editing node locally, it will be visible to all viewers.
If after commit conflict is detected, then user will see changes commited before him and his own (uncommited because of conflict)
version and act accordingly - manually merge person edits and do commit again.

Not all nodes maybe of interest for particular person. Those that are personal interest can be marked as "personal interest"
and be more viewable than peer nodes.

### Node contents

Node content contains
1) user personal description of the topic
2) links to resources (books, videos, blog articles etc) that describes topic in details
3) links to the jobs that help humanity make progress on the topic
4) links to crowdfunding campaigns that push this topic forward
5) children nodes that are somehow connected the described node

## Проблема с представлением в виде mind-map
На примере mindmeister. 
1) Узлы хочется помечать типом утверждения (теория, факт, вопрос, концепт, группа) одновременно помечать некоторые 
узлы как интересные лично мне, чтобы они были более заметны по сравнению с остальными (занимали 60% визуального пространства).
Так же и неинтересные лично мне - чтобы они были менее заметные чем "интересные" и "неотмеченные".
2) Один и тот же узел вместе со всеми потомками может находится в разных частях дерева.
Или например, вирус "Helicobacter pylori" может быть как в "Multiatom Structures"->"Organic Compounds"->"Viruses" так и в
Human->Science->Medicine->"Classification of Diseases"->"Cancer"->"Gastric Cancer"->"Causes" 
и в Human->Problems->Immortality->"Causes of death and disability"
3) Естественная структура преполагает что любой феномен (=теория) порождены несколькими разными феноменами.
В дереве непонятно как наглядно отобразить что у одного узла несколько предков.

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



