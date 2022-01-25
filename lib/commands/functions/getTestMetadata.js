/**
 * Returns metadata regarding the currently running test.
 * @param {{}} context
 * @returns {{ file: string, title: string }}
 */
function getTestMetadata(context) {
  const test = context?.currentTest ?? context?.test ?? null;
  if (!test) {
    throw new Error('No "test" in context');
  }

  const file = test.invocationDetails?.absoluteFile;

  let titles = [test.title];
  let parent = test.parent;
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
    state: test.state,
    title
  };
}

module.exports = {
  getTestMetadata
};