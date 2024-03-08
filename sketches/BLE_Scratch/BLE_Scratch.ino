// BLE Scratch v3 / Connect BLE Sense boards to Scratch via Bluetooth
// 2023.03.04 Added support for BLE Sense R2 and STOPSERVO command


// Uncomment one of these defines to select which board you are using

//#define ARDUINO_NANO_BLE_SENSE
//#define ARDUINO_NANO_BLE
#define ARDUINO_NANO_BLE_SENSE_R2

// when this is defined the board will print debug messages on serial
// #define DEBUG


#if defined(ARDUINO_NANO_BLE_SENSE)
#include <Arduino_APDS9960.h>
#include <Arduino_HTS221.h>
#include <Arduino_LPS22HB.h>
#include <Arduino_LSM9DS1.h>
#endif

#if defined(ARDUINO_NANO_BLE_SENSE_R2)
#include <Arduino_APDS9960.h>
#include <Arduino_HS300x.h>
#include <Arduino_LPS22HB.h>
#include <Arduino_BMI270_BMM150.h>
#endif

#if defined(ARDUINO_NANO_BLE)
#include <Arduino_LSM9DS1.h>
#endif

#include "robot.h"
#include <Servo.h>
#include <ArduinoBLE.h>

#define BLE_SENSE_UUID(val) ("6fbe1da7-" val "-44de-92c4-bb6e04fb0212")

const int VERSION = 0x00000000;
const uint8_t HEADER[] = { 0x8a, 0x48, 0x92, 0xdf, 0xaa, 0x69, 0x5c, 0x41 };
const uint8_t MAGIC = 0x7F;
const uint32_t MEMORY_SIZE = 0x80000;  // 512KB

// TODO: the pin of the wheels could be obtained during the setup
const int ROBOT_LEFT_WHEEL = 3;
const int ROBOT_RIGHT_WHEEL = 4;

Robot myra = Robot(ROBOT_RIGHT_WHEEL, ROBOT_LEFT_WHEEL);

BLEService service(BLE_SENSE_UUID("0000"));
BLEUnsignedIntCharacteristic versionCharacteristic(BLE_SENSE_UUID("1001"), BLERead);

BLECharacteristic sensorsData(BLE_SENSE_UUID("1010"), BLENotify, 16 * sizeof(float));                     // first element it's type and data
BLECharacteristic rgbLedCharacteristic(BLE_SENSE_UUID("6001"), BLEWrite, 3 * sizeof(byte));               // Array of 3 bytes, RGB
BLECharacteristic pinActionCharacteristic(BLE_SENSE_UUID("6002"), BLERead | BLEWrite, 4 * sizeof(byte));  // Array of 3 bytes, action + pinNumber + data
BLECharacteristic pinRobotCharacteristic(BLE_SENSE_UUID("6003"), BLEWrite, 3 * sizeof(byte));             // Array of 3 bytes, 1 byte action + 2 bytes for data

// String to calculate the local and device name
String name;

// delay beafore each sensor getter
int delayTime = 10;

// Sensor data
int red = 0, green = 0, blue = 0, ambientLight = 0;
int proximity = 255;

void printSerialMsg(const char *msg) {
  if (Serial) {
    Serial.println(msg);
  }
}

uint32_t get_config_bytes(uint8_t *buff, const uint32_t n) {
  auto search_in_mem = [](const uint32_t start, const uint32_t end, const uint8_t *buff, const int size) -> int32_t {
    if (start >= end || size <= 0) {
      return -1;
    }

    for (int i = start; i <= end - size; i++) {
      if (memcmp(reinterpret_cast<const void *>(i), buff, size) == 0) {
        return i;
      }
    }

    return -1;
  };

  uint32_t addr = 0;

  while (1) {
    auto found = search_in_mem(addr, MEMORY_SIZE, HEADER, sizeof(HEADER));
    if (found == -1) {
      printSerialMsg("config header not found");
      return 0;
    }
    printSerialMsg("config header founded");

    uint8_t magic = *reinterpret_cast<uint8_t *>(found + sizeof(HEADER));
    if (magic == MAGIC) {
      printSerialMsg("config magic number founded");

      uint8_t size = *reinterpret_cast<uint8_t *>(found + sizeof(HEADER) + 1);
      memcpy(buff, reinterpret_cast<void *>(found + sizeof(HEADER) + 2), min(size, n));

      return size;
    }

    addr = found + sizeof(HEADER);
  }

  return 0;
}



