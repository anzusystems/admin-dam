/// <reference types="cypress" />

import { ALERT_UPDATE, CY, RAND_NUM } from '../../utils/common'
let CATEGORY_ID = ''
describe(
  `Test distribution category select function, Env: ${CY.cfg}`,
  { tags: ['@distributionCategorySelect', '@settings'], env: { visitBaseUrl: false } },
  () => {
    it('Create distribution category select', () => {
      cy.visit('/settings')
      cy.visitSubpage(
        'distribution-category-select-settings',
        'distribution-category-select',
        'Výbery v distribučných kategóriách'
      )
      cy.get('.v-data-table__tr').first().click()
      cy.cardLoad()
      cy.waitSec(1)
      cy.getCy('copy-text')
        .invoke('text')
        .then((text) => {
          cy.urlContains(text)
          CATEGORY_ID = text
          console.log(CATEGORY_ID)
        })
      cy.getCyVisibleClick('button-edit')
      cy.getCyVisibleClick('button-add-option')
      cy.getCy('option-name').last().type(`Name+${RAND_NUM}`)
      cy.getCy('option-assignable').last().click()
      cy.getCy('option-id').last().type(RAND_NUM)
      cy.getCy('button-close').should('be.visible')
      cy.getCyVisibleClick('button-save')
      cy.alertMessage(ALERT_UPDATE)
    })
    it('Delete distribution category select', () => {
      cy.visit(`/distribution-category-select/${CATEGORY_ID}`)
      cy.get('.v-list-item-title').contains(`Name+${RAND_NUM}`)
      cy.get('.v-list-item-subtitle').contains(RAND_NUM)
      cy.getCyVisibleClick('button-edit')
      cy.waitSec(2)
      cy.get('body').then(($body)=>{
        if($body.find('.mdi-drag').length < 2){
          cy.getCyVisibleClick('button-add-option')
          cy.getCy('option-name').last().type('E2E-Name')
          cy.getCy('option-assignable').last().click()
          cy.getCy('option-id').last().type('123')
          cy.get('.mdi-trash-can-outline').first().click()
        } else {
          cy.get('.mdi-trash-can-outline').last().click()
        }
      })
      cy.getCyVisibleClick('button-save')
      cy.alertMessage(ALERT_UPDATE)
    })
  }
)
