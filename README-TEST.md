E2E Testing on AnzuSystems Admin-DAM by Petit Press a.s. (www.sme.sk)
=====

Simple guide on how to run E2E tests on the project.

---

## 1. Project installation
Follow the [installation guide](README.md) to install the project and run dev server.


## 2. Tests configuration

- Staging and devel config files are stored in `cypress/config` folder.


- For testing create `stg.ts`/`dev.ts`/`local.ts` file in `cypress/config` folder, then change environment parameter 'cfg'
  in `cypress.config.ts`


- Some are stored in [BitWarden](https://vault.bitwarden.com/#/vault?collectionId=5ec1888a-edc3-4141-8d69-b14800d2726c&itemId=2d496bd8-9b56-41f7-811a-b148007cd710) under name `Cypress Config - DAM` or use following example:
```typescript
function extendCypressConfigStg(config) {
    config.baseUrl = ''
    config.env.credentials = {
        admin: {
            username: '',
            password: '',
            forceLoginLink: '',  // admin forceLoginLink
        },
    }
    config.env.url = {
        domain: '',
        proto: '',
    }
    return config
}
module.exports = extendCypressConfigStg
```

## 3. Run E2E tests

First script used to run tests inside the application docker container:

    bin/test

### Command options:

    -e, --env     (Optional) Run tests in specific environment. (Default: local) 
    -b, --browser (Optional) Run tests in selected browser. (Allowed values: electron|chrome, Default: chrome)
    -f  --filter  (Optional) Comma separated list of filters without space (Default: n/a - all tests)

### Examples:

    bin/test --env=local --browser=chrome --filter=@assets,@navigation,@upload
    bin/test -e stg -b chrome -f @licence,@assets
    /*  Do not use space before @ using --filter  */

### Second script - Visual base Environment:

    yarn cypress open -C cypress/config/cypress.config.ts
