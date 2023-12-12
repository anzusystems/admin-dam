/// <reference types="cypress" />

import { CY } from '../../utils/common'
import { IMAGE_TYPES } from '../../utils/upload'
const FILE_ID: Array<string> = []
const TESTED_LICENCE_IDS = {
  CMS_MAIN: 100000,
  BLOG1: 200250,
  BLOG2: 200251,
} as const

describe(`Test asset image licence duplicate function, Env: ${CY.cfg}`,
  { tags: ['@assetImageLicence', '@licence'], env: { visitBaseUrl: false } }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('image/sample.png', 0)
      cy.prepareData('image/sample.gif', 0)
      cy.prepareData('image/sample.jpeg', 0)
      cy.prepareData('image/sample.webp', 0)
    })
    it('CMS', () => {
      cy.visit('/asset')
      cy.api_waitPageLoad('main', TESTED_LICENCE_IDS.CMS_MAIN)

      let idx = 0
      IMAGE_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('image', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('Blog-system 1',()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', TESTED_LICENCE_IDS.CMS_MAIN)
      cy.changeLicence(TESTED_LICENCE_IDS.BLOG1)

      let idx = 0
      IMAGE_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('image', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('Blog-system 2',()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', TESTED_LICENCE_IDS.BLOG1)
      cy.changeLicence(TESTED_LICENCE_IDS.BLOG2)

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
    it('Back to main licence', ()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', TESTED_LICENCE_IDS.BLOG2)
      cy.changeLicence(TESTED_LICENCE_IDS.CMS_MAIN)
    })
  })
