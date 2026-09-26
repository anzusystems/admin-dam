AnzuSystems Admin-DAM by Petit Press a.s. (www.sme.sk), in partnership with Google.
=====

## Introduction

**Open Source Digital Asset Management (DAM) platform, which creates a centralized system for publishers to upload, store and access media assets such as images, videos, audio files and documents. The project was developed in partnership with Google.**

-----

The software development team in Petit Press a.s. has developed a cloud based DAM platform with the power to organize rich-media digital assets in one central location. Journalists can use an easy web upload tool that enables reporters to send in multimedia files from the field. The application has been created for a cloud platform. The client/publisher can connect DAM with its own user management system and CMS. DAM application is API based software for easy integration with any CMS system. The system is ready to set up access roles for digital assets to ensure security for sensitive assets for all modules.  

## Getting started
- [Local development](README-DEV.md)

- [E2E testing](e2e/README.md)

- [Changelog](CHANGELOG.md) — releases follow [Semantic Versioning](https://semver.org)

## Releasing

Releases are made with [release-tools](https://github.com/anzusystems/release-tools) ([guide](https://github.com/anzusystems/release-tools/blob/main/docs/guide.md)), never by hand in GitHub:

- `yarn release:start` — starts a release (a branch and a folder of its own) or a hotfix of an older line.
- `yarn release:publish` — publishes a prerelease, a dev build or the final. The tag is created by the command, CI checks and builds it and creates the GitHub Release, and the final is merged into `main`.
- `yarn release:cleanup` — deletes old dev builds and tags that never became a release.
