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
import '@cypress/grep'
import 'cypress-mochawesome-reporter/register'
import { CY } from '../utils/common'

beforeEach(function () {
  //Prevent  cypress to fail on uncaught err.
  cy.failOnUncaughtException(CY.failOnUncaughtException)
  //Cache session
  cy.session(
    CY.loginUser,
    () => {
      //Setup protection cookie based on env
      //cy.protectionCookie()
      //Login with provided user
      cy.login(CY.loginUser)
      cy.changeToSlovakDarkTheme()
    },
    {
      cacheAcrossSpecs: true,
    }
  )
  cy.clipboardPermission()
  cy.visitBaseUrl(CY.visitBaseUrl, 10000)
})
