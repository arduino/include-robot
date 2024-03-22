#pragma once

#include <Arduino.h>
#include <Servo.h>

class Robot {
  Servo rightWheel;
  Servo leftWheel;
  int speed;

public:
  Robot() {}  // Empty constructor
  Robot(int rightWheelPin, int leftWheelPin) {
    this->rightWheel = Servo();
    this->leftWheel = Servo();
    this->rightWheel.attach(rightWheelPin);
    this->leftWheel.attach(leftWheelPin);
    this->setSpeed(10);
  }

  void setSpeed(const int steps);
  void moveForward(const int steps, const uint16_t for_ms);
  void moveBackward(const int steps, const uint16_t for_ms);
  void turnRight(const uint16_t for_ms);
  void turnLeft(const uint16_t for_ms);
};
