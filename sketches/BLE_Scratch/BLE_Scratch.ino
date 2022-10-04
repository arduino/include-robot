#include <arm_math.h>

#include <Arduino_APDS9960.h>
#include <Arduino_HTS221.h>
#include <Arduino_LPS22HB.h>
#include <Arduino_LSM9DS1.h>
#include <Servo.h>
#define DEBUG
#include <ArduinoBLE.h>

#define BLE_SENSE_UUID(val) ("6fbe1da7-" val "-44de-92c4-bb6e04fb0212")

const int VERSION = 0x00000000;

BLEService                     service                       (BLE_SENSE_UUID("0000"));
BLEUnsignedIntCharacteristic   versionCharacteristic         (BLE_SENSE_UUID("1001"), BLERead);

BLECharacteristic              sensorsData                   (BLE_SENSE_UUID("1010"), BLENotify, 16 * sizeof(float)); // first element it's type and data
BLECharacteristic              rgbLedCharacteristic          (BLE_SENSE_UUID("6001"), BLEWrite, 3 * sizeof(byte)); // Array of 3 bytes, RGB
BLECharacteristic              pinActionCharacteristic       (BLE_SENSE_UUID("6002"), BLERead | BLEWrite, 4 * sizeof(byte)); // Array of 3 bytes, action + pinNumber + data

// String to calculate the local and device name
String name;

// delay beafore each sensor getter
int delayTime = 10;

// Sensor data
int red = 0, green = 0, blue = 0, ambientLight = 0;
int proximity = 255;

void printSerialMsg(const char * msg) {
  if (Serial) {
    Serial.println(msg);
  }
}

void setup() {
  Serial.begin(9600);
#ifdef DEBUG
  while (!Serial);
  Serial.println("Started");
#endif

  if (!APDS.begin()) {
    printSerialMsg("Failled to initialized APDS!");
    while (1);
  }

  if (!HTS.begin()) {
    printSerialMsg("Failled to initialized HTS!");

    while (1);
  }

  if (!BARO.begin()) {
    printSerialMsg("Failled to initialized BARO!");

    while (1);
  }

  if (!IMU.begin()) {
    printSerialMsg("Failled to initialized IMU!");

    while (1);
  }

  if (!BLE.begin()) {
    printSerialMsg("Failled to initialized BLE!");

    while (1);
  }

  String address = BLE.address();
  if (Serial) {
    Serial.print("address = ");
    Serial.println(address);
  }
  address.toUpperCase();

  name = "BLESense-";
  name += address[address.length() - 5];
  name += address[address.length() - 4];
  name += address[address.length() - 2];
  name += address[address.length() - 1];

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

  versionCharacteristic.setValue(VERSION);
  rgbLedCharacteristic.setEventHandler(BLEWritten, onRgbLedCharacteristicWrite);
  pinActionCharacteristic.setEventHandler(BLEWritten, onPinActionCharacteristicWrite);

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

      switch(notificationState) {
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

  /*
     IMU sensor
  */
  float accelerationX = 0, accelerationY = 0, accelerationZ = 0;
  if (IMU.accelerationAvailable()) {
    IMU.readAcceleration(accelerationX, accelerationY, accelerationZ);
  }
  delay(delayTime);

  float gyroscopeX = 0, gyroscopeY = 0, gyroscopeZ = 0 ;
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

  int gesture = -1;
  // check if a proximity reading is available
  if (APDS.gestureAvailable()) {
    gesture = APDS.readGesture();
  }
  delay(delayTime);

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
};

static const int SERVO = 0x4;

typedef struct WrapServo {
  Servo s;
  WrapServo* next = NULL;
  int pin;
};

WrapServo* root = NULL;

void onPinActionCharacteristicWrite(BLEDevice central, BLECharacteristic characteristic) {
  enum pinAction action = (enum pinAction)pinActionCharacteristic[0];
  uint8_t pinNumber = pinActionCharacteristic[1];
  uint8_t pinValue = pinActionCharacteristic[2];

  uint8_t response[4] = {0xFF, pinNumber, 0xFF, 0xFF};
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
