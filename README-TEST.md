E2E Testing on AnzuSystems Admin-DAM by Petit Press a.s. (www.sme.sk)
=====

Simple guide on how to run E2E tests on the project.

---

# Prerequisites

## 1. Installation 
Follow the [installation guide](README-DEV.md#Installation) to install the project.

## 2. Run dev server
Follow the [run dev server guide](README-DEV.md#Dev---Run-dev-server) to run dev server.

# Test

### Run E2E tests
Script used to run tests inside the application docker container:

    bin/test

### Command options

    -e, --env     (Optional) Run tests in specific environment. (Default: local) 
    -b, --browser (Optional) Run tests in selected browser. (Allowed values: electron|chrome, Default: chrome)
    -f  --filter  (Optional) Comma separated list of filters without space (Default: n/a - all tests)
    -t, --tags    (Optional) Comma separated list of test suite tags. (Default: n/a)
    -s, --spec    (Optional) Relative dir to the test suite, wildcard can be used (Default: n/a - all tests)
    --dashboard   (Optional) Whether to push test results to cypress dashboard or create only local test results
                  You need to set CYPRESS_DASHBOARD_KEY in .env.docker.local
    --tag         (Optional) Run tests with specific tag for cypress dashboard (Run only with --dashboard option, Default: n/a)

### Examples:

    bin/test --env=local --browser=chrome --filter=@settings,@assets
    bin/test --tags=@ --dashboard
    bin/test --browser=chrome --spec=cypress/e2e/logOut.cy.ts --tag=Log-out --dashboard

### Support for multiple environments

Staging and devel config files are stored in `cypress/config` folder.

For testing create `stg.ts`/`dev.ts`/`local.ts` file in `cypress/config` folder.

File should contain following code:

*cypress/config/stg.ts*
```typescript
function extendCypressConfig(config) {
  config.baseUrl = ''
  config.env.credentials = {
    admin: {
      forceLoginLink: '',
    },
  }
  config.env.cookie = {
    name: '',
    value: '',
  }
  config.env.url = {
    domain: '',
    proto: '',
  }
  return config
}
module.exports = extendCypressConfig
```
