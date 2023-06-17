/// <reference types="cypress" />

import { RAND_NUM, USER_FIRST_NAME } from './var/constants'

describe(`Test authors function, Env: ${Cypress.env('cfg')}`, () => {
  it('Create author', () => {
    cy.visit('/settings')
    cy.verifySubPage('author-settings', 'author/list', 'Authors List')
    cy.getCyVisibleClick('button-create')
    cy.getCy('create-panel').should('be.visible')
    cy.getCy('author-name').type(`${USER_FIRST_NAME}`)
    cy.getCy('author-identifier').type(`${RAND_NUM}`)
    cy.getCy('author-type').click()
    cy.contains('.v-list-item-title', /^Internal$/).click()
    cy.getCy('button-close').should('be.visible')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCyVisibleClick('button-confirm')
    cy.alertMessage('Record was created')
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000)
    cy.getCy('copy_text')
      .invoke('text')
      .then((text) => {
        cy.urlContains(text)
        cy.getCyVisibleClick('button-close')
        cy.urlNotContains(text)
        cy.urlContains('/author/list')
      })
  })
  it('Edit author', () => {
    cy.visit('author/list')
    cy.getCy('filter-text').eq(2).type(`${RAND_NUM}{ENTER}`)
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500)
    cy.getCyVisibleClick('table-edit')
    cy.urlContains('/edit')
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('author-name').find('input').clear().type(`${USER_FIRST_NAME}-edit`)
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('author-identifier').find('input').clear().type(`${RAND_NUM}-edit`)
    cy.getCy('toggle-false').click()
    cy.getCy('author-type').click()
    cy.contains('.v-list-item-title', /^External$/).click()
    cy.getCyVisibleClick('button-save-close')
    cy.alertMessage('Record was updated')
    cy.urlNotContains('/edit')
    cy.getCyVisibleClick('filter-reset')
    cy.getCy('filter-text').eq(2).type(`${RAND_NUM}-edit{ENTER}`)
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500)
    cy.contains('td', `${USER_FIRST_NAME}-edit`)
    cy.getCyVisibleClick('filter-reset')
  })
})
