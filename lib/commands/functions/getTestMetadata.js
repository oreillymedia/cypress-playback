/**
 * Returns metadata regarding the currently running test.
 * @param {{}} context
 * @returns {{ file: string, title: string }}
 */
function getTestMetadata(context) {
  // The data we need is spread across two different properties in the context.
  // - `currentTest` represents the test that is being run. It tends to be
  //   present more reliably.
  // - `test` is more specific and may actually be tied to a hook, such as
  //   beforeEach / afterEach. It may not always be present. However, if
  //   present, it's `file` property is a better relative path to the file for
  //   the current test suite.
  const { currentTest, test } = context ?? {};
  if (!currentTest) {
    throw new Error('No "currentTest" in context');
  }

  const invocationDetails = currentTest.invocationDetails ?? currentTest.parent?.invocationDetails;
  const file = test?.file ?? currentTest?.file ?? invocationDetails?.relativeFile;

  let titles = [currentTest.title];
  let parent = currentTest.parent;
  while (!parent.root) {
    titles.push(parent.title);
    parent = parent.parent;
  }
  const title = titles.reverse().join('-');

  if (!file) {
    throw new Error('Could not determine "file"');
  }
  if (!title) {
    throw new Error('Could not determine "title"');
  }
  return {
    file,
    state: currentTest.state,
    title
  };
}

module.exports = {
  getTestMetadata
};
