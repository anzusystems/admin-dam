/// <reference types="cypress" />
require('cypress-downloadfile/lib/downloadFileCommand')

// commands
import '../commands/admin'
import '../commands/auth'
import '../commands/common'
import '../commands/api'
import '../commands/upload'
import '../commands/license'

// plugins
// @cypress/grep 6 no longer registers itself on import.
import { register as registerCypressGrep } from '@cypress/grep'
import 'cypress-mochawesome-reporter/register'
import { CY } from '../utils/common'

registerCypressGrep()

beforeEach(function () {
  //Prevent  cypress to fail on uncaught err.
  cy.failOnUncaughtException(CY.failOnUncaughtException)
  //Cache session
  cy.session(
    CY.loginUser,
    () => {
      //Login with provided user
      cy.webLogin(CY.credentials[CY.loginUser].username, CY.credentials[CY.loginUser].password)
      cy.login(CY.loginUser)
      cy.changeToSlovakDarkTheme()
      // go to main licence
      cy.changeLicence(100000)
    },
    {
      cacheAcrossSpecs: true,
    }
  )
  cy.clipboardPermission()
  cy.visitBaseUrl(CY.visitBaseUrl, 30000)
})
