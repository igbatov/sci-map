# Concept

Goal: attract and direct human activity to push forward science as fast as possible.

This is first draft MVP of the application for crowdsourced "Map Of Science".
Its intent is to show concept of the map and gather feedback to build appropriate application.

The goal for the map is to 
 - give clear and holistic view, the best explanations available
 - direct people into group for practical actions

We also post jobs and show their connection with question that will help to solve most interesting and hard question of humanity.

We intend to create search platform where one can select its skills and we will find companies from our list that
are searching for candidates with such skills.

# Why not Wikipedia, Quora and StackOverflow?
Wikipedia, quora and stackoverflow are great at subjects where the answer is known.
But think about such hard questions as "How to extend healthy life",
"How to end the wars", "How to create [AI-complete](https://en.wikipedia.org/wiki/AI-complete)" and so on - nobody knows the exact answer.

For the hard questions instead of vague general answers, it would be better to see 
 - all known facts that contributes to the puzzle
 - well-structured clear, reasonable and testable hypotheses
 - contacts of enthusiasts and companies that try to test  these hypotheses with clear current status and needs of the test

The goal of this project is to explicitly formulate this hypothesis and make any kind of help easy - volunteering, equipment leasing, full-time job, specialist contacts, double-blind experiment participation, crowdfunding etc.

# How to build such project?
It seems that we should
1) attract specialists to add known facts, theories and formulate viable hypothesis to the problem (for some problems non-specialists is also ok)
2) attract enthusiasts that are willing to somehow take part in hypothesis testing

We are looking to create community and rules that will deliver easily explorable information and connections (in some form of a map)
with emphasize on formulation of viable hypothesis and steps to be taken to test them with current actual status of research.

# Rules
First draft is based on concept of [Zettelkasten](https://writingcooperative.com/zettelkasten-how-one-german-scholar-was-so-freakishly-productive-997e4e0ca125)
and [Hierarchical Network](https://fibery.io/blog/the-knowledge-organization/).

Let's postulate that everything in the world is the phenomena that 
1) is produced by one or several other phenomenas
2) has some theory that describes its internal mechanics/structure (or at least hypothesis that should be verified by further experiments)

For example quantum fields produces particles, particles produce atoms, atoms produces molecules, molecules produces cells, cell produces animals,
animals produce social hierarchies, which produce artifacts and so on.

So basically we have a graph of phenomenas that is connected by which produces which (if some phenomena influence other, we also call it "produce").

However, number of phenomenas produced may be enormous, so to ease exploration of map we want to organize them in hierarchical groups.
For example Human produces Culture that consists from Science, Languages, Arts, Philosophy, Countries and so on
And Science is just a name for group of other groups - Physics, Medicine, Mathematics, Economics and so on.

In contrast to causal connections between phenomenas, organization in hierarchical groups is subjective and can have multiple equally useful variants.

Also, it is important that very often we do not know yet exactly what really produces phenomena and its internal mechanics.
We know maybe some correlations and connected facts and have some hypothesis or theories about it.
And we know that this hypothesis should be further verified by experiments.

Also, some phenomenas involve a complex concepts that has its own non-trivial structure.
(For example a cell is such a complex phenomena with its own structure).

And last but not least one may have questions that one seek to answer.

With these assumptions in mind let's define structure of map

## Phenomena-produces-phenomena hierarchical structure
General rule of the map: every node follows from other nodes (premise nodes) by means of induction, deduction or abduction.
Also, two nodes A and B are linked in case one should understand A to understand B (A use concept B).

Every node represents an experimental fact (E) or model/concept (M).

One node contains others if its contents describe it descendants (abstract them on a more high level).

Description of node should be as vivid and simple as possible. 
One should be able to understand contents of node if she understood premise nodes with no need for any additional research.
Time to read and understand contents of one node ideally should be no more that 15 min.

## Node contents
Node content consists from
1) users description of the topic
2) connections to other nodes (see explanation above)
3) list of links to resources (books, videos, blog articles etc) that describes topic in details, every resource can be marked as ["to read", "already read"] and have personal rating (rate 1/2/3/4/5 stars)
4) list of links to crowdfunding campaigns that push this topic forward
5) list of links to the jobs that will help to make progress on the topic

## Example
https://scimap.org/

# Collaborative editing in MVP
Technically hard part of project is collaborative editing.
For MVP we want most simple still workable solution.

Right now we will try Alternative #1 (see below) but maybe some other solution will come later.

## Alternative #1 - any registered user can edit anything in realtime
Contributors synchronize in https://t.me/+uhbBHhzEyZRkYzRi on time, and modifications they are going to make in a map.
For example "Hi, I am going to edit Aging in Biology this evening from 19 till 21 UTC. Want to add some companies in reprogramming section.".
We also make snapshot for the whole map every hour
Every registered user have button "download map" to save map locally in json format.
If some breaking changes occurs we can revert map to the version of last hour or from version that contributor downloaded.
All modifications during this hour (or time contributor downloaded his/her version) will be lost (yes, even good one).

## Alternative #2 - using github
More sophisticated solution can be push map to github in json format and make version control like code developers do.
In this solution every contributor has only its own version of map and button "download your version of map" (the last one will download json file).
After editing is done contributor creates new branch from master in github, overwrite it with downloaded json,
manually merge last master, manually resolve conflicts (if any), open merge request is merged to master by someone with appropriate rights.

This github solution gives more control on map versioning but require contributors to learn new skills - how to work in github and merge json manually.

# Personalization of map
Besides users that can edit anything we can allow for everyone registered user to personalize its map 
- add comments to nodes that visible ony to them and pin some nodes that are of the most interest only for them.
There is no collaborative editing for such users so this is simple in developing.

# Application setup for developers
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
Generate private key in firebase console as described here https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments
Move this file to /scripts/private-key.json
Then 
```shell
$ firebase deploy --only functions
```
### Look for logs in production
https://console.cloud.google.com/logs/query
https://console.firebase.google.com/project/sci-map-1982/functions/logs

### Run app on emulator
Set in src/api/api.ts
```shell
export VUE_APP_IS_EMULATOR=true; yarn serve
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

## Uploud picture on cdn
```shell
gcloud storage cp ~/Downloads/wave1rope.png     gs://sci-map-cdn/images/
```

## Deploy on gitlab
https://blog.logrocket.com/how-to-auto-deploy-a-vue-application-using-gitlab-ci-cd-on-ubuntu/
Don't forget to disable shared runners in your gitlab.com account (section Ruuners in https://gitlab.com/<username>/sci-map/-/settings/ci_cd)

### If deploy job fails with "no space left on device"
Just ssh to your host and do
```shell
docker system prune --all
```

# Alternative visualizations
Here is some other approaches to visualize the same structure (which is called "hierarchical network" or "hierarchical graph")
Bubbles
https://www.figma.com/proto/gdsTx92knJmXZjSUAmYeO7/scimap?node-id=2-753&starting-point-node-id=2%3A753&scaling=scale-down
Chord diagram
https://onlinelibrary.wiley.com/cms/asset/e8bfe23d-0499-4a11-a4a4-58647afc9d58/cgf13610-fig-0010-m.jpg
https://miro.medium.com/v2/resize:fit:1400/format:webp/1*FBaB_aGUcWbfrLr1Ric5bQ.png


