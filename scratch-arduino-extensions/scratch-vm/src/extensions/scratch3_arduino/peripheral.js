const BLE = require('../../io/ble');
const Base64Util = require('../../util/base64-util');
const {colorCorrector, roundToDecimalPlaces} = require('./utils');
const log = require('../../util/log');

/**
 * A time interval to wait (in milliseconds) before reporting to the BLE socket
 * that data has stopped coming from the peripheral.
 */
const BLETimeout = 10 * 1000; // 10 sec timeout

/**
 * A string to report to the BLE socket when the arduino has stopped receiving data.
 * @type {string}
 */
const BLEDataStoppedError = 'arduino nano 33 BLE Sense extension stopped receiving data';

/**
 * @readonly
 * @enum {string}
 */
const BLEUUID = {
    SERVICE: '6fbe1da7-0000-44de-92c4-bb6e04fb0212'
};

/**
 * A list of Nano 33 BLE Sense characteristic UUIDs.
 * @enum
 */
const BLECharacteristic = {
    SENSORS_DATA: '6fbe1da7-1010-44de-92c4-bb6e04fb0212'
};

/**
 * A list of Nano 33 BLE Sense characteristic UUIDs for write.
 * @enum
 */
const BLECommand = {
    RGB_LED: '6fbe1da7-6001-44de-92c4-bb6e04fb0212', // RGB led value, 0 => off, 255 => on
    PIN_ACTIONS: '6fbe1da7-6002-44de-92c4-bb6e04fb0212', // Array of 3 bytes, action + pinNumber + data
    ROBOT_ACTIONS: '6fbe1da7-6003-44de-92c4-bb6e04fb0212' // Array of 2 bytes, action + data
};


const BLE_PIN_ACTIONS = {
    PINMODE: 0,
    DIGITALWRITE: 1,
    ANALOGWRITE: 4,
    SERVOWRITE_AND_INITIALIZE: 6,
    SERVOSTOP: 7
};

const ROBOT_ACTIONS = {
    MOVE_FORWARD: 0,
    MOVE_BACKWARD: 1,
    TURN_RIGTH: 2,
    TURN_LEFT: 3,
    SET_SPEED: 4,
    MOVE_FORWARD_TIME: 5,
    MOVE_BACKWARD_TIME: 6,
};

/**
 * Manage communication with a Arduino peripheral over a Scrath Link client socket.
 */
class ArduinoPeripheral {
    /**
     * Construct a communication object.
     * @param {Runtime} runtime - the Scratch 3.0 runtime
     * @param {string} extensionId - the id of the extension
     */
    constructor (runtime, extensionId) {

        /**
         * The Scratch 3.0 runtime used to trigger the green flag button.
         * @type {Runtime}
         * @private
         */
        this._runtime = runtime;

        /**
         * The id of the extension this peripheral belongs to.
         */
        this._extensionId = extensionId;

        /**
         * The most recently received value for each sensor.
         * @type {Object.<string, entity>}
         * @private
         */
        this._sensors = {
            gestureState: -1,
            temperature: 0, // °C
            humidity: 0, // %
            pressure: 0,
            colorLight: { // from 0 to 255
                r: 0,
                g: 0,
                b: 0
            },
            ambientLight: 0, // Lux
            proximity: 255, // mm
            acceleration: { // g's
                x: 0,
                y: 0,
                z: 1
            },
            gyroscope: { // dps
                x: 0,
                y: 0,
                z: 0
            },
            magneticField: { // uT
                x: 0,
                y: 0,
                z: 0
            }
        };

        this._pins = {
            analog: {
                0: 0,
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0,
                6: 0,
                7: 0
            }
        };

        /**
         * The Bluetooth connection socket for reading/writing peripheral data.
         * @type {BLE}
         * @private
         */
        this._ble = null;
        this._runtime.registerPeripheralExtension(extensionId, this);

        /**
         * Interval ID for data reading timeout.
         * @type {number}
         * @private
         */
        this._timeoutID = null;

        /**
         * A flag that is true while we are busy sending data to the BLE socket.
         * @type {boolean}
         * @private
         */
        this._busy = false;

        /**
         * ID for a timeout which is used to clear the busy flag if it has been
         * true for a long time.
         */
        this._busyTimeoutID = null;

        // functions
        this.reset = this.reset.bind(this);
        this._onConnect = this._onConnect.bind(this);

        this._onMessage = this._onMessage.bind(this);
    }

