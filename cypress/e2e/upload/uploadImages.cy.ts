/// <reference types="cypress" />

import { IMAGE_TYPES, UPLOAD_TYPES } from '../../utils/upload'
const fileID: Array<string> = []
describe(`Test upload of various images, Env: ${Cypress.env('cfg')}`, { tags: '@image' }, () => {
  IMAGE_TYPES.forEach((fileType) => {
    UPLOAD_TYPES.forEach((uploadType) => {
      it(`Image: Upload ${fileType.toUpperCase()} - ${uploadType.toUpperCase()}`, () => {
        cy.uploadFile(`image/sample.${fileType}`, uploadType)
        cy.api_getFileID().then((responseID) => {
          fileID.push(responseID)
          cy.waitForUpload(10)
          cy.verifyFileType(responseID, 'image', fileType)
        })
      })
    })
  })
  it('Image: Delete', { env: { visitBaseUrl: false } }, () => {
    cy.deleteFile(fileID)
  })
})
