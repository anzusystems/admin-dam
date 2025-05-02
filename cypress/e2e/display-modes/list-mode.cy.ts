/// <reference types="cypress" />

import { CY } from '../../utils/common'

describe(`List mode, Env: ${CY.cfg}`, () => {
  it('should copy ID to clipboard and show success label', () => {
    // Enable list mode
    cy.get('.mdi-view-headline').click();

    cy.get('tr.a-table__row').first().within(() => {
      // Click the second <td> inside the row
      cy.get('td').eq(2).click();
      // Click on copy button
      cy.get('.mdi-content-copy').first().click({force: true});

    });

    // Confirm that success message appears
    cy.get('.v-alert')
      .should('be.visible')
      .and('contain.text', 'ID bolo skopírované do schránky.');

    // Get the ID text to compare
    cy.get('.anzu-copy-text').find('span').first().should('exist').should('be.visible').invoke('text').then((expectedId) => {
      // Read from clipboard and compare
      cy.window().then((win) => {
        win.navigator.clipboard.readText().then((clipText) => {
          expect(clipText.trim()).to.eq(expectedId.trim());
        });
      });
    });

  });
});




