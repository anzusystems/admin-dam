/// <reference types="cypress" />

import { CY } from '../../utils/common'
let ASSET_ID: Array<string> = []

describe(`Test asset autofill exif data function, Env: ${CY.cfg}`, { tags: '@AssetExif', env: { visitBaseUrl: false } }, () => {
  it('Prepare Test Data', () => {
    cy.visit('/')
    cy.prepareData('audio/exifsample.png', 1, ASSET_ID)
    cy.prepareData('audio/sample2.mp3', 0)
  })
})
