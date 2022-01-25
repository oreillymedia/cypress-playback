/*
 * Stolen from MDN:
 * https://developer.mozilla.org/en-US/docs/Glossary/Base64#solution_2_%E2%80%93_rewriting_atob_and_btoa_using_typedarrays_and_utf-8
 */

/**
 * Internal helper function used by 'base64ToArrayBuffer'
 * @param {number} charCode
 * @returns {number}
 */
function base64ToUint6(charCode) {
  return charCode > 64 && charCode < 91
    ? charCode - 65
    : charCode > 96 && charCode < 123
      ? charCode - 71
      : charCode > 47 && charCode < 58
        ? charCode + 4
        : charCode === 43
          ? 62
          : charCode === 47
            ? 63
            /* c8 ignore next */ : 0;
}

/**
 * Converts a base64 string to an ArrayBuffer.
 * @param {string} b64
 * @returns {ArrayBuffer}
 */
function base64ToArrayBuffer(b64) {
  // Remove line feeds or any other unnecessary characters.
  const b64Enc = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const inLen = b64Enc.length;
  const outLen = inLen * 3 + 1 >> 2;
  const bytes = new Uint8Array(outLen);

  for (let mod3, mod4, uint24 = 0, outIdx = 0, inIdx = 0; inIdx < inLen; inIdx++) {
    mod4 = inIdx & 3;
    uint24 |= base64ToUint6(b64Enc.charCodeAt(inIdx)) << 6 * (3 - mod4);
    if (mod4 === 3 || inLen - inIdx === 1) {
      for (mod3 = 0; mod3 < 3 && outIdx < outLen; mod3++, outIdx++) {
        bytes[outIdx] = uint24 >>> (16 >>> mod3 & 24) & 255;
      }
      uint24 = 0;
    }
  }
  return bytes.buffer;
}

/**
 * Internal helper function used by 'arrayBufferToBase64'
 * @param {number} uint6
 * @returns {number}
 */
function uint6ToBase64(uint6) {
  return uint6 < 26
    ? uint6 + 65
    : uint6 < 52
      ? uint6 + 71
      : uint6 < 62
        ? uint6 - 4
        : uint6 === 62
          ? 43
          : uint6 === 63
            ? 47
            /* c8 ignore next */ : 65;
}

/**
 * Converts an ArrayBuffer to a base64 string.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
  let mod3 = 2;
  let b64 = '';

  for (let length = buffer.length, uint24 = 0, index = 0; index < length; index++) {
    mod3 = index % 3;
    uint24 |= buffer[index] << (16 >>> mod3 & 24);
    if (mod3 === 2 || buffer.length - index === 1) {
      b64 += String.fromCharCode(
        uint6ToBase64(uint24 >>> 18 & 63),
        uint6ToBase64(uint24 >>> 12 & 63),
        uint6ToBase64(uint24 >>> 6 & 63),
        uint6ToBase64(uint24 & 63)
      );
      uint24 = 0;
    }
  }

  return (
    b64.slice(0, b64.length - 2 + mod3)
    // Append equal signs if the value doesn't completely fill the last byte.
    + (mod3 === 2 ? '' : mod3 === 1 ? '=' /* c8 ignore next */ : '==')
  );
}

module.exports = {
  arrayBufferToBase64,
  base64ToArrayBuffer,
};