    /**
     * Called by the runtime when user wants to scan for a peripheral.
     */
    scan () {
        if (this._ble) {
            this._ble.disconnect();
        }
        this._ble = new BLE(this._runtime, this._extensionId, {
            filters: [
                {services: [BLEUUID.SERVICE]}
            ]
        }, this._onConnect, this.reset);
    }

    /**
     * Called by the runtime when user wants to connect to a certain peripheral.
     * @param {number} id - the id of the peripheral to connect to.
     */
    connect (id) {
        if (this._ble) {
            this._ble.connectPeripheral(id);
        }
    }

    /**
     * Disconnect from the arduino.
     */
    disconnect () {
        if (this._ble) {
            this._ble.disconnect();
        }

        this.reset();
    }

    /**
     * Reset all the state and timeout/interval ids.
     */
    reset () {
        this._sensors = {
            gestureState: -1,
            temperature: 0, // °C
            humidity: 0, // %
            pressure: 0,
            colorLight: { // from 0 to 255
                r: 0,
                g: 0,
                b: 0
            },
            ambientLight: 0, // Lux
            proximity: 255, // mm
            acceleration: { // g's
                x: 0,
                y: 0,
                z: 1
            },
            gyroscope: { // dps
                x: 0,
                y: 0,
                z: 0
            },
            magneticField: { // uT
                x: 0,
                y: 0,
                z: 0
            }
        };

        this._pins = {
            analog: {
                0: 0,
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0,
                6: 0,
                7: 0
            }
        };

        if (this._timeoutID) {
            window.clearTimeout(this._timeoutID);
            this._timeoutID = null;
        }
    }

    /**
     * Called by the runtime to detect whether the WeDo 2.0 peripheral is connected.
     * @return {boolean} - the connected state.
     */
    isConnected () {
        let connected = false;
        if (this._ble) {
            connected = this._ble.isConnected();
        }
        return connected;
    }

    /**
     * Starts reading data from peripheral after BLE has connected to it.
     * @private
     */
    _onConnect () {
        this._ble.startNotifications(BLEUUID.SERVICE, BLECharacteristic.SENSORS_DATA, this._onMessage);
        this._timeoutID = window.setTimeout(
            () => this._ble.handleDisconnectError(BLEDataStoppedError),
            BLETimeout
        );
    }

    _onMessage (base64) {
        const data = Base64Util.base64ToUint8Array(base64);
        const value = new DataView(data.buffer);

        const msgState = value.getFloat32(0, true);

        if (msgState === 0) {
            this._setTemperature(value.getFloat32(4, true));
            this._setHumidity(value.getFloat32(8, true));
            this._setPressure(value.getFloat32(12, true));

            this._setAcceleration(
                value.getFloat32(16, true),
                value.getFloat32(20, true),
                value.getFloat32(24, true)
            );

            this._setGyroscope(
                value.getFloat32(28, true),
                value.getFloat32(32, true),
                value.getFloat32(36, true)
            );

            this._setMagneticField(
                value.getFloat32(40, true),
                value.getFloat32(44, true),
                value.getFloat32(48, true)
            );
        } else if (msgState === 1) {
            this._setGestureState(value.getFloat32(4, true));
            this._setColorLight(
                value.getFloat32(8, true),
                value.getFloat32(12, true),
                value.getFloat32(16, true)
            );
            this._setAmbientLight(value.getFloat32(20, true));
            this._setProximity(value.getFloat32(24, true));

            this._setAnalogPinValue(0, value.getFloat32(28, true));
            this._setAnalogPinValue(1, value.getFloat32(32, true));
            this._setAnalogPinValue(2, value.getFloat32(36, true));
            this._setAnalogPinValue(3, value.getFloat32(40, true));
            this._setAnalogPinValue(4, value.getFloat32(44, true));
            this._setAnalogPinValue(5, value.getFloat32(48, true));
            this._setAnalogPinValue(6, value.getFloat32(52, true));
            this._setAnalogPinValue(7, value.getFloat32(56, true));
        } else {
            log.error('Arduino BLE unknown message type:', msgState);
        }

        if (window.arduinoBLEDebug && window.arduinoBLEDebug.message) {
            log.info(`Arduino BLE message: state=${msgState} sensors=${this._sensors} pins=${this._pins}`);
        }

        this._continueWork();
    }

