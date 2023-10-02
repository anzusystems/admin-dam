/// <reference types="cypress" />

import { ALERT_CREATE, ALERT_UPDATE, CY, RAND_NUM, USER_FIRST_NAME } from '../../utils/common'
let USER_ID = ''
describe(`Test authors function, Env: ${CY.cfg}`, { tags: '@author', env: { visitBaseUrl: false } }, () => {
  it('Create author', () => {
    cy.visit('/settings')
    cy.visitSubpage('author-settings', 'author', 'Autori')
    cy.getCyVisibleClick('button-create')
    cy.getCy('create-panel').should('be.visible')
    cy.getCy('author-name').type(`${USER_FIRST_NAME}`)
    cy.getCy('author-identifier').type(`${RAND_NUM}`)
    cy.getCy('author-type').click()
    cy.contains('.v-list-item-title', /^Interný$/).click()
    cy.getCy('button-close').should('be.visible')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCyVisibleClick('button-confirm')
    cy.alertMessage(ALERT_CREATE)
    cy.getCy('filter-string').eq(1).type(`${USER_FIRST_NAME}{ENTER}`)
    cy.contains(`${USER_FIRST_NAME}`).click()
    cy.cardLoad()
    cy.getCy('copy-text')
      .invoke('text')
      .then((text) => {
        cy.urlContains(text)
        cy.getCyVisibleClick('button-close')
        cy.urlNotContains(text)
        cy.urlContains('/author')
        USER_ID = text
      })
  })
  it('Edit author', () => {
    cy.visit('/author')
    cy.getCy('filter-string').first().type(`${USER_ID}{ENTER}`)
    cy.cardLoad()
    cy.getCyVisibleClick('table-edit')
    cy.urlContains('/edit')
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('author-name').find('input').clear().type(`${USER_FIRST_NAME}-edit`)
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('author-identifier').find('input').clear().type(`${RAND_NUM}-edit`)
    cy.getCy('author-flags-reviewed').click()
    cy.getCy('author-type').click()
    cy.contains('.v-list-item-title', /^Externý$/).click()
    cy.getCyVisibleClick('button-save')
    cy.alertMessage(ALERT_UPDATE)
    cy.getCyVisibleClick('button-close')
    cy.urlNotContains('/edit')
    cy.getCyVisibleClick('filter-reset')
    cy.getCy('filter-string').eq(1).type(`${RAND_NUM}-edit{ENTER}`)
    cy.cardLoad()
    cy.contains('td', `${USER_FIRST_NAME}-edit`)
    cy.getCyVisibleClick('filter-reset')
  })
})
