/// <reference types="cypress" />

import { CY } from '../../utils/common'
import { DOCUMENT_TYPES } from '../../utils/upload'
let idLicence = ''
const FILE_ID: Array<string> = []

describe(`Test asset document licence duplicate function, Env: ${CY.cfg}`,
  { tags: '@assetDocLicence', env: { visitBaseUrl: false } }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('document/sample.doc', 0)
      cy.prepareData('document/sample.pdf', 0)
      cy.prepareData('document/sample.txt', 0)
      cy.prepareData('document/sample.xls', 0)
    })
  it('Cms-sys | CMS licence', () => {
      cy.visit('/asset')
      cy.api_waitPageLoad('licence-unknown')
      idLicence = '100000'
      cy.getCy('button-manage-licence', 6000).should('be.visible')
        .invoke('text')
        .then((text)=>{
          const actualLicence = text.trim()
          if (actualLicence !== 'CMS licence'){
            cy.changeLicence(idLicence)
          }
        })
      let idx = 0
      DOCUMENT_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('document', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('CMS-sys | cms32630',()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', idLicence)
      idLicence = '200010'  // cms32630
      cy.changeLicence(idLicence)
      let idx = 0
      DOCUMENT_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('document', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('Delete uploaded audios', ()=>{
      cy.deleteFile(FILE_ID)
    })
    it('Back to main cms licence', ()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', idLicence)
      idLicence = '100000'
      cy.changeLicence(idLicence)
    })
  })
