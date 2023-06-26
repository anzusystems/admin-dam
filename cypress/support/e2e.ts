/// <reference types="cypress" />

// commands
import '../commands/admin'
import '../commands/auth'
import '../commands/common'
import '../commands/api'
import '../commands/upload'

// plugins
import '@cypress/grep'
import 'cypress-mochawesome-reporter/register'
import { CY } from '../utils/common'

beforeEach(function () {
  cy.log(CY.credential.admin.forceLoginLink)
  //Prevent  cypress to fail on uncaught err.
  cy.failOnUncaughtException(CY.failOnUncaughtException)
  //Cache session
  cy.session(
    CY.loginUser,
    () => {
      //Setup protection cookie based on env
      cy.protectionCookie()
      //Login with provided user
      cy.login(CY.loginUser)
    },
    {
      cacheAcrossSpecs: true,
    }
  )
  cy.visitBaseUrl(CY.visitBaseUrl, 10000)
})
