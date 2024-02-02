/**
 * Function helped to round in need value
 * @param {string} value - value which need to round
 * @param {number} decPlaces - default 10, value descibe decimal places
 * @return {number} - new rounded
 **/
function roundToDecimalPlaces (value, decPlaces = 10){ // eslint-disable-line func-style
    const newValue = (Math.round(value * decPlaces) / decPlaces);
    return newValue;
}

/**
 * @param {nuber} value - color value
 * @return {number} - color value
 **/
function colorCorrector (value) { // eslint-disable-line func-style
    if (value > 255) {
        return 255;
    }
    if (value < 0) {
        return 0;
    }
    return value;
}


module.exports = {
    roundToDecimalPlaces,
    colorCorrector
};
