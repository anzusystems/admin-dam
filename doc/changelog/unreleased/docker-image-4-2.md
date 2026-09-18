planned
===

### Changed

- **The local docker image is `anzusystems/node:4.2.0-node24-nginx-browsers`**, up from `4.1.0`.
  It is the base everything is built and the e2e browsers are run on, so the first
  `bin/docker-compose build` after pulling this will fetch a new layer set.
