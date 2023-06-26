/// <reference types="cypress" />

import { ALERT_CREATE, ALERT_UPDATE, CY, USER_FIRST_NAME } from '../../utils/common'
let KEYWORD_ID = ''
describe(`Test keyword function, Env: ${CY.cfg}`, { tags: '@keyword', env: { visitBaseUrl: false } }, () => {
  it('Create keyword', () => {
    cy.visit('/settings')
    cy.visitSubpage('keyword-settings', 'keyword', 'Kľúčové slová')
    cy.getCyVisibleClick('button-create')
    cy.getCy('create-panel').should('be.visible')
    cy.getCy('keyword-name').type(`${USER_FIRST_NAME}`)
    cy.getCy('button-close').should('be.visible')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCyVisibleClick('button-confirm')
    cy.alertMessage(ALERT_CREATE)
    cy.getCy('filter-submit').click() // until bug is fixed
    cy.contains(`${USER_FIRST_NAME}`).click() // until bug is fixed
    cy.cardLoad()
    cy.getCy('copy-text')
      .invoke('text')
      .then((text) => {
        cy.urlContains(text)
        cy.getCyVisibleClick('button-close')
        cy.urlNotContains(text)
        cy.urlContains('/keyword')
        KEYWORD_ID = text
      })
  })
  it('Edit keyword', () => {
    cy.visit('keyword')
    cy.getCy('filter-string').first().type(`${KEYWORD_ID}{ENTER}`)
    cy.cardLoad()
    cy.getCyVisibleClick('table-edit')
    cy.urlContains('/edit')
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('keyword-name').find('input').clear().type(`${USER_FIRST_NAME}-edit`)
    cy.getCyVisibleClick('keyword-flags-reviewed')
    cy.getCyVisibleClick('button-save')
    cy.alertMessage(ALERT_UPDATE)
    cy.getCyVisibleClick('button-close')
    cy.urlNotContains('/edit')
    cy.getCyVisibleClick('filter-reset')
    cy.getCy('filter-string').last().type(`${USER_FIRST_NAME}-edit{ENTER}`)
    cy.cardLoad()
    cy.contains('td', `${USER_FIRST_NAME}-edit`)
    cy.getCyVisibleClick('filter-reset')
  })
})
