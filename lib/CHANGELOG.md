

## [3.0.6](https://github.com/oreillymedia/cypress-playback/compare/3.0.5...3.0.6) (2023-08-28)

## [3.0.5](https://github.com/oreillymedia/cypress-playback/compare/3.0.4...3.0.5) (2023-07-10)


### Bug Fixes

* **codeql:** Remove useless escape from test ([918e00d](https://github.com/oreillymedia/cypress-playback/commit/918e00d90599a07796b22903e9329b20b69893b1))

## [3.0.4](https://github.com/oreillymedia/cypress-playback/compare/3.0.3...3.0.4) (2023-05-01)

## [3.0.3](https://github.com/oreillymedia/cypress-playback/compare/3.0.2...3.0.3) (2023-02-13)

## [3.0.2](https://github.com/oreillymedia/cypress-playback/compare/3.0.1...3.0.2) (2023-01-05)


### Bug Fixes

* **deps:** Update sandbox tooling ([d484e2a](https://github.com/oreillymedia/cypress-playback/commit/d484e2a819eb836c3d849834cd3ed84a5da19554))

## [3.0.1](https://github.com/oreillymedia/cypress-playback/compare/3.0.0...3.0.1) (2022-09-28)

# [3.0.0](https://github.com/oreillymedia/cypress-playback/compare/2.2.2...3.0.0) (2022-08-12)


### Features

* Support Cypress 10 ([c2a4ece](https://github.com/oreillymedia/cypress-playback/commit/c2a4ecec3b39d6a3710192eebe1148c32000fb30))


### BREAKING CHANGES

* In Cypress 10, the 'integrationFolder' was removed from the
config. This value had been used to determine where to save and load the request
fixtures, so a new approach has been implemented and the plugin cannot find
previously created fixtures.
* The file extension of the recorded fixtures was changed to
'.cy-playback' to make it easier to identify that these files belong to the
plugin.

## [2.2.2](https://github.com/oreillymedia/cypress-playback/compare/2.2.1...2.2.2) (2022-07-21)


### Bug Fixes

* get invocation details from parent ([34c9f96](https://github.com/oreillymedia/cypress-playback/commit/34c9f96910932f1c6a4d835c76b15f4c4e265e83))

## [2.2.1](https://github.com/oreillymedia/cypress-playback/compare/2.1.5...2.2.1) (2022-05-23)

## [2.1.5](https://github.com/oreillymedia/cypress-playback/compare/2.1.4...2.1.5) (2022-05-19)

## [2.1.4](https://github.com/oreillymedia/cypress-playback/compare/2.1.3...2.1.4) (2022-05-10)

## [2.1.3](https://github.com/oreillymedia/cypress-playback/compare/2.1.2...2.1.3) (2022-02-07)


### Bug Fixes

* Set 'access-control-allow-origin' to window origin ([96bfcfb](https://github.com/oreillymedia/cypress-playback/commit/96bfcfb5ac4baa5583001c9d24d25c64a41c6114))

## [2.1.2](https://github.com/oreillymedia/cypress-playback/compare/2.1.1...2.1.2) (2022-02-04)


### Bug Fixes

* Move 'allowed-control-allow-origin' overwrite ([8be816a](https://github.com/oreillymedia/cypress-playback/commit/8be816a45abd929662cb29eb8f600e494584f30e))
* remove or flatten header arrays in response ([a0a9a2b](https://github.com/oreillymedia/cypress-playback/commit/a0a9a2ba65c4f34bd004b305a8a89461495d7444))

## [2.1.1](https://github.com/oreillymedia/cypress-playback/compare/2.1.0...2.1.1) (2022-02-02)


### Bug Fixes

* Remove 'content-encoding' header in playback ([9dce356](https://github.com/oreillymedia/cypress-playback/commit/9dce356140c769605ca6c0de3d7a0f8897e24017))

# [2.1.0](https://github.com/oreillymedia/cypress-playback/compare/1.0.1...2.1.0) (2022-02-01)


### Features

* Add additional ignores, single response support ([64801dc](https://github.com/oreillymedia/cypress-playback/commit/64801dc3c9269e51d50110baf29e85453ac46fc6))

## [1.0.3](https://github.com/oreillymedia/cypress-playback/compare/1.0.1...1.0.3) (2022-01-28)


### Bug Fixes

* Handle multiple set-cookie headers ([df54a2a](https://github.com/oreillymedia/cypress-playback/commit/df54a2af81e56e7fe4f0f7aaa2176500fa1f4860))

## [1.0.2](https://github.com/oreillymedia/cypress-playback/compare/1.0.1...1.0.2) (2022-01-26)


### Bug Fixes

* Add 'addTasks.js' to .npmignore ([f8ec5bf](https://github.com/oreillymedia/cypress-playback/commit/f8ec5bf6d8ca0b46daf6aca0c7e5bac519bc6cae))

## 1.0.1 (2022-01-26)


### Bug Fixes

* Update lib package.json ([#9](https://github.com/oreillymedia/cypress-playback/issues/9)) ([3e0d8ea](https://github.com/oreillymedia/cypress-playback/commit/3e0d8ea40f491a9335b7b7cda732bdefe0dc8649))

# 1.0.0 (2022-01-26)


### Features

* Initial commit ([10b77eb](https://github.com/oreillymedia/cypress-playback/commit/10b77eb7080c305bd71695b64c84ef2385a5db54))
* Release 1.0.0 ([#7](https://github.com/oreillymedia/cypress-playback/issues/7)) ([eb6dccb](https://github.com/oreillymedia/cypress-playback/commit/eb6dccb1dd69d3ea7f1459b8e50cc2fc3b7b3d7d))


### BREAKING CHANGES

* Release 1.0.0

# 0.2.0 (2022-01-25)


### Features

* Initial commit ([10b77eb](https://github.com/oreillymedia/cypress-playback/commit/10b77eb7080c305bd71695b64c84ef2385a5db54))