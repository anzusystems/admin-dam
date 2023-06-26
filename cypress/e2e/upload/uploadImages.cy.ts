/// <reference types="cypress" />

import { IMAGE_TYPES, UPLOAD_TYPES } from '../../utils/upload'
import { CY } from '../../utils/common'
const FILE_ID: Array<string> = []
describe(`Test upload of various images, Env: ${CY.cfg}`, { tags: '@image' }, () => {
  IMAGE_TYPES.forEach((fileType) => {
    UPLOAD_TYPES.forEach((uploadType) => {
      it(`Image: Upload ${fileType.toUpperCase()} - ${uploadType.toUpperCase()}`, () => {
        cy.uploadFile(`image/sample.${fileType}`, uploadType)
        cy.api_getFileID().then((responseID) => {
          FILE_ID.push(responseID)
          cy.waitForUpload(10)
          cy.verifyFileType(responseID, 'image', fileType)
        })
      })
    })
  })
  it('Image: Delete', { env: { visitBaseUrl: false } }, () => {
    cy.deleteFile(FILE_ID)
  })
})
