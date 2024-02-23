#include "robot.h"
#include <Servo.h>


void Robot::moveForward(const int steps, const uint16_t for_ms) {
  for (int i = 0; i < steps; i++) {
    this->rightWheel.write(90 + this->speed);
    this->leftWheel.write(90 - this->speed);
    delay(for_ms);
    this->rightWheel.write(90);
    this->leftWheel.write(90);
    delay(500);
  }
}

void Robot::moveBackward(const int steps, const uint16_t for_ms) {
  for (int i = 0; i < steps; i++) {
    this->rightWheel.write(90 - this->speed);
    this->leftWheel.write(90 + this->speed);
    delay(for_ms);
    this->rightWheel.write(90);
    this->leftWheel.write(90);
    delay(500);
  }
}

void Robot::turnRight(const uint16_t for_ms) {
  this->rightWheel.write(90 + 10);
  this->leftWheel.write(90 + 10);
  delay(for_ms);
  this->rightWheel.write(90);
  this->leftWheel.write(90);
}

void Robot::turnLeft(const uint16_t for_ms) {
  this->rightWheel.write(90 - 10);
  this->leftWheel.write(90 - 10);
  delay(for_ms);
  this->rightWheel.write(90);
  this->leftWheel.write(90);
}

// set the speed of the robot. From 0 (no speed) to 100 (max speed)
void Robot::setSpeed(int speed) {
  speed = constrain(speed, 0, 100);
  speed = map(speed, 0, 100, 0, 90);
  this->speed = speed;
}
