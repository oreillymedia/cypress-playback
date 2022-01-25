// Subjects-under-test
const { arrayBufferToBase64, base64ToArrayBuffer } = require('../arrayBufferFns');

describe('arrayBufferFns', () => {
  describe('unicode values', () => {
    it('correctly converts an ArrayBuffer to a base64 string.', () => {
      // A base64'ed value for a string containing: 😃😄;
      const expected = '8J+Yg/CfmIQ=';

      const buffer = new ArrayBuffer(8);
      const view = new Uint8Array(buffer);
      view[0] = 240;
      view[1] = 159;
      view[2] = 152;
      view[3] = 131;
      view[4] = 240;
      view[5] = 159;
      view[6] = 152;
      view[7] = 132;

      expect(arrayBufferToBase64(view)).to.equal(expected);
    });

    it('correctly converts a base64 string to an Array buffer.', () => {
      // A base64'ed value for a string containing: 😃😄;
      const view = new Uint8Array(base64ToArrayBuffer('8J+Yg/CfmIQ='));

      expect(view.length).to.equal(8);
      expect(view[0]).to.equal(240);
      expect(view[1]).to.equal(159);
      expect(view[2]).to.equal(152);
      expect(view[3]).to.equal(131);
      expect(view[4]).to.equal(240);
      expect(view[5]).to.equal(159);
      expect(view[6]).to.equal(152);
      expect(view[7]).to.equal(132);
    });

    it('handles long values', () => {
      // We'll use the NodeJs Buffer to make this comparison easier.
      const input = 'a very long input with line feeds'.repeat(100);
      const buffer = Buffer.from(input);
      const view = new Uint8Array(buffer);

      expect(arrayBufferToBase64(view)).to.equal(buffer.toString('base64'));
    });
  });
});
