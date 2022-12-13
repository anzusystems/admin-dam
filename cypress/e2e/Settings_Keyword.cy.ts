/// <reference types="cypress" />

import { USER_FIRST_NAME } from './support/constants'

describe(`Test keyword function, Env: ${Cypress.env('domain')}`, () => {
  it('Create keyword', () => {
    cy.visit('/settings')
    cy.verifySubPage('keyword-settings', 'keyword/list', 'Keywords List')
    cy.getCyVisibleClick('button-create')
    cy.getCy('create-panel').should('be.visible')
    cy.getCy('keyword-name').type(`${USER_FIRST_NAME}`)
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
        cy.urlContains('/keyword/list')
      })
  })
  it('Edit keyword', () => {
    cy.visit('keyword/list')
    cy.getCy('filter-text').last().type(`${USER_FIRST_NAME}{ENTER}`)
    cy.wait(500)
    cy.getCyVisibleClick('table-edit')
    cy.urlContains('/edit')
    cy.getCy('keyword-name').find('input').clear().type(`${USER_FIRST_NAME}-edit`)
    cy.getCyVisibleClick('toggle-false')
    cy.getCyVisibleClick('button-save-close')
    cy.alertMessage('Record was updated')
    cy.urlNotContains('/edit')
    cy.getCyVisibleClick('filter-reset')
    cy.getCy('filter-text').last().type(`${USER_FIRST_NAME}-edit{ENTER}`)
    cy.wait(500)
    cy.contains('td', `${USER_FIRST_NAME}-edit`)
    cy.getCyVisibleClick('filter-reset')
  })
})
