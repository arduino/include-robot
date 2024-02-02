/**
 * Enum for sensor direction.
 * @readonly
 * @enum {string}
 */
const SensorDirection = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right',
    ANY: 'any'
};

/**
 * Enum for sensor axis.
 * @readonly
 * @enum {string}
 */
const SensorAxis = {
    X: 'x',
    Y: 'y',
    Z: 'z'
};

/**
 * Enum for temperature unit.
 * @readonly
 * @enum {string}
 */
const TemperatureUnits = {
    CELSIUS: 'celsius',
    FAHRENHEIT: 'fahrenheit'
};

/**
 * Enum for pressure unit.
 * @readonly
 * @enum {string}
 */
const PressureUnits = {
    KILOPASCAL: 'kilopascal',
    MILLIBAR: 'millibar'
};

/**
 * Units enum for magnetic filed.
 * @readonly
 * @enum {string}
 */
const MagneticUnits = {
    MICROTESLA: 'microTesla',
    GAUSS: 'gauss'
};


const PIN_DIGITAL = {
    D2: {
        text: 'D2',
        value: '2'
    },
    D3: {
        text: 'D3/PWM',
        value: '3'
    },
    D4: {
        text: 'D4',
        value: '4'
    },
    D5: {
        text: 'D5/PWM',
        value: '5'
    },
    D6: {
        text: 'D6/PWM',
        value: '6'
    },
    D7: {
        text: 'D7',
        value: '7'
    },
    D8: {
        text: 'D8',
        value: '8'
    },
    D9: {
        text: 'D9/PWM',
        value: '9'
    },
    D10: {
        text: 'D10/PWM',
        value: '10'
    },
    D11: {
        text: 'D11',
        value: '11'
    },
    D12: {
        text: 'D12',
        value: '12'
    },
    D13: {
        text: 'D13',
        value: '13'
    }
};

const PIN_ANALOG = {
    A0: {
        text: 'A0',
        value: '0'
    },
    A1: {
        text: 'A1',
        value: '1'
    },
    A2: {
        text: 'A2',
        value: '2'
    },
    A3: {
        text: 'A3',
        value: '3'
    },
    A4: {
        text: 'A4',
        value: '4'
    },
    A5: {
        text: 'A5',
        value: '5'
    },
    A6: {
        text: 'A6',
        value: '6'
    },
    A7: {
        text: 'A7',
        value: '7'
    }
};

module.exports = {
    SensorDirection,
    SensorAxis,
    TemperatureUnits,
    PressureUnits,
    MagneticUnits,
    PIN_DIGITAL,
    PIN_ANALOG
};
