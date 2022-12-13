E2E Testing on AnzuSystems Admin-DAM by Petit Press a.s. (www.sme.sk)
=====

Simple guide on how to run E2E tests on the project.

---

# Prerequisites

## 1. Installation 
Follow the [installation guide](README-DEV.md#Installation) to install the project.

## 2. Run dev server
Follow the [run dev server guide](README-DEV.md#Dev-Run-dev-server) to run dev server.

## 3. Setup credentials.json

 Create file "credentials.json" in /cypress/fixtures folder with following content:

```json
{
  "admin": {
    "username": "",
    "password": ""
  }
}
```  
*Insert your credentials to the file.*


## Test

### Run E2E tests
Script used to run tests inside the application docker container:

    bin/test

### Command options

    -b, --browser (Optional) Run tests in selected browser (Allowed values: electron|chrome|firefox|all, Default: electron)
    -t, --tags    (Optional) Comma separated list of test suite tags. See docs for all tags. (Default: n/a)
    -s, --spec    (Optional) Relative dir to the test suite, wildcard can be used (Default: n/a - all tests)
    --dashboard   (Optional) Whether to push test results to cypress dashboard or create only local test results
                  You need to set CYPRESS_DASHBOARD_KEY in .env.docker.local
    --tag         (Optional) Run tests with specific tag for cypress dashboard (Run only with --dashboard option, Default: n/a)

### Examples:

    bin/test --env=local --browser=chrome
    bin/test --tags=@ --dashboard --spec=cypress/e2e/**
    bin/test --browser=chrome --spec=cypress/e2e/Log-out.cy.ts --tag=Log-out --dashboard



