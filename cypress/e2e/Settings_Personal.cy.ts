/// <reference types="cypress" />

import { LENGUAGE_SK, LENGUAGE_EN, THEME_LIGHT, THEME_DARK, THEME_AUTO } from './support/constants'

describe(`Test user settings, Env: ${Cypress.env('env')}`, () => {
  it('Test user settings', () => {
    cy.visit('/')
    cy.getCyVisibleClick('button-user')
    cy.getCyVisibleClick('button-settings')
    cy.verifySubPage('personal-settings', '/settings', 'Personal')
    cy.getCyVisibleClick('settings-language')
    cy.contains('.v-list-item-title', `${LENGUAGE_SK}`).click()
    cy.getCy('personal-settings').should('contain', 'Osobné')
    cy.contains('.v-list-item-title', `${LENGUAGE_EN}`).click()
    cy.getCy('personal-settings').should('contain', 'Personal')
    cy.getCy('settings-language').click()
    cy.getCyVisibleClick('settings-theme')
    cy.contains('.v-list-item-title', `${THEME_LIGHT}`)
    cy.contains('.v-list-item-title', `${THEME_DARK}`)
    cy.contains('.v-list-item-title', `${THEME_AUTO}`)
    cy.getCy('settings-theme').click()
  })
})