    _continueWork () {
        window.clearTimeout(this._timeoutID);
        this._timeoutID = window.setTimeout(
            () => {
                this._ble.handleDisconnectError(BLEDataStoppedError);
            },
            BLETimeout
        );
    }

    _setAnalogPinValue (pinNumber, value) {
        this._pins.analog[pinNumber] = value;
    }

    _setGestureState (gestureData) {
        this._sensors.gestureState = gestureData;
    }

    _setTemperature (temperatureData) {
        this._sensors.temperature = roundToDecimalPlaces(temperatureData);
    }

    _setHumidity (humidityData) {
        this._sensors.humidity = roundToDecimalPlaces(humidityData);
    }

    _setPressure (pressureData) {
        this._sensors.pressure = roundToDecimalPlaces(pressureData);
    }

    _setColorLight (redData, greenData, blueData) {
        const r = colorCorrector(Math.round(redData));
        const g = colorCorrector(Math.round(greenData));
        const b = colorCorrector(Math.round(blueData));
        this._sensors.colorLight = {
            r, g, b
        };
    }

    _setAmbientLight (ambientLightData) {
        this._sensors.ambientLight = Math.round(ambientLightData);
    }

    _setProximity (proximityData) {
        this._sensors.proximity = Math.round(proximityData);
    }

    _setAcceleration (xData, yData, zData) {
        this._sensors.acceleration = {
            x: roundToDecimalPlaces(xData, 1000),
            y: roundToDecimalPlaces(yData, 1000),
            z: roundToDecimalPlaces(zData, 1000)
        };
    }

    _setGyroscope (xData, yData, zData) {
        this._sensors.gyroscope = {
            x: roundToDecimalPlaces(xData, 1000),
            y: roundToDecimalPlaces(yData, 1000),
            z: roundToDecimalPlaces(zData, 1000)
        };
    }

    _setMagneticField (xData, yData, zData) {
        this._sensors.magneticField = {
            x: roundToDecimalPlaces(xData, 1000),
            y: roundToDecimalPlaces(yData, 1000),
            z: roundToDecimalPlaces(zData, 1000)
        };
    }

    /**
     * Send a message to the peripheral BLE socket.
     * @param {number} uuid - the BLE command in UUID.
     * @param {Uint8Array} message - the message to write
     */
    _send (uuid, message) {
        if (!this.isConnected()) return;
      
        const data = Base64Util.uint8ArrayToBase64(message);

        return this._ble.write(BLEUUID.SERVICE, uuid, data, 'base64', true);
    }

    /*
     *
     * Command methods
     *
     */

    setLedColor (color) {
        const {r, g, b} = color;
        const colorArray = [
            r ? colorCorrector(r) : 0,
            g ? colorCorrector(g) : 0,
            b ? colorCorrector(b) : 0
        ];
        return this._send(BLECommand.RGB_LED, colorArray);
    }

    setDigitalMode (pinNumber, mode) {
        const pinAction = [
            BLE_PIN_ACTIONS.PINMODE,
            pinNumber,
            mode,
            0xFF
        ];

        return this._send(BLECommand.PIN_ACTIONS, pinAction);
    }

    setDigitalValue (pinNumber, value) {
        const pinAction = [
            BLE_PIN_ACTIONS.DIGITALWRITE,
            pinNumber,
            value,
            0xFF
        ];

        return this._send(BLECommand.PIN_ACTIONS, pinAction);
    }

    setAnalogValue (pinNumber, value) {
        const pinAction = [
            BLE_PIN_ACTIONS.ANALOGWRITE,
            pinNumber,
            value,
            0xFF
        ];

        return this._send(BLECommand.PIN_ACTIONS, pinAction);
    }

    setServoMotor (pinNumber, value) {
        const pinAction = [
            BLE_PIN_ACTIONS.SERVOWRITE_AND_INITIALIZE,
            pinNumber,
            value,
            0xFF
        ];

        return this._send(BLECommand.PIN_ACTIONS, pinAction);
    }

