const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');
const Cast = require('../../util/cast');
const Color = require('../../util/color');
const log = require('../../util/log');

const blockIconURI = require('./blockIconURI');
const Peripheral = require('./peripheral');
const { roundToDecimalPlaces } = require('./utils');

const {
    SensorDirection,
    SensorAxis,
    TemperatureUnits,
    PressureUnits,
    MagneticUnits,
    PIN_DIGITAL,
    PIN_ANALOG
} = require('./constants');

const calcAngelByAxis = (mainAxis, axis1, axis2) => {
    const axis1Square = roundToDecimalPlaces(axis1 * axis1, 100);
    const axis2Square = roundToDecimalPlaces(axis2 * axis2, 100);

    return roundToDecimalPlaces(Math.atan(mainAxis / Math.sqrt(axis1Square + axis2Square)) * 180 / Math.PI);
};


// Scared BLE device amond all extensions
let DEVICE;

/**
 * A time interval to wait (in milliseconds) while a block that sends a BLE message is running.
 * @type {number}
 */
const BLESendInterval = 300;

class IncludeRobot {
    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID() {
        return 'IncludeRobot';
    }

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME() {
        return 'Arduino Include Robot';
    }

    /**
     * @return {number} - the tilt sensor counts as "tilted" if its tilt g value meets or exceeds this threshold.
     */
    static get TILT_THRESHOLD() {
        return 15;
    }

    /**
     * @return {number} - the gyroscope sensor counts as "roteted"
     * if its degrees/second value meets or exceeds this threshold.
     */
    static get ROTATE_THRESHOLD() {
        return 100;
    }

    /**
     * @return {array} - text and values for each digital pins name
     */
    get PINS_DIGITAL_MENU() {
        return Object.keys(PIN_DIGITAL).map(key => PIN_DIGITAL[key]);
    }

    static SERVO_LEFT_PIN = 3;
    static SERVO_RIGHT_PIN = 4;

    /**
     * Construct a set of Arduino blocks.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor(runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this._runtime = runtime;
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo() {
        return {
            id: IncludeRobot.EXTENSION_ID,
            name: IncludeRobot.EXTENSION_NAME,
            blockIconURI: blockIconURI,

            // Core extensions only: override the default extension block colors.
            color1: '#0ca1a6',
            color2: '#7fcbcd',

            showStatusButton: false,

            blocks: [
                {
                    opcode: 'moveForward',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'IncludeRobot.moveForward',
                        default: 'Go forward [STEPS] steps',
                        description: 'go forward for a given amount of steps.'
                    }),
                    arguments: {
                        STEPS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1'
                        }
                    }
                },
                {
                    opcode: 'moveBackward',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'IncludeRobot.moveBackward',
                        default: 'Go backward [STEPS] steps',
                        description: 'go backward for a given amount of steps'
                    }),
                    arguments: {
                        STEPS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1'
                        }
                    }
                },
                {
                    opcode: 'turnLeft',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'IncludeRobot.turnLeft',
                        default: 'Turn left [DEGREE] degree',
                        description: 'Turn left of degree.'
                    }),
                    arguments: {
                        DEGREE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '90'
                        }
                    }
                },
                {
                    opcode: 'turnRight',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'IncludeRobot.turnRight',
                        default: 'Turn right [DEGREE] degree',
                        description: 'Turn right of degree.'
                    }),
                    arguments: {
                        DEGREE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '90'
                        }
                    }
                },

            ],

            menus: {}
        };
    }

    moveForward(args) {
        let steps = Cast.toNumber(args.STEPS);
        return DEVICE.moveForward(steps);
    }

    moveBackward(args) {
        let steps = Cast.toNumber(args.STEPS);
        return DEVICE.moveBackward(steps);
    }

    turnLeft(args) {
        let degree = Cast.toNumber(args.DEGREE);
        degree = Math.max(360, Math.min(0, degree));
        return DEVICE.turnLeft(degree)
    }

    turnRight(args) {
        let degree = Cast.toNumber(args.DEGREE);
        degree = Math.max(360, Math.min(0, degree    ));
        return DEVICE.turnRight(degree)
    }
}


class Scratch3Arduino {
    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID() {
        return 'arduinoNano33BleSense';
    }

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME() {
        return 'Arduino BLE Sense';
    }

    /**
     * @return {number} - the tilt sensor counts as "tilted" if its tilt g value meets or exceeds this threshold.
     */
    static get TILT_THRESHOLD() {
        return 15;
    }