void setup() {
  Serial.begin(9600);
#ifdef DEBUG
  while (!Serial)
    ;
  Serial.println("Started");
#endif

#if defined(ARDUINO_NANO_BLE_SENSE)
  if (!APDS.begin()) {
    printSerialMsg("Failed to initialized APDS!");

    while (1)
      ;
  }

  if (!HTS.begin()) {
    printSerialMsg("Failed to initialized HTS!");

    while (1)
      ;
  }

  if (!BARO.begin()) {
    printSerialMsg("Failed to initialized BARO!");

    while (1)
      ;
  }
#endif

#if defined(ARDUINO_NANO_BLE_SENSE_R2)
  if (!APDS.begin()) {
    printSerialMsg("Failed to initialized APDS!");

    while (1)
      ;
  }

  if (!HS300x.begin()) {
    printSerialMsg("Failed to initialized HTS!");

    while (1)
      ;
  }

  if (!BARO.begin()) {
    printSerialMsg("Failed to initialized BARO!");

    while (1)
      ;
  }
#endif



  // All 3 variants have an IMU on it
  if (!IMU.begin()) {
    printSerialMsg("Failed to initialized IMU!");

    while (1)
      ;
  }

  // get binary leading config and interpret as string
  uint8_t cfg[100];
  auto n = get_config_bytes(cfg, 100);
  String userName(cfg, n);

  if (!BLE.begin()) {
    printSerialMsg("Failed to initialized BLE!");

    while (1)
      ;
  }

  String address = BLE.address();
  if (Serial) {
    Serial.print("address = ");
    Serial.println(address);
  }
  address.toUpperCase();

  name = "BLESense-";
  if (userName != "") {
    name += userName;
  } else {
    name += address[address.length() - 5];
    name += address[address.length() - 4];
    name += address[address.length() - 2];
    name += address[address.length() - 1];
  }

  if (Serial) {
    Serial.print("name = ");
    Serial.println(name);
  }

  BLE.setLocalName(name.c_str());
  BLE.setDeviceName(name.c_str());
  BLE.setAdvertisedService(service);

  service.addCharacteristic(versionCharacteristic);
  service.addCharacteristic(sensorsData);
  service.addCharacteristic(rgbLedCharacteristic);
  service.addCharacteristic(pinActionCharacteristic);
  service.addCharacteristic(pinRobotCharacteristic);

  versionCharacteristic.setValue(VERSION);
  rgbLedCharacteristic.setEventHandler(BLEWritten, onRgbLedCharacteristicWrite);
  pinActionCharacteristic.setEventHandler(BLEWritten, onPinActionCharacteristicWrite);
  pinRobotCharacteristic.setEventHandler(BLEWritten, onRobotActionCharacteristicWrite);

  BLE.addService(service);

  BLE.advertise();

  digitalWrite(LED_BUILTIN, HIGH);
}

enum bleNotification {
  NOTIFY_FIRST_PART = 0,
  NOTIFY_SECOND_PART = 1,
};

enum bleNotification notificationState = NOTIFY_FIRST_PART;

void loop() {
  while (BLE.connected()) {
    if (sensorsData.subscribed()) {

      switch (notificationState) {
        case NOTIFY_FIRST_PART:
          sendFirstPartData();
          notificationState = NOTIFY_SECOND_PART;
          break;

        case NOTIFY_SECOND_PART:
          sendSecondPartData();
          notificationState = NOTIFY_FIRST_PART;
          break;

        default:
          notificationState = NOTIFY_FIRST_PART;
      }
    }
  }
}



