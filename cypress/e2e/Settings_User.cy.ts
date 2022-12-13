/// <reference types="cypress" />

import {
  USER_EMAIL,
  USER_FIRST_NAME,
  USER_LAST_NAME,
  USER_PASSWORD,
  USER_LICENCE,
  EXTERNAL_PROVIDER,
  DISTRIBUTION_SERVICE,
  EXTERNAL_SYS,
} from './support/constants'

describe(`Test user function, Env: ${Cypress.env('domain')}`, () => {
  it('Create User', () => {
    cy.visit('/settings')
    cy.getCyVisibleClick('user-settings')
    cy.getCyVisibleClick('button-create')
    cy.getCy('create-panel').should('be.visible')
    cy.getCy('user-email').type(`${USER_EMAIL}`)
    cy.getCy('user-first-name').type(`${USER_FIRST_NAME}`)
    cy.getCy('user-last-name').type(`${USER_LAST_NAME}`)
    cy.getCy('user-password').type(`${USER_PASSWORD}`)
    cy.getCy('user-asset-licences').click()
    USER_LICENCE.forEach((licence) => {
      cy.contains('.v-list-item-title', `${licence}`).click()
    })
    cy.contains('Create User').click()
    cy.getCy('user-admin-ext-systems').click()
    EXTERNAL_SYS.forEach((admin) => {
      cy.contains('.v-list-item-title', `${admin}`).click()
    })
    cy.contains('Create User').click()
    cy.getCy('user-allowed-asset-external-providers').click()
    cy.contains('.v-list-item-title', `${EXTERNAL_PROVIDER}`).click()
    cy.getCy('user-allowed-asset-external-providers').click()
    cy.getCy('user-allowed-distribution-services').click()
    DISTRIBUTION_SERVICE.forEach((service) => {
      cy.contains('.v-list-item-title', `${service}`).click()
    })
    cy.getCy('user-allowed-distribution-services').click()
    cy.getCy('toggle-true').first().click()
    cy.getCy('toggle-true').last().click()
    cy.getCy('button-close').should('be.visible')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCyVisibleClick('button-create-user')
    cy.alertMessage('Record was created')
  })
})
