export const CY = Cypress.env('')
export const RAND_NUM = `${Cypress._.random(1000, 9999)}`
export const LENGUAGE_SK = 'Slovensky'
export const LENGUAGE_EN = 'English'
export const THEME_LIGHT = 'Light'
export const THEME_DARK = 'Dark'
export const THEME_AUTO = 'Auto'
export const USER_EMAIL = `test.mail+${RAND_NUM}@adam.com`
export const USER_FIRST_NAME = `First${RAND_NUM}`
export const USER_LAST_NAME = `Last${RAND_NUM}`
export const USER_PASSWORD = `pwd${RAND_NUM}`
export const USER_LICENCE = ['Novyny', 'Sme Family']
export const EXTERNAL_SYS = ['cms', 'blog', 'tools']
export const KEYWORDS = ['TestKeyword1', 'TestKeyword2']
export const AUTHORS = ['TestAuthor1', 'TestAuthor2', 'TestAuthor3']
export const EXTERNAL_PROVIDER = 'Unsplash'
export const DISTRIBUTION_SERVICE = ['Youtube', 'Youtube Fičí', 'JwVideo', 'Artemis Video CMS',
  'Artemis Podcast CMS']
export const PERMISSION_GROUP_TITLE = `TestGroup${RAND_NUM}`
export const PODCAST_TITLE = `TestPodcast${RAND_NUM}`
export const EPISODE_TITLE = `TestEpisode${RAND_NUM}`
export const ASSET_TITLE = `TestAssetTitle${RAND_NUM}`
export const VIDEO_SHOW_TITLE = `TestVideoShow${RAND_NUM}`
export const ASSET_DESCRIPTION = `TestDescription${RAND_NUM}`
export const PERMISSION_GROUP = `TestGroup${RAND_NUM}`
export const ALERT_CREATE = 'Záznam bol vytvorený.'
export const ALERT_UPDATE = 'Záznam bol upravený'
export const ALERT_UPLOAD = 'Nahrávanie ukončené'
export const JOB_DELETE = 'Výmaz používateľových dát'
export const JOB_SYNC = 'Podcastový synchronizátor'
export const USER_ROLE = 'Super Admin'
