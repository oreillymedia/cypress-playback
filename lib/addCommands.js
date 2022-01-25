const index = require('./commands/index.js');

index.commands.forEach(({
  name, command, options = {}
}) => {
  Cypress.Commands.add(name, options, command);
});
