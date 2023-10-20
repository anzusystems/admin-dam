/// <reference types="cypress" />

import { CY } from '../../utils/common'
import { IMAGE_TYPES } from '../../utils/upload'
let idLicence = ''
let FILE_ID: Array<string> = []

describe(`Test asset image licence duplicate function, Env: ${CY.cfg}`,
  { tags: '@assetImageLicence', env: { visitBaseUrl: false } }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('image/sample.png', 0)
      cy.prepareData('image/sample.gif', 0)
      cy.prepareData('image/sample.jpeg', 0)
      cy.prepareData('image/sample.webp', 0)
    })
    it('Cms-sys | CMS licence', () => {
      cy.visit(`/asset`)
      cy.api_waitPageLoad('licence-unknown')
      idLicence = '100000'
      cy.getCy('button-manage-licence', 6000).should('be.visible')
        .invoke('text')
        .then((text)=>{
          const actualLicence = text.trim()
          if (actualLicence !== 'CMS licence'){
            cy.changeLicence('main', idLicence)
          }
        })
      let idx = 0
      IMAGE_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('image', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('CMS-sys | cms32630',()=>{
      cy.visit(`/asset`)
      cy.api_waitPageLoad('main', idLicence)
      idLicence = '200010'  // cms32630
      cy.changeLicence(idLicence)
      let idx = 0
      IMAGE_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('image', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('Blog-sys | Slonik:PHPckar',()=>{
      cy.visit(`/asset`)
      cy.api_waitPageLoad('main', idLicence)
      idLicence = '100003'  // Slonik: PHPckar
      cy.changeLicence(idLicence)
      let idx = 0
      IMAGE_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('image', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('Blog-sys | Pixel',()=>{
      cy.visit(`/asset`)
      cy.api_waitPageLoad('main', idLicence)
      idLicence = '100005'  // Pixel
      cy.changeLicence(idLicence)
      let idx = 0
      IMAGE_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('image', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('Delete uploaded images', ()=>{
      cy.deleteFile(FILE_ID)
    })
    it('Back to main cms licence', ()=>{
      cy.visit(`/asset`)
      cy.api_waitPageLoad('main', idLicence)
      idLicence = '100000'
      cy.changeLicence(idLicence)
    })
  })
