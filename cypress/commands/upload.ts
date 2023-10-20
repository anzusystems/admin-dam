/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      uploadFile(fileName: string, action: 'select' | 'drag-drop', timeout?: number): Chainable<any>

      waitForUpload(alertUpload: string, timeout?: number): Chainable<any>
      verifyFileType(fileID: string, fileGroup: 'image' | 'audio' | 'video', fileType: string): Chainable<any>

      deleteFile(fileID: Array<string>): Chainable<any>
    }
  }
}

Cypress.Commands.add('deleteFile', (fileID: Array<string>) => {
  fileID.forEach((id) => {
    cy.api_deleteFile(id).then((response) => {
      expect(response.status).to.eq(204)
    })
  })
})
Cypress.Commands.add('verifyFileType',
  (fileID: string, fileGroup: 'image' | 'audio' | 'video' | 'document', fileType: string) => {
  const getFileType = (fileType: string): string => {
    if (fileType.includes('mp3')) return 'mpeg'
    else if (fileType.includes('mov')) return 'quicktime'
    else if (fileType.includes('wav')) return 'x-wav'
    else if (fileType.includes('doc')) return 'msword'
    else if (fileType.includes('xls')) return 'vnd.ms-excel'
    else return fileType
  }

  cy.api_getFileType(fileID).then((type) => expect(type).to.contain(fileGroup).and.to.contain(getFileType(fileType)))
})
Cypress.Commands.add('waitForUpload', (alertUpload: string, timeout?: number) => {
  cy.contains('[data-cy="upload-overlay-title"]', alertUpload, { timeout: timeout | 90000 })
})
Cypress.Commands.add('uploadFile', (fileName: string, action: 'select' | 'drag-drop', timeout?: number) => {
  cy.get('input[type="file"]', { timeout: timeout | 10000 })
    .first()
    .selectFile(
      {
        contents: `cypress/fixtures/${fileName}`,
        mimeType: fileName.includes('wav') ? 'audio/wav' : undefined,
      },
      {
        waitForAnimations: true,
        force: true,
        action: action,
      }
    )
})

export {}