    stopServoMotor (pinNumber) {
        const pinAction = [
            BLE_PIN_ACTIONS.SERVOSTOP,
            pinNumber,
            0xFF
        ];

        return this._send(BLECommand.PIN_ACTIONS, pinAction);
    }
    moveForward(steps) {
        const robotAction = [
            ROBOT_ACTIONS.MOVE_FORWARD,
            steps
        ];
        return this._send(BLECommand.ROBOT_ACTIONS, robotAction);
    }
    moveBackward(steps) {

        const robotAction = [
            ROBOT_ACTIONS.MOVE_BACKWARD,
            steps
        ];
        return this._send(BLECommand.ROBOT_ACTIONS, robotAction);
    }
    moveForwardTime(milliseconds) {
        let [arg0, arg1] = convertUInt16ToBytes(milliseconds);
        const robotAction = [
            ROBOT_ACTIONS.MOVE_FORWARD_TIME,
            arg0,
            arg1
        ];
        return this._send(BLECommand.ROBOT_ACTIONS, robotAction);
    }

    moveBackwardTime(milliseconds) {
        let [arg0, arg1] = convertUInt16ToBytes(milliseconds);
        const robotAction = [
            ROBOT_ACTIONS.MOVE_BACKWARD_TIME,
            arg0,
            arg1
        ];
        return this._send(BLECommand.ROBOT_ACTIONS, robotAction);
    }
    turnLeft(milliseconds) {
        let [arg0, arg1] = convertUInt16ToBytes(milliseconds);
        const robotAction = [
            ROBOT_ACTIONS.TURN_LEFT,
            arg0,
            arg1
        ];
        return this._send(BLECommand.ROBOT_ACTIONS, robotAction);
    }
    turnRight(milliseconds){
        let [arg0, arg1] = convertUInt16ToBytes(milliseconds);
        const robotAction = [
            ROBOT_ACTIONS.TURN_RIGTH,
            arg0,
            arg1
        ];
        return this._send(BLECommand.ROBOT_ACTIONS, robotAction);
    }

    setSpeed(speed) {
        const robotAction = [
            ROBOT_ACTIONS.SET_SPEED,
            speed
        ];
        return this._send(BLECommand.ROBOT_ACTIONS, robotAction);
    }

    /**
     * @return {number} - the latest value received for the motion gesture states.
     */
    get gestureState () {
        return this._sensors.gestureState;
    }

    /**
     * @param {boolean} isImerial - check if need to convert to fahrenheit.
     * @return {number} - the latest value received for the temperature sensor.
     */
    getTemperature (isImerial = false) {
        if (isImerial) {
            const fahrenheit = (this._sensors.temperature * 9 / 5) + 32;
            return roundToDecimalPlaces(fahrenheit, 10);
        }
        return this._sensors.temperature;
    }

    /**
     * @return {number} - the latest value received for the humidity sensor.
     */
    get humidity () {
        return this._sensors.humidity;
    }

    /**
     * @param {boolean} isImerial - check if need to convert to imperial.
     * @return {number} - the latest value received for the pressure sensor.
     */
    getPressure (isImerial) {
        if (isImerial) {
            // 1kPa = 10 mbar
            return this._sensors.pressure * 10;
        }
        return this._sensors.pressure;
    }

    /**
     * @return {object} - the latest value received for the colorlight sensor.
     */
    get colorLight () {
        return this._sensors.colorLight;
    }

    /**
     * @return {number} - the latest value received for the ambientLight sensor.
     */
    get ambientLight () {
        return this._sensors.ambientLight;
    }

    /**
     * @return {number} - the latest value received for the proximity sensor.
     */
    get proximity () {
        return this._sensors.proximity;
    }

    /**
     * @return {object} - the latest value received for the acceleration sensor.
     */
    get acceleration () {
        return this._sensors.acceleration;
    }

    /**
     * @return {object} - the latest value received for the gyroscope sensor.
     */
    get gyroscope () {
        return this._sensors.gyroscope;
    }

    /**
     * @return {object} - the latest value received for the agneticField sensor.
     */
    get magneticField () {
        return this._sensors.magneticField;
    }

    getAnalogPinValue (pinNumber) {
        return this._pins.analog[pinNumber] || 0;
    }
}


function convertUInt16ToBytes(value) {
    // Ensure value is within the range of 16-bit unsigned integer (0-65535)
    value = Math.max(0, Math.min(0xFFFF, value));

    // Extract the two bytes
    let byte1 = (value >> 8) & 0x00FF; // Extract the higher 8 bits
    let byte2 = value & 0x00FF; // Extract the lower 8 bits

    // Return an array containing the two bytes
    return [byte1, byte2];
}


module.exports = ArduinoPeripheral;