void sendFirstPartData() {


#if defined(ARDUINO_NANO_BLE_SENSE)
  /*
     BARO sensor
  */
  float pressure = BARO.readPressure();
  delay(delayTime);

  /*
     HTS sensor
  */
  float temperature = HTS.readTemperature();
  delay(delayTime);

  float humidity = HTS.readHumidity();
  delay(delayTime);

#elif defined(ARDUINO_NANO_BLE_SENSE_R2)
  /*
     BARO sensor
  */
  float pressure = BARO.readPressure();
  delay(delayTime);

  /*
     HTS sensor
  */
  float temperature = HS300x.readTemperature();
  delay(delayTime);

  float humidity = HS300x.readHumidity();
  delay(delayTime);

#else
  float pressure = 0;
  float temperature = 0;
  float humidity = 0;
#endif

  /*
     IMU sensor
  */
  float accelerationX = 0, accelerationY = 0, accelerationZ = 0;
  if (IMU.accelerationAvailable()) {
    IMU.readAcceleration(accelerationX, accelerationY, accelerationZ);
  }
  delay(delayTime);

  float gyroscopeX = 0, gyroscopeY = 0, gyroscopeZ = 0;
  if (IMU.gyroscopeAvailable()) {
    IMU.readGyroscope(gyroscopeX, gyroscopeY, gyroscopeZ);
  }
  delay(delayTime);

  float magneticFieldX = 0, magneticFieldY = 0, magneticFieldZ = 0;
  if (IMU.magneticFieldAvailable()) {
    IMU.readMagneticField(magneticFieldX, magneticFieldY, magneticFieldZ);
  }
  delay(delayTime);

  float data[16] = {
    (float)notificationState,
    temperature,
    humidity,
    pressure,

    accelerationX,
    accelerationY,
    accelerationZ,

    gyroscopeX,
    gyroscopeY,
    gyroscopeZ,

    magneticFieldX,
    magneticFieldY,
    magneticFieldZ,
    0,
    0,
    0
  };

  sensorsData.writeValue(data, sizeof(data));
  // wait a bit before reading again
  delay(delayTime);
}

void sendSecondPartData() {
  int gesture = -1;
#if defined(ARDUINO_NANO_BLE_SENSE) || defined(ARDUINO_NANO_BLE_SENSE_R2)
  /*
     APDS sensor
  */
  // check if a color reading is available
  if (APDS.colorAvailable()) {
    // read the color
    APDS.readColor(red, green, blue, ambientLight);
  }
  delay(delayTime);

  // check if a proximity reading is available
  if (APDS.proximityAvailable()) {
    proximity = APDS.readProximity();
  }
  delay(delayTime);


  // check if a proximity reading is available
  if (APDS.gestureAvailable()) {
    gesture = APDS.readGesture();
  }
  delay(delayTime);
#else
  red = 0;
  green = 0;
  blue = 0;
  ambientLight = 0;
  proximity = 0;
  gesture = 0;
#endif


  float data[16] = {
    (float)notificationState,

    (float)gesture,

    (float)red,
    (float)green,
    (float)blue,
    (float)ambientLight,

    (float)proximity,

    (float)analogRead(0),
    (float)analogRead(1),
    (float)analogRead(2),
    (float)analogRead(3),
    (float)analogRead(4),
    (float)analogRead(5),
    (float)analogRead(6),
    (float)analogRead(7),
    0
  };

  sensorsData.writeValue(data, sizeof(data));
  // wait a bit before reading again
  delay(delayTime);
}

enum pinAction {
  PINMODE = 0,
  DIGITALWRITE = 1,
  DIGITALREAD = 2,
  ANALOGREAD = 3,
  ANALOGWRITE = 4,
  SERVOWRITE = 5,
  SERVOWRITE_AND_INITIALIZE = 6,
  SERVOSTOP = 7,
};

static const int SERVO = 0x4;

typedef struct WrapServo {
  Servo s;
  WrapServo *next = NULL;
  int pin;
};

WrapServo *root = NULL;

