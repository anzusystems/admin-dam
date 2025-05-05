/// <reference types="cypress" />

import { CY } from '../../utils/common'

describe(`Layout Mode Switcher, Env: ${CY.cfg}`, { tags: ['@mode-toggle', '@display-modes'] }, () => {
  it('should display masonry layout in Tile mode', () => {
    cy.get('.mdi-view-compact').click();

    cy.get('.dam-image-grid')
      .should('exist')
      .should('have.class', 'dam-image-grid--masonry');
  });

  it('should display thumbnail grid layout in Grid mode', () => {
    cy.get('.mdi-view-grid').click();

    cy.get('.dam-image-grid')
      .should('exist')
      .should('have.class', 'dam-image-grid--thumbnail');
  });

  it('should display list layout in List mode', () => {
    cy.get('.mdi-view-headline').click();

    cy.get('.v-container').should('exist');
    cy.get('.v-table').should('exist');
    cy.get('.v-table__wrapper').should('exist');

    cy.get('tr.a-table__row').should('have.length.greaterThan', 0);
  });
});