    /**
     * @return {number} - the gyroscope sensor counts as "roteted"
     * if its degrees/second value meets or exceeds this threshold.
     */
    static get ROTATE_THRESHOLD() {
        return 100;
    }

    /**
     * @return {array} - text and values for each sensor direction menu element
     */
    get SENSOR_DIRECTION_MENU() {
        return [
            {
                text: formatMessage({
                    id: 'arduinoNano33BleSense.sensorDirection.up',
                    default: 'up'
                }),
                value: SensorDirection.UP
            },
            {
                text: formatMessage({
                    id: 'arduinoNano33BleSense.sensorDirection.down',
                    default: 'down'
                }),
                value: SensorDirection.DOWN
            },
            {
                text: formatMessage({
                    id: 'arduinoNano33BleSense.sensorDirection.left',
                    default: 'left'
                }),
                value: SensorDirection.LEFT
            },
            {
                text: formatMessage({
                    id: 'arduinoNano33BleSense.sensorDirection.right',
                    default: 'right'
                }),
                value: SensorDirection.RIGHT
            }
        ];
    }

    /**
     * @return {array} - text and values for each sensor direction menu element
     */
    get SENSOR_DIRECTION_MENU_EXTENDED() {
        return this.SENSOR_DIRECTION_MENU.concat([
            {
                text: formatMessage({
                    id: 'arduinoNano33BleSense.sensorDirection.any',
                    default: 'any'
                }),
                value: SensorDirection.ANY
            }
        ]);
    }

    /**
     * @return {array} - text and values for each sensor axis menu element
     */
    get SENSOR_3D_AXIS_MENU() {
        return [
            {
                text: 'x',
                value: SensorAxis.X
            },
            {
                text: 'y',
                value: SensorAxis.Y
            },
            {
                text: 'z',
                value: SensorAxis.Z
            }
        ];
    }

    /**
     * @return {array} - text and values for each sensor axis menu element
     */
    get SENSOR_2D_AXIS_MENU() {
        return [
            {
                text: 'x',
                value: SensorAxis.X
            },
            {
                text: 'y',
                value: SensorAxis.Y
            }
        ];
    }

    /**
     * @return {array} - level
     */
    get DIGITAL_LEVEL_MENU() {
        return [
            {
                text: formatMessage({
                    id: 'arduinoNano33BleSense.digitalLevel.LOW',
                    default: 'LOW'
                }),
                value: '0'
            },
            {
                text: formatMessage({
                    id: 'arduinoNano33BleSense.digitalLevel.HIGH',
                    default: 'HIGH'
                }),
                value: '1'
            }
        ];
    }

    /**
     * @return {array} - pin mode
     */
    get DIGITAL_PIN_MODE_MENU() {
        return [
            {
                text: formatMessage({
                    id: 'arduinoNano33BleSense.digitalMode.INPUT',
                    default: 'INPUT'
                }),
                value: '0'
            },
            {
                text: formatMessage({
                    id: 'arduinoNano33BleSense.digitalMode.OUTPUT',
                    default: 'OUTPUT'
                }),
                value: '1'
            }
        ];
    }

    /**
     * @return {array} - text and values for each digital pins name
     */
    get PINS_DIGITAL_MENU() {
        return Object.keys(PIN_DIGITAL).map(key => PIN_DIGITAL[key]);
    }

    /**
     * @return {array} - text and values for each digital pins name
     */
    get PINS_ANALOG_MENU() {
        return Object.keys(PIN_ANALOG).map(key => PIN_ANALOG[key]);
    }

    /**
     * @return {array} - text and values for each temperature unit menu element
     */
    get TEMPERATURE_UNIT_MENU() {
        return [
            {
                text: '°C',
                value: TemperatureUnits.CELSIUS
            },
            {
                text: '°F',
                value: TemperatureUnits.FAHRENHEIT
            }
        ];
    }

    /**
     * @return {array} - text and values for each pressure unit menu element
     */
    get PRESSURE_UNIT_MENU() {
        return [
            {
                text: formatMessage({
                    id: 'arduinoNano33BleSense.pressureUnit.kilopascal',
                    default: 'kPa'
                }),
                value: PressureUnits.KILOPASCAL
            },
            {
                text: formatMessage({
                    id: 'arduinoNano33BleSense.pressureUnit.millibar',
                    default: 'mbar'
                }),
                value: PressureUnits.MILLIBAR
            }
        ];
    }

