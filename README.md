# sci-map

## Rules of classification
General rule of classification is somewhat similar to Barbara Minto pyramid ([summary](https://medium.com/lessons-from-mckinsey/the-pyramid-principle-f0885dd3c5c7)):
 - parent node gives a summary of its children nodes and contains a mental picture of context, situation or complication
 - children nodes give mutually exclusive and completely exhaustive partition of the parent content
 - children nodes also logically connected and structured in obvious manner - by size or timeline or academic field, etc

Every node must have a link to a wikipedia article and may have links to other resources
(articles, books chapters, online lecture, etc) that explains the same idea with different words and examples 

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

## Run in docker
```shell script
docker build -t sci-map .
docker run -d -p 80:80 --rm --name sci-map sci-map
```

## Deploy on gitlab
https://blog.logrocket.com/how-to-auto-deploy-a-vue-application-using-gitlab-ci-cd-on-ubuntu/
Don't forget to disable shared runners in your gitlab.com account (section Ruuners in https://gitlab.com/<username>/sci-map/-/settings/ci_cd)

## Logic of label showing
- Create rows until width > height. Number of rows must be even so that parent label do not overlap with middle child.
- Show only 3 levels at the same time, each level must have its own border style (at least 6 level styles)
- Show white shadow around label
- Label place and size must be fixed with respect to Zoom and Pan
- Show label only if its container is big enough to fit it with minimal (fixed) padding
- Top and bottom padding around label must be no less that 1/2 of height of parent label
- If parent has only 1 child - add one the one dummy child with name "terra incognito"
