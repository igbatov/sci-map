# Concept
The main goal of the project is to ease access to deep and profound understanding of how things work and give access to means that change the world.

We want to create framework for crowdsources-based map of scientific knowledge that is driven by such rules that structured and profound description of knowledge is emerged.

We expect that it will also rise network of people and give access to actions that change the world effectively.

Specific rules that define how sci-map should be organized is defined by community.
Below is an up-to-date formulation of these rules.

# Rules
First draft is based on concept of [Zettelkasten](https://writingcooperative.com/zettelkasten-how-one-german-scholar-was-so-freakishly-productive-997e4e0ca125)
but adds some structure and restrictions for quality of content to emerge in a crowdsources-based way.

## General assumptions
Let's postulate that everything in the world is the phenomena that 
1) has some internal mechanics/structure
2) is produced by one or several other phenomenas.
3) has some theory that describes its internal mechanics/structure (or at least hypothesis that should be verified by further experiments)

For example quantum fields produces atoms, atoms produces molecules, molecules produces cells, cell produces animals,
animals produce culture and so on.

So basically we have a graph of phenomenas that is connected by which produces which (if some phenomena influence other, we also call it "produce").

However, number of phenomenas produced may be enormous, so to ease exploration of map we may want to organize them in groups.
For example Human produces Culture that consists from Science, Languages, Arts, Philosophy, Countries and so on
And Science is just a name for group of other groups - Physics, Medicine, Mathematics, Economics and so on.

In contrast to connections between phenomenas, partition of phenomenas on groups is subjective and can have multiple equally useful variants.

Also, it is important that very often we do not know yet exactly what really produces phenomena and its internal mechanics.
We know maybe some correlations and have some hypothesis or theories about it.
And we know that this hypothesis should be further verified by experiments.

Also, some phenomenas involve a complex concepts that has its own non-trivial structure.
(For example a cell is such a complex phenomena with its own structure).

And last but not least one may have questions that one seek to answer.

With these assumptions in mind let's define structure of map

## Phenomena-produces-phenomena structure
Node can have one of the following types
- phenomena - depicts anything that expresses itself somehow (atom, fish, war, etc.). Fact - is a special case of phenomena that can be described as a result of experiment.
- theory (idea, hypothesis) - is a description of how a phenomena or group of phenomenas function and what attributes and consequences does it have.
Theory may have open questions and different alternatives (for example theory of strings has different alternatives). And theory may not be totally correct. For example Einstein general relativity is more correct than Newton's theory. However, maybe there exists even more correct theory.
- question - is an open question that has no yet answered. For example "Measurement Problem" in quantum mechanics. Questions have two types - questions that relates to everybody (like "Measurement Problem") and personal questions that relates only to the author ("What is my personal best life strategy?"). The last one only visible to question author.
- group - used as an auxiliary node to groups together other nodes - for example "Atoms" is group for phenomena nodes "Hydrogen Atom", "Helium Atom" and so on

And there are following type of connections between nodes
- produces - connect phenomena-causes to phenomena-consequences, for example fields produces atoms that produces molecules that produces cells that produces human that produces mathematics, spaceships, revolutions and so on.
When we have theory for some phenomena we may connect theory-cause to theory-consequence instead of phenomena, just because this theory is up-to-date description of some phenomena, maybe not final, however.
- is a subgroup - used to connect groups in a hierarchical manner
- structure - subtree that further explains internal mechanics/structure of root node
- alternative - sometimes there is no single theory that can explain all phenomenas, but we have different competitive theories that should be further verified by experiment. In such case different theories is grouped under node "Theory not exists" with connection "alternative".

```
Example
Say, we want to add a node that describes "Godel incompleteness theorem" - this is phenomena.
To find node to connect it to, first, try to think about phenomenas that produces "Godel incompleteness theorem" - i e what it is based on.
In our case it seems that "Logic" and "Arithmetic" produces "Godel incompleteness theorem".
```

While adding new node you will notice autoselect with hints - nodes that may already represent the one you're going to add.
If you see a hint that already describes what you want to add, then, please, take time and read it.
If after reading you feel that your description depicts phenomena in another, maybe more understandable way - feel free to add it as an alternative description.
Every description will be voted and most popular will be shown first.
If you think that description is ok but need some corrections - go on and make it.

Connections of node with other nodes is treated the same way as node's content. Alternative explanations of the same node
may have different connections.

Any registered user can add new node and as well as delete old connections and add new ones (connected node is seen as a children nodes).

When one is ready to publish her changes for public map she pushes the "Сommit" button
Modification is added to other users maps and those who edited node or subscribed to node changes will receive email on modification.
They may also do some edits. If someone is also editing node locally, this fact will be visible to all viewers.
If after commit conflict is detected, then user will see changes commited before him and his own (uncommited because of conflict)
version and act accordingly - manually merge person edits and do commit again.

Some nodes maybe interesting only to you (you don't want to publish it or don't think it is useful for others) - it is okay.
Exclude such nodes from commit marking them as "only personal interest".

You can also make some nodes more visible to you (make them bigger) - this changes also will not be commited.

## Special type nodes
Due to our lack of knowledge many phenomenas still cannot be organized in a clear phenomena-produces-phenomena structures described above.
Sometimes you have just several small pieces of huge puzzle yet to be solved.
However, this pieces is worth to be described to ease further puzzle investigation (clear phenomena-produces-phenomena description is a final goal).
That is why there are two special group type for node - "book" and "questions".
"Book" is just root group node for mindmap of ideas/theories/facts/whatever somehow gathered and described in some book/course/whatever.
"Questions" is a root for questions on the subject that you want to find answer to and connects whatever nodes that can help answer this question.

## Node contents
Node content consists from
1) users description of the topic. Text of description may have links to other nodes.
2) connections to other nodes (see "type of connections")
3) list of links to resources (books, videos, blog articles etc) that describes topic in details, every resource can be marked as ["to read", "already read"] and have personal rating (rate 1/2/3/4/5 stars)
4) list of links to crowdfunding campaigns that push this topic forward
5) list of links to the jobs that help humanity make progress on the topic

## Example in form of mind-map
https://www.mindmeister.com/map/1985564667

# Project setup
```
yarn install
```

## Compiles and hot-reloads for development
```
yarn serve
```

## Compiles and minifies for production
```
yarn build
```

## Run your unit tests
```
yarn test:unit
```

## Run your end-to-end tests
```
yarn test:e2e
```

## Lints and fixes files
```
yarn lint
```

## Customize configuration
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



