/// <reference types="cypress" />

import { CY } from '../../utils/common'

describe(`Test log, Env: ${CY.cfg}`, { tags: ['@log', '@settings'], expose: { visitBaseUrl: false } }, () => {
  it('Verify log page', () => {
    cy.visit('/settings')
    // The system is a route segment now, not a filter, so there is no multiselect to open and no
    // tab strip to appear -- the table is there on arrival and a reset no longer empties it.
    cy.visitSubpage('log-settings', 'logs/dam/app', 'Logy')
    cy.get('.v-table').should('be.visible')
    cy.getCyVisibleClick('filter-submit')
    cy.get('.v-table').should('be.visible')
    cy.getCyVisibleClick('filter-reset')
    cy.get('.v-table').should('be.visible')
  })
})
