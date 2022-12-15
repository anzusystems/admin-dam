/// <reference types="cypress" />

import { USER_FIRST_NAME } from './support/constants'

describe(`Test distribution category function, Env: ${Cypress.env('env')}`, () => {
  it('Create distribution category', () => {
    cy.visit('/settings')
    cy.verifySubPage('distribution-category-settings', 'distribution-category/list', 'List of Distribution category')
    cy.getCyVisibleClick('button-create')
    cy.getCy('create-panel').should('be.visible')
    cy.getCy('category-name').type(`${USER_FIRST_NAME}`)
    cy.getCy('distribution-category-select').eq(0).click()
    cy.contains('.v-list-item-title', /^Dokumenty$/).click()
    cy.getCy('distribution-category-select').eq(1).click()
    cy.contains('.v-list-item-title', /^Sports$/).click()
    cy.getCy('distribution-category-select').eq(2).click()
    cy.contains('.v-list-item-title', /^Comedy$/).click()
    cy.getCy('button-close').should('be.visible')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCyVisibleClick('button-confirm')
    cy.alertMessage('Record was created')
    cy.wait(1000)
    cy.getCy('copy_text')
      .invoke('text')
      .then((text) => {
        cy.urlContains(text)
        cy.getCyVisibleClick('button-close')
        cy.urlNotContains(text)
        cy.urlContains('/asset-licence/list')
      })
  })
  it('Edit distribution category', () => {
    cy.visit('distribution-category/list')
    cy.getCy('filter-text').last().type(`${USER_FIRST_NAME}{ENTER}`)
    cy.wait(500)
    cy.getCyVisibleClick('table-edit')
    cy.urlContains('/edit')
    cy.getCy('category-name').find('input').clear().type(`${USER_FIRST_NAME}-edit`)
    cy.getCy('distribution-category-select').eq(0).click()
    cy.contains('.v-list-item-title', /^Spravodajstvo$/).click()
    cy.getCy('distribution-category-select').eq(1).click()
    cy.contains('.v-list-item-title', /^Science$/).click()
    cy.getCy('distribution-category-select').eq(2).click()
    cy.contains('.v-list-item-title', /^Drama$/).click()
    cy.getCyVisibleClick('button-save-close')
    cy.alertMessage('Record was updated')
    cy.urlNotContains('/edit')
    cy.getCyVisibleClick('filter-reset')
    cy.getCy('filter-text').type(`${USER_FIRST_NAME}-edit{ENTER}`)
    cy.wait(500)
    cy.contains('td', `${USER_FIRST_NAME}-edit`)
    cy.getCyVisibleClick('filter-reset')
  })
})
