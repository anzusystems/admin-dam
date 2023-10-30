/// <reference types="cypress" />

import { CY } from '../../utils/common'
import { IMAGE_TYPES } from '../../utils/upload'
const FILE_ID: Array<string> = []
const main_licence = '100000'
const cms32630_licence = '200010'
const slonik_licence= '100003'
const pixel_licence = '100005'
describe(`Test asset image licence duplicate function, Env: ${CY.cfg}`,
  { tags: '@assetImageLicence', env: { visitBaseUrl: false } }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('image/sample.png', 0)
      cy.prepareData('image/sample.gif', 0)
      cy.prepareData('image/sample.jpeg', 0)
      cy.prepareData('image/sample.webp', 0)
    })
    it('Cms-sys | CMS licence', () => {
      cy.visit('/asset')
      cy.api_waitPageLoad('main', main_licence)

      let idx = 0
      IMAGE_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('image', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('CMS-sys | cms32630',()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', main_licence)
      cy.changeLicence(cms32630_licence)

      let idx = 0
      IMAGE_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('image', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('Blog-sys | Slonik:PHPckar',()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', cms32630_licence)
      cy.changeLicence(slonik_licence)

      let idx = 0
      IMAGE_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('image', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('Blog-sys | Pixel',()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', slonik_licence)
      cy.changeLicence(pixel_licence)

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
      cy.visit('/asset')
      cy.api_waitPageLoad('main', slonik_licence)
      cy.changeLicence(main_licence)
    })
  })
