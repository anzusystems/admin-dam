import { CY } from '../../utils/common'
const assetIDs: Array<string> = []
const EXPECTED_TITLE = "happy mother's day!"
const EXPECTED_DESCRIPTION = 'child son congratulates mother on holiday and gives flowers'
const EXPECTED_KEYWORDS = ['happy', 'son', 'kid']
const EXPECTED_AUTHOR = 'test author '

describe(
  `Test add audio asset to podcast episode function, Env: ${CY.cfg}`,
  { tags: ['@assetExifAutofill', '@assets'] },
  () => {
    it('Prepare Test Data', () => {
      cy.prepareData('image/sampleMeta1.jpg', true, assetIDs)
    })
    it('Check image on Title-Description-Keywords-Artists', () => {
      cy.visit(`/assets/${assetIDs[0]}`)
      cy.api_waitPageLoad('asset-edit')
      cy.get('[data-cy="custom-field-title"] textarea').should('have.value', EXPECTED_TITLE)
      cy.get('[data-cy="custom-field-description"] textarea').should('have.value', EXPECTED_DESCRIPTION)
      cy.getCy('custom-field-keywords').click()
      // `.should()`, not `.then()`: the overlay list is still populating when the command runs,
      // and only `.should()` retries. The assertion this replaced never executed, so there is no
      // history saying a single pass would be enough.
      cy.get('.v-overlay__content > .v-list > .v-list-item')
        .invoke('text')
        .should((text) => {
          EXPECTED_KEYWORDS.forEach((keyword) => expect(text.trim()).to.contain(keyword))
        })
      cy.get('body').type('{esc}')
      cy.getCy('custom-field-authors').click()
      cy.get('.v-overlay__content > .v-list > .v-list-item').invoke('text').should('eq', EXPECTED_AUTHOR)
    })
    it('Delete Test data', () => {
      cy.deleteFile(assetIDs)
    })
    it('Prepare Test Data', () => {
      cy.prepareData('image/sampleMeta2.jpg', true, assetIDs)
    })
    it('Check image on Subject-ImageDescription-Subjects-Owners', () => {
      cy.visit(`/assets/${assetIDs[1]}`)
      cy.api_waitPageLoad('asset-edit')
      cy.get('[data-cy="custom-field-title"] textarea').should('have.value', EXPECTED_TITLE)
      cy.get('[data-cy="custom-field-description"] textarea').should('have.value', EXPECTED_DESCRIPTION)
      cy.getCy('custom-field-keywords').click()
      cy.get('.v-overlay__content > .v-list > .v-list-item').invoke('text').should('eq', 'Zadajte minimálne 2 znaky')
      cy.get('body').type('{esc}')
      cy.getCy('custom-field-authors').click()
    })
    it('Delete Test data', () => {
      cy.deleteFile([assetIDs[1]])
    })
  }
)
