// Firmware to connect an Arduino Nano 33 BLE / BLE Sense to the experimental
// version of scratch hosted on https://labs.arduino.cc
//
// v2 mbanzi added the ability to work also on regular Nano 33 BLE
//
// configuration: define or undefine BLE_SENSE depending on the board you're using


#include <Arduino_JSON.h>

#include <arm_math.h>

#include <Arduino_APDS9960.h>
#include <Arduino_HTS221.h>
#include <Arduino_LPS22HB.h>
#include <Arduino_LSM9DS1.h>
#include <Servo.h>

// define if we're using BLE SENSE or regular BLE
//#define BLE_SENSE



// delay beafore each sensor getter
int delayTime = 10;

// delay for USB Serial
int delayTimeForSending = 25;

// Sensor data
int red = 0, green = 0, blue = 0, ambientLight = 0;
int proximity = 255;

/**
   Main Setup of board server
*/
void setup() {
  SerialUSB.begin(9600);
  while (!SerialUSB)
    ;

#ifdef BLE_SENSE
  if (!APDS.begin()) {
    sendError("Failled to initialized APDS!");
    while (1)
      ;
  }

  if (!HTS.begin()) {
    sendError("Failled to initialized HTS!");
    while (1)
      ;
  }

  if (!BARO.begin()) {
    sendError("Failled to initialized BARO!");
    while (1)
      ;
  }
#endif

  if (!IMU.begin()) {
    sendError("Failled to initialized IMU!");
    while (1)
      ;
  }
}

/**
   Main loop of board server
*/
void loop() {
  while (SerialUSB) {
    digitalWrite(LED_BUILTIN, HIGH);

    if (SerialUSB.available()) {
      String s = getCompleteJsonString();
      readCommand(s);
      SerialUSB.flush();
    }

    sendSensorsData();
    sendAnalogPins();
  }
  digitalWrite(LED_BUILTIN, LOW);
}


/**
   Functions
*/
void sendError(const char* input) {
  JSONVar jsonObject;
  jsonObject["error"] = input;
  jsonObject["type"] = "error";
  SerialUSB.println(jsonObject);
}

String getCompleteJsonString() {
  String s = "";
  uint32_t start = millis();
  while (1) {
    if (SerialUSB.available()) {
      char c = SerialUSB.read();
      s += c;
      if (c == '\n' || c == '\r') {
        break;
      }
    }
    if (millis() - start > 1000) {
      break;
    }
  }
  return s;
}

/**
   Execute command(cmd)
*/
void readCommand(String str) {
  //send back what we got
  SerialUSB.println(str);

  JSONVar myObject = JSON.parse(str.c_str());

  if (JSON.typeof(myObject) == "undefined") {
    sendError("Parsing command failed!");
    return;
  }

  if (myObject.hasOwnProperty("cmd")) {
    String command = String((const char*)myObject["cmd"]);

    if (command == "ledColor") {
      setLedColor(myObject);
      return;
    }
    if (command == "pinAction") {
      doPinAction(myObject);
      return;
    }
  }

  // wait a bit before reading again
  delay(delayTime);
}

