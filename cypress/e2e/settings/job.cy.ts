/// <reference types="cypress" />

import { ALERT_CREATE, CY, JOB_DELETE, JOB_SYNC, TEST_USER_ID } from '../../utils/common'

describe(`Test job, Env: ${CY.cfg}`, { env: { visitBaseUrl: false } }, () => {
  it('Verify log page', () => {
    cy.visit('/settings')
    cy.visitSubpage('job-settings', 'job', 'Systémové úlohy')
    cy.getCyVisibleClick('button-create')
    cy.getCyVisibleClick('job-select')
    cy.contains('.v-list-item', JOB_SYNC)
    cy.contains('.v-list-item', JOB_DELETE).click()
    cy.getCy('targetUser').type(TEST_USER_ID)
    cy.getCy('anonymizeUser')
    cy.get('.v-card-actions > .bg-primary').click()
    cy.alertMessage(ALERT_CREATE)
    cy.getCyVisibleClick('filter-reset')
    cy.cardLoad()
    cy.contains('td', JOB_DELETE).click()
    cy.cardLoad()
    cy.get(':nth-child(2) > :nth-child(1) > .v-col').should('contain', TEST_USER_ID)
    cy.getCyVisibleClick('button-close')
    cy.cardLoad()
    cy.get('.v-table').should('be.visible')

    // cy.contains('.v-list-item', 'adminDam').click()
    // cy.getCyVisibleClick('filter-submit')
    // cy.cardLoad()
    // cy.get('.v-tabs').should('be.visible')
    // cy.get('.v-table').should('be.visible')
    // cy.getCyVisibleClick('filter-reset')
    // cy.cardLoad()
    // cy.get('.v-tabs').should('not.exist')
    // cy.get('.v-table').should('not.exist')
  })
})
