describe('local to-do app', () => {
  let baseUrl;
  before(() => {
    cy.isPlayingBackRequests().then(isPlayingBack => {
      cy.isRecordingRequests().then(isRecording => {
        // The scripts defined in the `package.json` cause the server to be run
        // at 8081 when recording and 8082 when playing back. This is to allow
        // us to test the `matching.ignores` feature.
        if (isRecording) {
          baseUrl = `http://localhost:${8081}/`;
        } else if (isPlayingBack) {
          baseUrl = `http://localhost:${8082}/`;
        }
        cy.log(`isPlayingBack: ${isPlayingBack}`);
        cy.log(`isRecording: ${isRecording}`);
      });
    });
  });

  it('does something', () => {
    cy.playback('GET', new RegExp('./assets/static-image.jpeg'),
      {
        matching: { ignores: ['port'] }
      }
    ).as('static');

    cy.playback('GET', new RegExp('fillmurray')).as('image');

    cy.playback('GET', new RegExp('/todos/'),
      {
        toBeCalledAtLeast: 2
      }
    ).as('todos');

    cy.visit(baseUrl);

    cy.wait('@todos');
    cy.wait('@image');
    cy.wait('@static');
    cy.get('h1').should('be.visible');
  });
});
