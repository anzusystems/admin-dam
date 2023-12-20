/// <reference types="cypress" />

import { ALERT_CREATE, ALERT_UPDATE, CY, PERMISSION_GROUP } from '../../utils/common'
let GROUP_ID = ''
describe(
  `Test permission groups function, Env: ${CY.cfg}`,
  { tags: '@groupPermission', env: { visitBaseUrl: false } },
  () => {
    it('Create permission group', () => {
      cy.visit('/settings')
      cy.visitSubpage('permission-group-settings', 'permission-group', 'Skupiny oprávnení')
      cy.getCyVisibleClick('button-create')
      cy.getCy('create-panel').should('be.visible')
      cy.getCy('permissionGroup-title').type(PERMISSION_GROUP)
      cy.getCy('permissionGroup-description').type(Cypress._.repeat(PERMISSION_GROUP, 3))
      cy.getCy('button-close').should('be.visible')
      cy.getCy('button-cancel').should('be.visible')
      cy.getCyVisibleClick('button-confirm')
      cy.alertMessage(ALERT_CREATE)
      cy.contains(`${PERMISSION_GROUP}`).click()
      cy.cardLoad()
      cy.getCy('copy-text', 12000)
        .invoke('text')
        .then((text) => {
          cy.urlContains(text)
          cy.getCyVisibleClick('button-close')
          cy.urlNotContains(`/${text}`)
          cy.urlContains('/permission-group')
          GROUP_ID = text
        })
    })
    it('Edit permission group', () => {
      cy.visit('/permission-group')
      cy.getCy('filter-string', 10000).first().type(`${GROUP_ID}{ENTER}`)
      cy.cardLoad()
      cy.getCyVisibleClick('table-edit')
      cy.urlContains('/edit')
      cy.getCy('permissionGroup-title').find('input').clear().type(`${PERMISSION_GROUP}-edit`)
      cy.getCy('permissionGroup-description')
        .find('input')
        .clear()
        .type(`${Cypress._.repeat(PERMISSION_GROUP, 3)}-edit`)
      cy.getCyVisibleClick('button-save')
      cy.alertMessage(ALERT_UPDATE)
      cy.getCyVisibleClick('button-close')
      cy.urlNotContains('/edit')
      cy.getCyVisibleClick('filter-reset')
      cy.getCy('filter-string').last().type(`${PERMISSION_GROUP}-edit{ENTER}`)
      cy.cardLoad()
      cy.contains('td', `${PERMISSION_GROUP}-edit`)
      cy.getCyVisibleClick('filter-reset')
    })
  }
)