void onPinActionCharacteristicWrite(BLEDevice central, BLECharacteristic characteristic) {
  enum pinAction action = (enum pinAction)pinActionCharacteristic[0];
  uint8_t pinNumber = pinActionCharacteristic[1];
  uint8_t pinValue = pinActionCharacteristic[2];

  uint8_t response[4] = { 0xFF, pinNumber, 0xFF, 0xFF };
  uint16_t value;
  WrapServo *n, *nxt;

  switch (action) {
    case PINMODE:
      if (pinValue == SERVO) {
        n = new WrapServo();
        n->s.attach(pinNumber);
        n->pin = pinNumber;
        if (root == NULL) {
          root = n;
        } else {
          nxt = root;
          while (nxt->next != NULL) {
            nxt = nxt->next;
          }
          nxt->next = n;
        }
      } else {
        pinMode(pinNumber, pinValue);
      }
      break;
    case DIGITALWRITE:
      digitalWrite(pinNumber, pinValue);
      break;
    case DIGITALREAD:
      response[0] = action;
      response[2] = digitalRead(pinNumber);
      break;
    case ANALOGREAD:
      response[0] = action;
      value = analogRead(pinNumber);
      response[2] = value & 0xFF;
      response[3] = (value & 0xFF00) >> 8;
      break;
    case ANALOGWRITE:
      analogWrite(pinNumber, pinValue);
      break;
    case SERVOWRITE:
      // find servo
      n = root;
      while (n != NULL) {
        if (n->pin == pinNumber) {
          break;
        }
        n = n->next;
      }
      if (n != NULL) {
        n->s.write(pinValue);
      }
      break;
    case SERVOWRITE_AND_INITIALIZE:
      // find servo
      n = root;
      while (n != NULL) {
        if (n->pin == pinNumber) {
          break;
        }
        n = n->next;
      }
      if (n == NULL) {
        n = new WrapServo();
        n->s.attach(pinNumber);
        n->pin = pinNumber;
        if (root == NULL) {
          root = n;
        } else {
          nxt = root;
          while (nxt->next != NULL) {
            nxt = nxt->next;
          }
          nxt->next = n;
        }
      }
      n->s.write(pinValue);
      break;
    case SERVOSTOP:
      // find servo
      n = root;
      WrapServo *prev = NULL;
      while (n != NULL) {
        if (n->pin == pinNumber) {
          break;
        }
        prev = n;
        n = n->next;
      }
      if (n != NULL) {
        n->s.detach();
        pinMode(pinNumber, INPUT);

        if (prev == NULL) {
          root = n->next;
        } else {
          prev->next = n->next;
        }
        delete n;
      }
      break;
  }
  if (response[0] != 0xFF) {
    response[1] = pinNumber;
    pinActionCharacteristic.writeValue(response, sizeof(response));
  }
}

void onRgbLedCharacteristicWrite(BLEDevice central, BLECharacteristic characteristic) {
  byte r = rgbLedCharacteristic[0];
  byte g = rgbLedCharacteristic[1];
  byte b = rgbLedCharacteristic[2];

  setLedPinValue(LEDR, r);
  setLedPinValue(LEDG, g);
  setLedPinValue(LEDB, b);
}

void setLedPinValue(int pin, int value) {
  // RGB LED's are pulled up, so the PWM needs to be inverted

  if (value == 0) {
    // special hack to clear LED
    analogWrite(pin, 256);
  } else {
    analogWrite(pin, 255 - value);
  }
}

enum robotAction {
  MOVE_FORWARD_STEP = 0,
  MOVE_BACKWARD_STEP = 1,
  TURN_RIGHT = 2,
  TURN_LEFT = 3,
  SET_SPEED = 4,
  MOVE_FORWARD_TIME = 5,
  MOVE_BACKWARD_TIME = 6,
};

void onRobotActionCharacteristicWrite(BLEDevice central, BLECharacteristic characteristic) {
  robotAction action = static_cast<robotAction>(pinRobotCharacteristic[0]);
  uint8_t arg1 = pinRobotCharacteristic[1];
  if (Serial) {
    Serial.print("action=");
    Serial.println(action);
    Serial.print("arg1=");
    Serial.println(arg1);
  }

  switch (action) {
    case robotAction::MOVE_FORWARD_STEP:
      myra.moveForward(arg1, 1000);
      break;
    case robotAction::MOVE_BACKWARD_STEP:
      myra.moveBackward(arg1, 1000);
      break;
    case robotAction::TURN_LEFT:
      {
        uint16_t arg2 = static_cast<uint16_t>(pinRobotCharacteristic[2]);
        uint16_t ms = static_cast<uint16_t>(arg1) << 8 | arg2;
        myra.turnLeft(ms);
        break;
      }
    case robotAction::TURN_RIGHT:
      {
        uint16_t arg2 = static_cast<uint16_t>(pinRobotCharacteristic[2]);
        uint16_t ms = static_cast<uint16_t>(arg1) << 8 | arg2;
        myra.turnRight(ms);
        break;
      }
    case robotAction::SET_SPEED:
      myra.setSpeed(arg1);
      break;
    case robotAction::MOVE_FORWARD_TIME:
      {
        uint16_t arg2 = static_cast<uint16_t>(pinRobotCharacteristic[2]);
        uint16_t ms = static_cast<uint16_t>(arg1) << 8 | arg2;
        myra.moveForward(1, ms);
        break;
      }
    case robotAction::MOVE_BACKWARD_TIME:
      {
        uint16_t arg2 = static_cast<uint16_t>(pinRobotCharacteristic[2]);
        uint16_t ms = static_cast<uint16_t>(arg1) << 8 | arg2;
        myra.moveBackward(1, ms);
        break;
      }
  }
}
