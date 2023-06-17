/// <reference types="cypress" />

import { EXTERNAL_SYS } from './var/constants'

describe(`Test ext system function, Env: ${Cypress.env('cfg')}`, () => {
  it('Edit ext system', () => {
    cy.visit('/settings')
    cy.verifySubPage('ext-system-settings', 'ext-system/list', 'List of External Systems')
    cy.getCy('filter-text').first().type(`${EXTERNAL_SYS[0]}{ENTER}`)
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500)
    cy.contains('td', `${EXTERNAL_SYS[0]}`).click()
    cy.getCy('copy_text')
      .invoke('text')
      .then((text) => {
        cy.urlContains(text)
      })
    cy.getCyVisibleClick('button-edit')
    cy.urlContains('/edit')
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('ext-system-name').find('input').clear().type('CMS system')
    cy.getCyVisibleClick('button-save-close')
    cy.alertMessage('Record was updated')
    cy.urlNotContains('/edit')
    cy.urlContains('ext-system/list')
    cy.getCyVisibleClick('filter-reset')
  })
})
