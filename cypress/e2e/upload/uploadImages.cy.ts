/// <reference types="cypress" />

import { IMAGE_TYPES, UPLOAD_TYPES } from '../../utils/upload'
import { ALERT_UPLOAD, CY } from '../../utils/common'
const FILE_ID: Array<string> = []
describe(`Test upload of various images, Env: ${CY.cfg}`,
  { tags: ['@imageUpload', '@upload'] }, () => {
  IMAGE_TYPES.forEach((fileType) => {
    UPLOAD_TYPES.forEach((uploadType) => {
      it(`Image: Upload ${fileType.toUpperCase()} - ${uploadType.toUpperCase()}`, () => {
        cy.prepareData(`image/sample.${fileType}`,false)
        cy.uploadFile(`image/sample.${fileType}`, uploadType, 20000)
        cy.api_getFileID().then((responseID) => {
          FILE_ID.push(responseID)
          cy.waitForUpload(ALERT_UPLOAD, 20000)
          cy.verifyFileType(responseID, 'image', fileType)
        })
      })
    })
  })
  it('Image: Delete', { env: { visitBaseUrl: false } }, () => {
    cy.deleteFile(FILE_ID)
  })
})