//{"cmd":"ledColor","data":{"red":255,"green":255,"blue":255}}
void setLedColor(JSONVar& json) {
  JSONVar jsonData = json["data"];

  if (JSON.typeof(jsonData) != "object") {
    sendError("Led color data is not object!");
    return;
  }

  byte red = (byte)(int)jsonData["red"];
  byte green = (byte)(int)jsonData["green"];
  byte blue = (byte)(int)jsonData["blue"];

  setLedPinValue(LEDR, red);
  setLedPinValue(LEDG, green);
  setLedPinValue(LEDB, blue);
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

//{"cmd":"pinAction","data":{"action":1, "pin":12, "value":3}}
void doPinAction(JSONVar& json) {

  JSONVar jsonData = json["data"];

  if (JSON.typeof(jsonData) != "object") {
    sendError("Pin action data is not object!");
    return;
  }

  enum pinAction action = (enum pinAction)(int)jsonData["action"];
  uint8_t pinNumber = (uint8_t)(int)jsonData["pin"];
  uint8_t pinValue = (uint8_t)(int)jsonData["value"];

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
      jsonData["value"] = digitalRead(pinNumber);
      break;
    case ANALOGREAD:
      jsonData["value"] = analogRead(pinNumber);
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
}

/**
  send JSON via USB Serial
*/
void sendJSON(JSONVar& json) {
  SerialUSB.println(json);
  SerialUSB.flush();

  // wait after sending
  delay(delayTimeForSending);
}
/**
  send sensor data via JSON
*/
void sendData(const char* type, int& value) {
  JSONVar jsonObject;
  jsonObject["type"] = type;
  jsonObject["value"] = value;

  sendJSON(jsonObject);
}
void sendData(const char* type, float& value) {
  JSONVar jsonObject;
  jsonObject["type"] = type;
  jsonObject["value"] = value;

  sendJSON(jsonObject);
}
void sendData(const char* type, JSONVar& jsonData) {
  JSONVar jsonObject;
  jsonObject["type"] = type;
  jsonObject["value"] = jsonData;

  sendJSON(jsonObject);
}

/**
  Send analog pins value
*/
void sendAnalogPins() {
  int value = analogRead(0);
  sendData("pinA0", value);

  value = analogRead(1);
  sendData("pinA1", value);

  value = analogRead(2);
  sendData("pinA2", value);

  value = analogRead(3);
  sendData("pinA3", value);

  value = analogRead(4);
  sendData("pinA4", value);

  value = analogRead(5);
  sendData("pinA5", value);

  value = analogRead(6);
  sendData("pinA6", value);

  value = analogRead(7);
  sendData("pinA7", value);
}

/**
   Send sensor data
*/
void sendSensorsData() {
  JSONVar jsonData;

  // read pressure
  getPressure();

  // read temperature
  getTemperature();

  // read humidity
  getHumidity();

  // read acceleration
  getAcceleration();

  // read gyroscope
  getGyroscope();

  // magnetic field
  getMagneticField();

  // read color sensor data
  getColorData();

  // read proximity
  getProximity();

  // read gesture
  getGesture();

  // wait a bit before reading again
  delay(delayTime);
}

void getPressure() {
#ifdef BLE_SENSE
  float pressure = BARO.readPressure();
#else
  float pressure = 0.0;
#endif
  sendData("pressure", pressure);
}

void getTemperature() {
#ifdef BLE_SENSE
  float temperature = HTS.readTemperature();
#else
  float temperature = 0.0;
#endif
  sendData("temperature", temperature);
}

void getHumidity() {
#ifdef BLE_SENSE
  float humidity = HTS.readHumidity();
#else
  float humidity = 0.0;
#endif
  sendData("humidity", humidity);
}

void getAcceleration() {
  float accelerationX = 0, accelerationY = 0, accelerationZ = 0;
  if (IMU.accelerationAvailable()) {
    IMU.readAcceleration(accelerationX, accelerationY, accelerationZ);
  }

  JSONVar jsonAcceleration;
  jsonAcceleration["x"] = accelerationX;
  jsonAcceleration["y"] = accelerationY;
  jsonAcceleration["z"] = accelerationZ;

  sendData("acceleration", jsonAcceleration);
}


void getGyroscope() {
  float gyroscopeX = 0, gyroscopeY = 0, gyroscopeZ = 0;
  if (IMU.gyroscopeAvailable()) {
    IMU.readGyroscope(gyroscopeX, gyroscopeY, gyroscopeZ);
  }

  JSONVar jsonGyroscope;
  jsonGyroscope["x"] = gyroscopeX;
  jsonGyroscope["y"] = gyroscopeY;
  jsonGyroscope["z"] = gyroscopeZ;

  sendData("gyroscope", jsonGyroscope);
}

void getMagneticField() {
  float magneticFieldX = 0, magneticFieldY = 0, magneticFieldZ = 0;
  if (IMU.magneticFieldAvailable()) {
    IMU.readMagneticField(magneticFieldX, magneticFieldY, magneticFieldZ);
  }

  JSONVar jsonMagneticField;
  jsonMagneticField["x"] = magneticFieldX;
  jsonMagneticField["y"] = magneticFieldY;
  jsonMagneticField["z"] = magneticFieldZ;

  sendData("magneticField", jsonMagneticField);
}


void getColorData() {
#ifdef BLE_SENSE
  if (APDS.colorAvailable()) {
    // read the color
    APDS.readColor(red, green, blue, ambientLight);
  }
#else
  red = 0;
  green = 0;
  blue = 0;
  ambientLight = 0;
#endif
  JSONVar jsonColorData;
  jsonColorData["red"] = red;
  jsonColorData["green"] = green;
  jsonColorData["blue"] = blue;

  sendData("color", jsonColorData);
  sendData("ambientLight", ambientLight);
}

void getProximity() {
#ifdef BLE_SENSE
  if (APDS.proximityAvailable()) {
    proximity = APDS.readProximity();
  }
#else
  proximity = 0;
#endif
  sendData("proximity", proximity);
}

void getGesture() {
  int gesture = -1;
#ifdef BLE_SENSE
  // check if a proximity reading is available
  if (APDS.gestureAvailable()) {
    gesture = APDS.readGesture();
  }
#endif
  sendData("gesture", gesture);
}
