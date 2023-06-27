/// <reference types="cypress" />

import { ALERT_CREATE, ALERT_UPDATE, CY, RAND_NUM, USER_EMAIL } from '../../utils/common'
let USER_ID = ''
describe(
  `Test permission user function, Env: ${CY.cfg}`,
  { tags: '@userPermission', env: { visitBaseUrl: false } },
  () => {
    it('Create user', () => {
      cy.visit('/settings')
      cy.visitSubpage('user-permissions', '-user', 'Oprávnenia používateľov')
      cy.getCyVisibleClick('button-create')
      cy.getCy('create-panel').should('be.visible')
      cy.getCy('user-id').type(RAND_NUM)
      cy.getCy('user-email').type(USER_EMAIL)
      cy.getCyVisibleClick('user-roles')
      cy.contains('.v-list-item', 'Super Administrátor').click()
      cy.getCy('create-panel').click('top')
      cy.getCy('user-permissionGroups').type('DAM Basic')
      cy.contains('.v-list-item', 'DAM Basic').click()
      cy.getCy('create-panel').click('top')
      cy.getCy('button-close').should('be.visible')
      cy.getCy('button-cancel').should('be.visible')
      cy.getCyVisibleClick('button-confirm')
      cy.alertMessage(ALERT_CREATE)
      cy.getCy('filter-submit').click() // until bug is fixed
      cy.contains(`${USER_EMAIL}`).click() // until bug is fixed
      cy.cardLoad()
      cy.getCy('copy-text')
        .invoke('text')
        .then((text) => {
          cy.urlContains(text)
          cy.getCyVisibleClick('button-close')
          cy.urlNotContains(`/${text}`)
          cy.urlContains('-user')
          USER_ID = text
        })
    })
    it('Edit user', () => {
      cy.visit('/anzu-user')
      cy.getCy('filter-string', 10000).first().type(`${USER_ID}{ENTER}`)
      cy.cardLoad()
      cy.getCyVisibleClick('table-edit')
      cy.urlContains('/edit')
      cy.cardLoad()
      cy.getCy('user-first-name').type('test')
      cy.getCy('user-last-name').type('test')
      cy.getCy('enable-switch').click()
      cy.getCyVisibleClick('button-save')
      cy.alertMessage(ALERT_UPDATE)
      cy.getCyVisibleClick('button-close')
      cy.urlNotContains('/edit')
      cy.cardLoad()
      cy.get('.v-data-table__tr > :nth-child(2)').should('have.text', 'áno')
      cy.getCyVisibleClick('filter-reset')
    })
    it('Disable user', () => {
      cy.visit('/anzu-user')
      cy.getCy('filter-string', 10000).last().type(`${USER_EMAIL}{ENTER}`)
      cy.getCyVisibleClick('table-edit')
      cy.urlContains('/edit')
      cy.cardLoad()
      cy.getCy('enable-switch').click()
      cy.getCyVisibleClick('button-save')
      cy.alertMessage(ALERT_UPDATE)
      cy.getCyVisibleClick('button-close')
      cy.urlNotContains('/edit')
      cy.cardLoad()
      cy.get('.v-data-table__tr > :nth-child(2)').should('have.text', 'nie')
      cy.getCyVisibleClick('filter-reset')
    })
  }
)
