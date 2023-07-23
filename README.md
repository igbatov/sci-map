# Concept

Goal: attract and direct human activity to push forward science as fast as possible.

This is first draft MVP of the application for crowdsourced "Map Of Science".
Its intent is to show concept of the map and gather feedback to build appropriate application.

The goal for the map to give clear and holistic view, best explanations and direct to to practical actions.

We also post jobs and show their connection with question that will help to solve most interesting and hard question of humanity.

# Why not Wikipedia, quora and stackoverflow?
Wikipedia, quora and stackoverflow are great at subjects where the answer is known.
But think about such hard questions as "How one can extend his/her healthy life",
"How to end the wars between countries ...", "How to create consciousness" and so on - nobody knows the exact answer.

For the hard questions instead of vague general answers, it would be better to see 
 - all known facts that contributes to the puzzle
 - well-structured clear, reasonable and testable hypotheses
 - contacts of enthusiasts and companies that try to test  these hypotheses with clear current status and needs of the test

The goal of this project is to explicitly formulate this hypothesis and make any kind of help easy - volunteering, equipment leasing, full-time job, specialist contacts, double-blind experiment participation, crowdfunding etc.

# How to build such project?
It seems that we should
1) attract specialists to add known facts, theories and formulate viable hypothesis to the problem (for some problems non-specialists is also ok)
2) attract enthusiasts that are willing to somehow take part in hypothesis testing

What can attract specialists? It seems they like to get as well as share knowledge in a field (and gather community kudos).

We are looking to create community and rules that will deliver easily explorable information and connections (in some form of a map)
with emphasize on formulation of viable hypothesis and steps to be taken to test them with current actual status of research.

# Rules
First draft is based on concept of [Zettelkasten](https://writingcooperative.com/zettelkasten-how-one-german-scholar-was-so-freakishly-productive-997e4e0ca125)
and [Hierarchical Network](https://fibery.io/blog/the-knowledge-organization/).

Let's postulate that everything in the world is the phenomena that 
1) is produced by one or several other phenomenas
2) has some theory that describes its internal mechanics/structure (or at least hypothesis that should be verified by further experiments)

For example quantum fields produces atoms, atoms produces molecules, molecules produces cells, cell produces animals,
animals produce culture and so on.

So basically we have a graph of phenomenas that is connected by which produces which (if some phenomena influence other, we also call it "produce").

However, number of phenomenas produced may be enormous, so to ease exploration of map we want to organize them in hierarchical groups.
For example Human produces Culture that consists from Science, Languages, Arts, Philosophy, Countries and so on
And Science is just a name for group of other groups - Physics, Medicine, Mathematics, Economics and so on.

In contrast to connections between phenomenas, organization in hierarchical groups is subjective and can have multiple equally useful variants.

Also, it is important that very often we do not know yet exactly what really produces phenomena and its internal mechanics.
We know maybe some correlations and connected facts and have some hypothesis or theories about it.
And we know that this hypothesis should be further verified by experiments.

Also, some phenomenas involve a complex concepts that has its own non-trivial structure.
(For example a cell is such a complex phenomena with its own structure).

And last but not least one may have questions that one seek to answer.

With these assumptions in mind let's define structure of map

## Phenomena-produces-phenomena hierarchical structure
General rule of the map: every node follows from other nodes (premise nodes) by means of induction, deduction or abduction.
Also, two nodes A and B are linked in case one should understand A to understand B.

Every node represents an experimental fact (E) or model/concept (M).

One node contains others if its contents describe it descendants (abstract them on a more high level).

Description of node should be as vivid and simple as possible. 
One should be able to understand contents of node if she understood premise nodes with no need for any additional research.
Time to read and understand contents of one node ideally should be no more that 15 min.

## Node contents
Node content consists from
1) users description of the topic. Text of description may have links to other nodes.
2) connections to other nodes
3) list of links to resources (books, videos, blog articles etc) that describes topic in details, every resource can be marked as ["to read", "already read"] and have personal rating (rate 1/2/3/4/5 stars)
4) list of links to crowdfunding campaigns that push this topic forward
5) list of links to the jobs that will help to make progress on the topic

## Example in miro
https://miro.com/app/board/uXjVM01SlDY=/?share_link_id=351640375137

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