    /**
     * @return {array} - text and values for each magnetic unit menu element
     */
    get MAGNETIC_UNIT_MENU() {
        return [
            {
                text: formatMessage({
                    id: 'arduinoNano33BleSense.magneticUnit.microtesla',
                    default: 'μT'
                }),
                value: MagneticUnits.MICROTESLA
            },
            {
                text: formatMessage({
                    id: 'arduinoNano33BleSense.magneticUnit.gauss',
                    default: 'Gs'
                }),
                value: MagneticUnits.GAUSS
            }
        ];
    }

    getTemperatureUnit(unit) {
        if (unit === TemperatureUnits.FAHRENHEIT) {
            return '°F';
        }
        return '°C';
    }

    getPressureUnit(unit) {
        if (unit === PressureUnits.MILLIBAR) {
            return formatMessage({
                id: 'arduinoNano33BleSense.pressureUnit.millibar',
                default: 'mbar'
            });
        }
        return formatMessage({
            id: 'arduinoNano33BleSense.pressureUnit.kilopascal',
            default: 'kPa'
        });
    }

    getMagneticUnit(unit) {
        if (unit === MagneticUnits.GAUSS) {
            return formatMessage({
                id: 'arduinoNano33BleSense.magneticUnit.gauss',
                default: 'Gs'
            });
        }
        return formatMessage({
            id: 'arduinoNano33BleSense.magneticUnit.microtesla',
            default: 'μT'
        });
    }

