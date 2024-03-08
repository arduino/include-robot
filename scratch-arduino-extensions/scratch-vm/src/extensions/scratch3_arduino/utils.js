/**
 * Function helped to round in need value
 * @param {string} value - value which need to round
 * @param {number} decPlaces - default 10, value descibe decimal places
 * @return {number} - new rounded
 **/
function roundToDecimalPlaces(value, decPlaces = 10) {
  // eslint-disable-line func-style
  return Math.round(value * decPlaces) / decPlaces;
}

/**
 * @param {number} value - color value
 * @return {number} - color value
 **/
function colorCorrector(value) {
  // eslint-disable-line func-style
  if (value > 255) {
    return 255;
  }
  if (value < 0) {
    return 0;
  }
  return value;
}

function convertUInt16ToBytes(value) {
  // Ensure value is within the range of 16-bit unsigned integer (0-65535)
  value = Math.max(0, Math.min(0xffff, value));

  // Extract the two bytes
  let byte1 = (value >> 8) & 0x00ff; // Extract the higher 8 bits
  let byte2 = value & 0x00ff; // Extract the lower 8 bits

  // Return an array containing the two bytes
  return [byte1, byte2];
}

module.exports = {
  roundToDecimalPlaces,
  colorCorrector,
  convertUInt16ToBytes,
};
