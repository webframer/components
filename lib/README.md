## Deployment

First, run this command to find out where npm expects to have auth token:

```
npm config ls -l
# then look for
# userconfig = "/Users/<user>/.npmrc" 
```

Second, setup `.npmrc` with this content:

```
//registry.npmjs.org/:_authToken=<your_npm_publish_token>
```

Third, to deploy, run:

```shell
npm run push
```