    /**
     * Construct a set of Arduino blocks.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor(runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this._runtime = runtime;

        // Implement arduino connection
        DEVICE = new Peripheral(this._runtime, Scratch3Arduino.EXTENSION_ID);
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo() {
        return {
            id: Scratch3Arduino.EXTENSION_ID,
            name: Scratch3Arduino.EXTENSION_NAME,
            blockIconURI: blockIconURI,

            // Core extensions only: override the default extension block colors.
            color1: '#0ca1a6',
            color2: '#7fcbcd',

            showStatusButton: true,

            blocks: [
                {
                    opcode: 'whenGesture',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.whenGesture',
                        default: 'When hand moves [SENSOR_DIRECTION]',
                        description: 'check when gestured in a certain direction'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        SENSOR_DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'SENSOR_DIRECTION_EXTENDED',
                            defaultValue: SensorDirection.UP
                        }
                    }
                },
                {
                    opcode: 'whenTilted',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.whenTilted',
                        default: 'When the board is tilted [SENSOR_DIRECTION]',
                        description: 'check when tilted in a certain direction'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        SENSOR_DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'SENSOR_DIRECTION',
                            defaultValue: SensorDirection.UP
                        }
                    }
                },
                {
                    opcode: 'whenRotation',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.whenRotation',
                        default: 'When the board rotates over [SENSOR_3D_AXIS]',
                        description: 'check when rotated in a certain direction'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        SENSOR_3D_AXIS: {
                            type: ArgumentType.STRING,
                            menu: 'SENSOR_3D_AXIS',
                            defaultValue: SensorAxis.X
                        }
                    }
                },
                '---',
                // Sensors data
                {
                    opcode: 'setRGBLedColor',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.setRGBLedColor',
                        default: 'Set RGB LED color [COLOR]',
                        description: 'set the led color (RGB) value'
                    }),
                    arguments: {
                        COLOR: {
                            type: ArgumentType.COLOR
                        }
                    }
                },
                {
                    opcode: 'setDigitalPin',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.setDigitalPin',
                        default: 'Set pin [DIGITAL_PINS] as [DIGITAL_LEVEL]',
                        description: 'set digital pin state.'
                    }),
                    arguments: {
                        DIGITAL_LEVEL: {
                            type: ArgumentType.NUMBER,
                            menu: 'DIGITAL_LEVEL',
                            defaultValue: '0'
                        },
                        DIGITAL_PINS: {
                            type: ArgumentType.NUMBER,
                            menu: 'DIGITAL_PINS',
                            defaultValue: PIN_DIGITAL.D2.value
                        }
                    }
                },
                {
                    opcode: 'setAnalogPin',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.setAnalogPin',
                        default: 'Set the analog output of the analog pin [ANALOG_PINS] as [ANALOG_VALUE]',
                        description: 'set analog pin state'
                    }),
                    arguments: {
                        ANALOG_VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        },
                        ANALOG_PINS: {
                            type: ArgumentType.NUMBER,
                            menu: 'DIGITAL_PINS',
                            defaultValue: PIN_DIGITAL.D2.value
                        }
                    }
                },
                {
                    opcode: 'setServoCommand',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.setServoCommand',
                        default: 'Set the servo motor angle on pin [DIGITAL_PINS] to [DEGREES_ROTATION] °',
                        description: 'set the servo motor.'
                    }),
                    arguments: {
                        DIGITAL_PINS: {
                            type: ArgumentType.NUMBER,
                            menu: 'DIGITAL_PINS',
                            defaultValue: PIN_DIGITAL.D2.value
                        },
                        DEGREES_ROTATION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '90'
                        }
                    }
                },
                {
                    opcode: 'setDoubleServoCommand',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.setDoubleServoCommand',
                        default: `Set the servo motor angles on pin [DIGITAL_PINS] and
                        [DIGITAL_PINS_2] to [DEGREES_ROTATION] °`,
                        description: 'set 2 servo motors simultaneously.'
                    }),
                    arguments: {
                        DIGITAL_PINS: {
                            type: ArgumentType.NUMBER,
                            menu: 'DIGITAL_PINS',
                            defaultValue: PIN_DIGITAL.D2.value
                        },
                        DIGITAL_PINS_2: {
                            type: ArgumentType.NUMBER,
                            menu: 'DIGITAL_PINS',
                            defaultValue: PIN_DIGITAL.D2.value
                        },
                        DEGREES_ROTATION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '90'
                        }
                    }
                },
                {
                    opcode: 'setServoStopCommand',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.setServoStopCommand',
                        default: 'Stop the servo motor on pin [DIGITAL_PINS]',
                        description: 'stop the servo motor.'
                    }),
                    arguments: {
                        DIGITAL_PINS: {
                            type: ArgumentType.NUMBER,
                            menu: 'DIGITAL_PINS',
                            defaultValue: PIN_DIGITAL.D2.value
                        }
                    }
                },
                {
                    opcode: 'setDoubleServoStopCommand',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.setDoubleServoStopCommand',
                        default: `Stop the servo motors on pin [DIGITAL_PINS] and
                        [DIGITAL_PINS_2]`,
                        description: 'stop 2 servo motors.'
                    }),
                    arguments: {
                        DIGITAL_PINS: {
                            type: ArgumentType.NUMBER,
                            menu: 'DIGITAL_PINS',
                            defaultValue: PIN_DIGITAL.D2.value
                        },
                        DIGITAL_PINS_2: {
                            type: ArgumentType.NUMBER,
                            menu: 'DIGITAL_PINS',
                            defaultValue: PIN_DIGITAL.D2.value
                        }
                    }
                },

                '---',
                // get tilted angel
                {
                    opcode: 'getTiltedAngel',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.getTiltedAngel',
                        default: 'Measure tilted over [SENSOR_2D_AXIS] in °',
                        description: 'get tilted angel by axis.'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        SENSOR_2D_AXIS: {
                            type: ArgumentType.STRING,
                            menu: 'SENSOR_2D_AXIS',
                            defaultValue: SensorAxis.X
                        }
                    }
                },
                // get rotation
                {
                    opcode: 'getRotation',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.getRotation',
                        default: 'Measure the rotation over [SENSOR_3D_AXIS], dps',
                        description: 'get rotation by axis.'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        SENSOR_3D_AXIS: {
                            type: ArgumentType.STRING,
                            menu: 'SENSOR_3D_AXIS',
                            defaultValue: SensorAxis.X
                        }
                    }
                },
                // Get temperature from sensor
                {
                    opcode: 'getTemperature',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.getTemperature',
                        default: 'Measure temperature, [TEMPERATURE_UNIT]',
                        description: 'get the temperature value.'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        TEMPERATURE_UNIT: {
                            type: ArgumentType.STRING,
                            menu: 'TEMPERATURE_UNIT',
                            defaultValue: TemperatureUnits.CELSIUS
                        }
                    }
                },
                // Get pressure from sensor
                {
                    opcode: 'getPressure',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.getPressure',
                        default: 'Measure barometric pressure, [PRESSURE_UNIT]',
                        description: 'get the pressure value.'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        PRESSURE_UNIT: {
                            type: ArgumentType.STRING,
                            menu: 'PRESSURE_UNIT',
                            defaultValue: PressureUnits.KILOPASCAL
                        }
                    }
                },
                // get magnetic field value
                {
                    opcode: 'getMagneticField',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.getMagneticField',
                        default: 'Measure the magnetic field over the [SENSOR_3D_AXIS] axis in [MAGNETIC_UNIT]',
                        description: 'get magnetic field by axis.'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        SENSOR_3D_AXIS: {
                            type: ArgumentType.STRING,
                            menu: 'SENSOR_3D_AXIS',
                            defaultValue: SensorAxis.X
                        },
                        MAGNETIC_UNIT: {
                            type: ArgumentType.STRING,
                            menu: 'MAGNETIC_UNIT',
                            defaultValue: MagneticUnits.MICROTESLA
                        }

                    }
                },
                // get acceleration in G's
                {
                    opcode: 'getAcceleration',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.getAcceleration',
                        default: 'Measure acceleration over [SENSOR_3D_AXIS], g',
                        description: 'get acceleration in G\'s by axis.'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        SENSOR_3D_AXIS: {
                            type: ArgumentType.STRING,
                            menu: 'SENSOR_3D_AXIS',
                            defaultValue: SensorAxis.X
                        }
                    }
                },
                {
                    opcode: 'getAnalogPin',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.getAnalogPin',
                        default: 'Read analog pin [ANALOG_PINS]',
                        description: 'read analog pins data'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        ANALOG_PINS: {
                            type: ArgumentType.NUMBER,
                            menu: 'ANALOG_PINS',
                            defaultValue: PIN_ANALOG.A0.value
                        }
                    }
                },

                // Get humidity value from sensor
                {
                    opcode: 'getHumidity',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.getHumidity',
                        default: 'Measure humidity, %',
                        description: 'get the humidity value.'
                    }),
                    blockType: BlockType.REPORTER
                    // disableMonitor: true
                },


                // Get color from sensor
                {
                    opcode: 'getColorLight',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.getColorLight',
                        default: 'Identify color, HEX',
                        description: 'get color data from sensor.'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'getColorR',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.getColorR',
                        default: 'Identify color, R',
                        description: 'get color R from sensor.'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'getColorG',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.getColorG',
                        default: 'Identify color, G',
                        description: 'get color G from sensor.'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'getColorB',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.getColorB',
                        default: 'Identify color, B',
                        description: 'get color B from sensor.'
                    }),
                    blockType: BlockType.REPORTER
                },
                // Get ambient light
                {
                    opcode: 'getAmbientLight',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.getAmbientLight',
                        default: 'Measure ambient light, lx',
                        description: 'get ambient light value in Lux.'
                    }),
                    blockType: BlockType.REPORTER
                },
                // Get proximity value
                {
                    opcode: 'getProximity',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.getProximity',
                        default: 'Detect proximity, mm',
                        description: 'get proximity value.'
                    }),
                    blockType: BlockType.REPORTER
                },
                '---',
                {
                    opcode: 'isTilted',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.isTilted',
                        default: 'Is the board tilted [SENSOR_DIRECTION]?',
                        description: 'check is the board tilted.'
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        SENSOR_DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'SENSOR_DIRECTION',
                            defaultValue: SensorDirection.UP
                        }
                    }
                },
                // is gestured sensor
                {
                    opcode: 'isGestured',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.isGestured',
                        default: 'Has the hand moved [SENSOR_DIRECTION]?',
                        description: 'check is the board gestured.'
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        SENSOR_DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'SENSOR_DIRECTION',
                            defaultValue: SensorDirection.UP
                        }
                    }
                },
                {
                    opcode: 'isRotated',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.isRotated',
                        default: 'Is the board rotating towards [SENSOR_3D_AXIS]?',
                        description: 'check is the board rotated.'
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        SENSOR_3D_AXIS: {
                            type: ArgumentType.STRING,
                            menu: 'SENSOR_3D_AXIS',
                            defaultValue: SensorAxis.X
                        }
                    }
                },
                {
                    opcode: 'isProximityCovered',
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.isProximityCovered',
                        default: 'Is proximity sensor covered',
                        description: 'is proximity sensor.'
                    }),
                    blockType: BlockType.BOOLEAN
                }

                // Pin's data and command
                /* {
                    opcode: 'setDigitalPinMode',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduinoNano33BleSense.setDigitalPinMode',
                        default: 'Initialize digital pin [DIGITAL_PINS] as [DIGITAL_MODE]',
                        description: 'set digital pin mode.'
                    }),
                    arguments: {
                        DIGITAL_MODE: {
                            type: ArgumentType.NUMBER,
                            menu: 'DIGITAL_MODE',
                            defaultValue: '0'
                        },
                        DIGITAL_PINS: {
                            type: ArgumentType.NUMBER,
                            menu: 'DIGITAL_PINS',
                            defaultValue: PIN_DIGITAL.D2.value
                        }
                    }
                },*/

            ],
            menus: {
                SENSOR_DIRECTION: {
                    items: this.SENSOR_DIRECTION_MENU
                },
                SENSOR_DIRECTION_EXTENDED: {
                    items: this.SENSOR_DIRECTION_MENU_EXTENDED
                },
                SENSOR_3D_AXIS: {
                    items: this.SENSOR_3D_AXIS_MENU
                },
                SENSOR_2D_AXIS: {
                    items: this.SENSOR_2D_AXIS_MENU
                },
                TEMPERATURE_UNIT: {
                    items: this.TEMPERATURE_UNIT_MENU
                },
                PRESSURE_UNIT: {
                    items: this.PRESSURE_UNIT_MENU
                },
                MAGNETIC_UNIT: {
                    items: this.MAGNETIC_UNIT_MENU
                },
                DIGITAL_LEVEL: {
                    items: this.DIGITAL_LEVEL_MENU
                },
                DIGITAL_PINS: {
                    items: this.PINS_DIGITAL_MENU
                },
                ANALOG_PINS: {
                    items: this.PINS_ANALOG_MENU
                },
                DIGITAL_MODE: {
                    items: this.DIGITAL_PIN_MODE_MENU
                }
            }
        };
    }

    /**
     * @param {object} args - the block's arguments.
     * @property {sensorDirection} SENSOR_DIRECTION - the tilt direction to test (up, down, left, right, or any).
     * @return {boolean} - true if the tilt sensor is gesture past a threshold in the specified direction.
     */
    whenGesture(args) {
        const direction = Cast.toString(args.SENSOR_DIRECTION);
        return this._isGestured(direction);
    }

    /**
     * @param {object} args - the block's arguments.
     * @return {boolean} - true if detected gesture.
     */
    isGestured(args) {
        const direction = Cast.toString(args.SENSOR_DIRECTION);
        return this._isGestured(direction);
    }

    _isGestured(direction) {
        const sensorData = DEVICE.gestureState;

        switch (direction) {
            case SensorDirection.ANY:
                return sensorData > -1;

            case SensorDirection.UP:
                return sensorData === 0;

            case SensorDirection.DOWN:
                return sensorData === 1;

            case SensorDirection.LEFT:
                return sensorData === 2;

            case SensorDirection.RIGHT:
                return sensorData === 3;

            default:
                log.warn(`Unknown gestured direction in _isGestured: ${direction}`);
        }
        return false;
    }

    /**
     * @param {object} args - the block's arguments.
     * @property {sensorDirection} SENSOR_DIRECTION - the tilt direction to test (up, down, left, right, or any).
     * @return {boolean} - true if the tilt sensor is tilted past a threshold in the specified direction.
     */
    whenTilted(args) {
        const direction = Cast.toString(args.SENSOR_DIRECTION);
        return this._isTilted(direction);
    }

    /**
     * @param {object} args - the block's arguments.
     * @return {boolean} - true if detected tilt.
     */
    isTilted(args) {
        const direction = Cast.toString(args.SENSOR_DIRECTION);
        return this._isTilted(direction);
    }

    _isTilted(direction) {
        const acceleration = DEVICE.acceleration;
        if (direction === SensorDirection.ANY) {
            return Math.abs(acceleration.x * 100) >= Scratch3Arduino.TILT_THRESHOLD ||
                Math.abs(acceleration.y * 100) >= Scratch3Arduino.TILT_THRESHOLD;
        }

        return this._getAccelerationByDirection(direction, acceleration) >= Scratch3Arduino.TILT_THRESHOLD;
    }

    getTiltedAngel(args) {
        const axis = Cast.toString(args.SENSOR_2D_AXIS);
        return this._getAngelByAcceleration(axis);
    }

    _getAngelByAcceleration(axis) {
        const acceleration = DEVICE.acceleration;
        switch (axis) {
            case SensorAxis.X:
                return calcAngelByAxis(acceleration.y, acceleration.x, acceleration.z);
            case SensorAxis.Y:
                return calcAngelByAxis(acceleration.x, acceleration.y, acceleration.z);
            default:
                log.warn(`Unknown tilt axis in _getAngelByAcceleration: ${axis}`);
        }

        return 0;
    }

    _getAccelerationByDirection(direction, acceleration) {
        switch (direction) {
            case SensorDirection.UP:
                return Math.round(acceleration.x * 100);

            case SensorDirection.DOWN:
                return Math.round(acceleration.x * -100);

            case SensorDirection.LEFT:
                return Math.round(acceleration.y * 100);

            case SensorDirection.RIGHT:
                return Math.round(acceleration.y * -100);

            default:
                log.warn(`Unknown tilt direction in _getAccelerationByDirection: ${direction}`);
        }

        return false;
    }

    /**
     * @param {object} args - the block's arguments.
     * @property {sensorAxis} SENSOR_3D_AXIS - the tilt direction to test (x, y, z).
     * @return {boolean} - true if the tilt sensor is rotation past a threshold in the specified direction.
     */
    whenRotation(args) {
        const axis = Cast.toString(args.SENSOR_3D_AXIS);
        return this._isRotated(axis);
    }

    /**
     * @param {object} args - the block's arguments.
     * @return {boolean} - true if detected detect.
     */
    isRotated(args) {
        const axis = Cast.toString(args.SENSOR_3D_AXIS);
        return this._isRotated(axis);
    }

    _isRotated(axis) {
        if (DEVICE.gyroscope.hasOwnProperty(axis)) {
            const rotationByAxis = DEVICE.gyroscope[axis];
            return Math.abs(rotationByAxis) >= Scratch3Arduino.ROTATE_THRESHOLD;
        }
        log.warn(`Unknown axis in _isRotated: ${axis}`);
        return 0;
    }

    /**
     * Set RGB Led color.
     * The transparency is reset to 0.
     * @param {object} args - the block arguments.
     * @property {int} COLOR - the color to set, expressed as a 24-bit RGB value (0xRRGGBB).
     * @return {Promise} - a Promise that resolves after a tick.
     */
    setRGBLedColor(args) {
        const rgb = Cast.toRgbColorObject(args.COLOR);

        DEVICE.setLedColor(rgb);
        return new Promise(resolve => {
            window.setTimeout(() => {
                resolve();
            }, BLESendInterval);
        });
    }

    /**
     * @return {string} - the humidity value from sensor.
     */
    getHumidity() {
        return `${DEVICE.humidity}`;
    }

    /**
     * @param {object} args - the block arguments.
     * @property {temperatureUnit} TEMPERATURE_UNIT - the type of unit for temperature.
     * @return {number} - the temperature value from sensor.
     */
    getTemperature(args) {
        const unit = Cast.toString(args.TEMPERATURE_UNIT);
        return DEVICE.getTemperature(unit === TemperatureUnits.FAHRENHEIT);
    }

    /**
     * @param {object} args - the block arguments.
     * @property {pressureUnit} PRESSURE_UNIT - the type of unit for pressure.
     * @return {number} - the temperature value from sensor.
     */
    getPressure(args) {
        const unit = Cast.toString(args.PRESSURE_UNIT);
        return DEVICE.getPressure(unit === PressureUnits.MILLIBAR);
    }

    /**
     * @return {string} - the color in hex (#ffffff).
     */
    getColorLight() {
        const color = DEVICE.colorLight;
        return Color.rgbToHex(color);
    }

    /**
     * @return {number} - the color in RGB.
     */
    getColorR() {
        const color = DEVICE.colorLight;
        return color.r;
    }
    /**
     * @return {number} - the color in RGB.
     */
    getColorG() {
        const color = DEVICE.colorLight;
        return color.g;
    }
    /**
     * @return {number} - the color in RGB.
     */
    getColorB() {
        const color = DEVICE.colorLight;
        return color.b;
    }

    /**
     * @return {number} - the ambient light value, lx.
     */
    getAmbientLight() {
        return DEVICE.ambientLight;
    }

    /**
     * @return {number} - the proximity.
     */
    getProximity() {
        return DEVICE.proximity;
    }

    /**
     * @return {boolean} - true if sensor covered.
     */
    isProximityCovered() {
        return DEVICE.proximity === 0;
    }

    /**
     * @param {object} args - the block's arguments.
     * @property {sensorAxis} SENSOR_3D_AXIS - obtaining the magnetic field value along the axis directions(x, y, z).
     * @property {magneticUnit} MAGNETIC_UNIT - magnetic unit.
     * @return {number} - return the magnetic value
     */
    getMagneticField(args) {
        const axis = Cast.toString(args.SENSOR_3D_AXIS);
        const unit = Cast.toString(args.MAGNETIC_UNIT);

        let value = 0;
        if (DEVICE.magneticField.hasOwnProperty(axis)) {
            const magneticFieldByAxis = DEVICE.magneticField[axis];
            if (unit === MagneticUnits.GAUSS) {
                value = roundToDecimalPlaces(magneticFieldByAxis / 100, 100000);
            } else {
                // uT
                value = magneticFieldByAxis;
            }
            return value;
        }

        log.warn(`Unknown axis in getMagneticField: ${axis}`);
        return value;
    }

    /**
     * @param {object} args - the block's arguments.
     * @property {sensorAxis} SENSOR_3D_AXIS - obtaining the rotation value by axis(x, y, z).
     * @return {number} - return the rotation value degree/second
     */
    getRotation(args) {
        const axis = Cast.toString(args.SENSOR_3D_AXIS);

        if (DEVICE.gyroscope.hasOwnProperty(axis)) {
            return DEVICE.gyroscope[axis];
        }

        log.warn(`Unknown axis in getRotation: ${axis}`);
        return 0;
    }

    /**
     * @param {object} args - the block's arguments.
     * @property {sensorAxis} SENSOR_3D_AXIS - obtaining the acceleration value by axis(x, y, z).
     * @return {number} - return the acceleration value
     */
    getAcceleration(args) {
        const axis = Cast.toString(args.SENSOR_3D_AXIS);

        if (DEVICE.acceleration.hasOwnProperty(axis)) {
            return DEVICE.acceleration[axis];
        }

        log.warn(`Unknown axis in getAcceleration: ${axis}`);
        return 0;
    }

    setDigitalPinMode(args) {
        const pinNumber = Cast.toNumber(args.DIGITAL_PINS);
        const pinMode = Cast.toNumber(args.DIGITAL_MODE);
        DEVICE.setDigitalMode(pinNumber, pinMode);

        return new Promise(resolve => {
            window.setTimeout(() => {
                resolve();
            }, BLESendInterval);
        });
    }

    setDigitalPin(args) {
        const pinNumber = Cast.toNumber(args.DIGITAL_PINS);
        const pinLevel = Cast.toNumber(args.DIGITAL_LEVEL);
        DEVICE.setDigitalValue(pinNumber, pinLevel);

        return new Promise(resolve => {
            window.setTimeout(() => {
                resolve();
            }, BLESendInterval);
        });
    }

    setAnalogPin(args) {
        const pinNumber = Cast.toNumber(args.ANALOG_PINS);
        const pinValue = Cast.toNumber(args.ANALOG_VALUE);
        DEVICE.setAnalogValue(pinNumber, pinValue);

        return new Promise(resolve => {
            window.setTimeout(() => {
                resolve();
            }, BLESendInterval);
        });
    }

    getAnalogPin(args) {
        const pinNumber = Cast.toNumber(args.ANALOG_PINS);
        return DEVICE.getAnalogPinValue(pinNumber);
    }

    setServoCommand(args) {
        const pinNumber = Cast.toNumber(args.DIGITAL_PINS);
        const rotation = Cast.toNumber(args.DEGREES_ROTATION);

        DEVICE.setServoMotor(pinNumber, rotation);

        return new Promise(resolve => {
            window.setTimeout(() => {
                resolve();
            }, BLESendInterval);
        });
    }

    setDoubleServoCommand(args) {
        const pinNumber1 = Cast.toNumber(args.DIGITAL_PINS);
        const pinNumber2 = Cast.toNumber(args.DIGITAL_PINS_2);
        const rotation = Cast.toNumber(args.DEGREES_ROTATION);

        DEVICE.setServoMotor(pinNumber1, rotation);
        DEVICE.setServoMotor(pinNumber2, -rotation);

        return new Promise(resolve => {
            window.setTimeout(() => {
                resolve();
            }, BLESendInterval);
        });
    }

    setDoubleServoStopCommand(args) {
        const pinNumber1 = Cast.toNumber(args.DIGITAL_PINS);
        const pinNumber2 = Cast.toNumber(args.DIGITAL_PINS_2);

        DEVICE.stopServoMotor(pinNumber1);
        DEVICE.stopServoMotor(pinNumber2);

        return new Promise(resolve => {
            window.setTimeout(() => {
                resolve();
            }, BLESendInterval);
        });
    }

    setServoStopCommand(args) {
        const pinNumber = Cast.toNumber(args.DIGITAL_PINS);

        DEVICE.stopServoMotor(pinNumber);

        return new Promise(resolve => {
            window.setTimeout(() => {
                resolve();
            }, BLESendInterval);
        });
    }
}

module.exports = {
    IncludeRobot,
    Scratch3Arduino,
}
