/// <reference types="cypress" />

import {
  ALERT_CREATE,
  ALERT_UPDATE,
  CY, JOB_DELETE,
  JOB_SYNC,
  PERMISSION_GROUP,
  RAND_NUM,
  USER_EMAIL,
  USER_ROLE
} from '../../utils/common'
let USER_ID = ''
describe(
  `Test permission user function, Env: ${CY.cfg}`,
  { tags: ['@userPermission', '@settings'], env: { visitBaseUrl: false } },
  () => {
    it('Create user', () => {
      cy.visit('/settings')
      cy.visitSubpage('user-permissions', '-user', 'Oprávnenia používateľov')
      cy.getCyVisibleClick('button-create')
      cy.getCy('create-panel').should('be.visible')
      cy.getCy('user-id').type(RAND_NUM)
      cy.getCy('user-email').type(USER_EMAIL)
      cy.getCyVisibleClick('user-roles')
      cy.contains('.v-list-item', USER_ROLE).click()
      cy.getCy('create-panel').click('top')
      cy.getCy('user-permissionGroups').type(PERMISSION_GROUP)
      cy.contains('.v-list-item', PERMISSION_GROUP).click()
      cy.getCy('create-panel').click('top')
      cy.getCy('button-close').should('be.visible')
      cy.getCy('button-cancel').should('be.visible')
      cy.getCyVisibleClick('button-confirm')
      cy.alertMessage(ALERT_CREATE)
      cy.get('[value="50"]').click()
      cy.contains(`${USER_EMAIL}`).click()
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
      cy.get('.v-selection-control > .v-label').click()
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
      cy.get('.v-selection-control > .v-label').click()
      cy.getCyVisibleClick('button-save')
      cy.alertMessage(ALERT_UPDATE)
      cy.getCyVisibleClick('button-close')
      cy.urlNotContains('/edit')
      cy.cardLoad()
      cy.get('.v-data-table__tr > :nth-child(2)').should('have.text', 'nie')
      cy.getCyVisibleClick('filter-reset')
    })
    it('Delete User - system job', ()=>{
      cy.visit('/settings')
      cy.visitSubpage('job-settings', 'job', 'Systémové úlohy')
      cy.getCyVisibleClick('button-create')
      cy.getCyVisibleClick('job-select')
      cy.contains('.v-list-item', JOB_SYNC)
      cy.contains('.v-list-item', JOB_DELETE).click()
      cy.getCy('targetUser').type(RAND_NUM)
      cy.get('.v-input__control [id^=switch-]').click()
      cy.get('.v-card-actions > .bg-primary').click()
      cy.alertMessage(ALERT_CREATE)
      cy.getCyVisibleClick('filter-reset')
      cy.cardLoad()
      cy.contains('td', JOB_DELETE).click()
      cy.cardLoad()
      cy.get(':nth-child(2) > :nth-child(1) > .v-col').should('contain', RAND_NUM).click()
      cy.getCyVisibleClick('button-close')
    })
  }
)
