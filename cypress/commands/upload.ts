/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      uploadFile(fileName: string, action: 'select' | 'drag-drop'): Chainable<any>

      waitForUpload(seconds?: number): Chainable<any>
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
Cypress.Commands.add('verifyFileType', (fileID: string, fileGroup: 'image' | 'audio' | 'video', fileType: string) => {
  if (fileType.includes('mp3')) {
    fileType = 'mpeg'
  } else if (fileType.includes('mov')) {
    fileType = 'quicktime'
  } else if (fileType.includes('avi')) {
    fileType = 'x-msvideo'
  }
  cy.api_getFileType(fileID).then((type) => expect(type).to.contain(fileGroup).and.to.contain(fileType))
})
Cypress.Commands.add('waitForUpload', (seconds?: number) => {
  cy.contains('.text-caption', 'Upload done', { timeout: seconds * 1000 })
})
Cypress.Commands.add('uploadFile', (fileName: string, action: 'select' | 'drag-drop') => {
  cy.get('input[type="file"]')
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
