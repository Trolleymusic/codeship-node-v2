# codeship-node-v2

A newer version of [codeship-node](https://www.npmjs.com/package/codeship-node) for use with [version 2 of the Codeship API](https://apidocs.codeship.com/v2)

## Usage

```
import Codeship from 'codeship-node-v2'

const codeship = new Codeship({
  orgUuid: 'organisation-uuid',
  orgName: 'organisation-name',
  username: 'jane@example.com',
  password: 'codeshipPassword'
});
```

Only one of the organisation details is required, the UUID will be found if you supply the name.

Like the original [codeship-node](https://www.npmjs.com/package/codeship-node) module, each method is nested under its resource name, this time it's implemented with native promises:

```
codeship.projects.list()
  .then((projects) => console.log('Projects!', projects))
  .catch((error) => console.error('Error!', error))
```

You could also use it in an async function using await:

```
try {
  const project = await codeship.projects.list()
  console.log('Projects!', projects)
} catch (error) {
  console.error('Error!', error)
}
```

The whole API is not yet implemented. The current list of functionality is:

```
builds.list(projectUuid)
builds.get(buildUuid, projectUuid)
builds.restart(buildUuid, projectUuid)
projects.get(projectUuid)
projects.list()
```

## TODO:

* Write tests
* Provide more coverage of the API
