import { CY } from '../../utils/common'
const assetIDs: Array<string> = []
const EXPECTED_TITLE = 'happy mother\'s day!'
const EXPECTED_DESCRIPTION = 'child son congratulates mother on holiday and gives flowers'
const EXPECTED_KEYWORDS = 'happy son kid '
const EXPECTED_AUTHOR = 'test author '

describe(`Test add audio asset to podcast episode function, Env: ${CY.cfg}`,
  { tags: ['@assetExifAutofill', '@assets'] }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('image/sampleMeta1.jpg', true, assetIDs)
    })
    it('Check image on Title-Description-Keywords-Artists', () => {
      cy.visit(`/asset/${assetIDs}`)
      cy.api_waitPageLoad('asset-edit')
      cy.get('[data-cy="custom-field-title"] textarea')
        .should('have.value', EXPECTED_TITLE)
      cy.get('[data-cy="custom-field-description"] textarea')
        .should('have.value', EXPECTED_DESCRIPTION)
      cy.getCy('custom-field-keywords').click()
      cy.get('.v-overlay__content > .v-list > .v-list-item')
        .invoke('text').should('eq', EXPECTED_KEYWORDS)
      cy.get('body').type('{esc}')
      cy.getCy('custom-field-authors').click()
      cy.get('.v-overlay__content > .v-list > .v-list-item')
        .invoke('text').should('eq', EXPECTED_AUTHOR)
    })
    it('Delete Test data', ()=>{
      cy.deleteFile(assetIDs)
    })
    it('Prepare Test Data', ()=> {
      cy.prepareData('image/sampleMeta2.jpg', true, assetIDs)
    })
    it('Check image on Subject-ImageDescription-Subjects-Owners', () => {
      cy.visit(`/asset/${assetIDs[1]}`)
      cy.api_waitPageLoad('asset-edit')
      cy.get('[data-cy="custom-field-title"] textarea')
        .should('have.value', EXPECTED_TITLE)
      cy.get('[data-cy="custom-field-description"] textarea')
        .should('have.value', EXPECTED_DESCRIPTION)
      cy.getCy('custom-field-keywords').click()
      cy.get('.v-overlay__content > .v-list > .v-list-item')
        .invoke('text').should('eq', 'Žiadne dostupné dáta')
      cy.get('body').type('{esc}')
      cy.getCy('custom-field-authors').click()
      cy.get('.v-overlay__content > .v-list > .v-list-item')
        .invoke('text').should('eq', EXPECTED_AUTHOR)
    })
    it('Delete Test data', ()=>{
      cy.deleteFile([assetIDs[1]])
    })
  })
