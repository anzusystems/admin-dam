/// <reference types="cypress" />

import { CY, RAND_NUM } from '../../utils/common'
describe(`Test artemis upload to DAM, Env: ${CY.cfg}`,
  { tags: ['@artemisUpload', '@upload'], env: { visitBaseUrl: false } },
  () => {
    it('Upload image in Artemis, verify adam', () => {
      cy.prepareData(`image/test-image.png`, false)
      cy.visit(`${CY.url.proto}://artemis.${CY.url.domain}/admin/dashboard`)
      cy.get('.navbar .fa-plus-circle').eq(0).click()
      cy.get('#select2-chosen-1').click()
      cy.get('.select2-result-label').contains('Svet').click()
      cy.get('.navbar .fa-plus-circle').eq(0).click()
      cy.get('#s2id_form_rubric').click()
      cy.get('.select2-result-label').contains('Svet').click()
      cy.get('.navbar .fa-plus-circle').eq(0).click()
      cy.get('#create-article-button-top').click()
      cy.waitSec(3)
      cy.get('.cke_toolgroup .cke_button__gallerybox').click()
      cy.get('.cke_dialog_ui_button').contains('Vložiť obrázok').click()
      cy.waitSec(1)
      cy.get('.cke_dialog_ui_iframe').eq(2).then($iframe => {
        const body = $iframe.contents().find('body')
        console.log(body)
        cy.wrap(body).find('.cke_dialog_ui_button').contains('Pridať obrázok').click()
        cy.wrap(body).find('input[type="file"]')
          .selectFile('cypress/fixtures/image/test-image.png', { force: true })
        cy.wrap(body).find('.step1 .info').contains('krok 1').should('be.visible')
        cy.waitSec(2)
        cy.get('.cke_dialog_ui_button_ok[title="Pokračovať v editácii"]')
          .should('have.css', 'display', 'block').click()
        cy.wrap(body).find('.step2 .info').contains('krok 2').should('be.visible')
        cy.waitSec(1)
        cy.get('.cke_dialog_ui_button_ok[title="Pokračovať v editácii"]')
          .should('have.css', 'display', 'block').click()
        cy.waitSec(1)
        cy.wrap(body).find('#stepInfo_description').type(`Description-${RAND_NUM}`)
        cy.wrap(body).find('#stepInfo_author').type('Unsplash')
        cy.wrap(body).find('#stepInfo_keywords').type('Aupark')
        cy.get('.cke_dialog_ui_button_ok[title="Pokračovať v editácii"]')
          .should('have.css', 'display', 'block').click()
      })

      cy.waitSec(5)

      cy.visit(`${CY.url.proto}://admin-dam.${CY.url.domain}/asset`)
      cy.get("[data-cy='button-image-types']").click()
      cy.get('.asset-image').eq(0).click()
      cy.get('[data-cy="custom-field-description"] textarea[rows]')
        .invoke('val').then((assetDescription)=>{
        cy.wrap(assetDescription).should('contain', `Description-${RAND_NUM}`)
        cy.get('.v-expansion-panel-text .v-chip__content').eq(0).contains('Aupark')
        cy.get('.v-expansion-panel-text .v-chip__content').eq(1).contains('Unsplash')
        cy.get('.v-btn').contains('Upraviť').click()
        cy.get("[data-cy='button-delete']").click()
        cy.get("[data-cy='button-confirm-delete']").click()
        cy.get('.v-alert').should('be.visible').and('contain.text', 'Záznam bol odstránený')
      })
    })
  }
)
