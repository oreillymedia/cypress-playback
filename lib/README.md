# Cypress Playback

> 🔄 **_Automatically record and playback HTTP requests made in
> Cypress tests._**

[![GitHub CI](https://img.shields.io/github/workflow/status/oreillymedia/cypress-playback/Continuous%20Integration/main)][1]
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)][3]

Cypress Playback is a plugin and a set of commands that allows Cypress to
automatically record responses to network requests made during a test run. These
responses are then saved to disk and made available for playback in later test
runs. This allows for applications or components under test to always receive
the same response to a request, no matter where or when they run.

For details on how to integrate this plugin into Cypress and how it works,
please refer to the [README][2] in GitHub.

[1]:https://github.com/oreillymedia/cypress-playback
[2]:https://github.com/oreillymedia/cypress-playback#cypress-playback
[3]:https://github.com/oreillymedia/cypress-playback/blob/main/CODE-OF-CONDUCT.md