/// <reference types="cypress" />

import { CY } from '../../utils/common'

describe(`Test log, Env: ${CY.cfg}`, { tags: '@log', env: { visitBaseUrl: false } }, () => {
  it('Verify log page', () => {
    cy.visit('/settings')
    cy.visitSubpage('log-settings', 'log', 'Logy')
    cy.getCy('filter-value').first().click()
    cy.contains('.v-list-item', 'coreDam').click()
    cy.contains('.v-list-item', 'adminDam').click()
    cy.getCyVisibleClick('filter-submit')
    cy.get('.v-tabs').should('be.visible')
    cy.get('.v-table').should('be.visible')
    cy.getCyVisibleClick('filter-reset')
    cy.get('.v-tabs').should('not.exist')
    cy.get('.v-table').should('not.exist')
  })
})
