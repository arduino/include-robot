#include "robot.h"
#include <Servo.h>

Robot::Robot(int rightWheelPin, int leftWheelPin) {
  this->rightWheel = Servo();
  this->leftWheel = Servo();
  this->rightWheel.attach(rightWheelPin);
  this->leftWheel.attach(leftWheelPin);
  this->setSpeed(10);
}

void Robot::moveForward(const int steps, const int step_duration_seconds) {
  int step_duration_ms = constrain(step_duration_seconds, 0, 255);
  for (int i = 0; i < steps; i++) {
    this->rightWheel.write(90 + this->speed);
    this->leftWheel.write(90 - this->speed);
    delay(step_duration_ms * 1000);
    this->rightWheel.write(90);
    this->leftWheel.write(90);
    delay(500);
  }
}

void Robot::moveBackward(const int steps, const int step_duration_seconds) {
  int step_duration_ms = constrain(step_duration_seconds, 0, 255);
  for (int i = 0; i < steps; i++) {
    this->rightWheel.write(90 - this->speed);
    this->leftWheel.write(90 + this->speed);
    delay(step_duration_ms * 1000);
    this->rightWheel.write(90);
    this->leftWheel.write(90);
    delay(500);
  }
}

void Robot::turnRight(const int for_ms) {
    int ms = constrain(for_ms, 0, 10000);
    this->rightWheel.write(90 + 10);
    this->leftWheel.write(90 + 10);
    delay(ms);
    this->rightWheel.write(90);
    this->leftWheel.write(90);
}

void Robot::turnLeft(const int for_ms) {
    int ms = constrain(for_ms, 0, 10000); 
    this->rightWheel.write(90 - 10);
    this->leftWheel.write(90 - 10);
    delay(ms);
    this->rightWheel.write(90);
    this->leftWheel.write(90);
}

// set the speed of the robot. From 0 (no speed) to 100 (max speed)
void Robot::setSpeed(int speed) {
    speed = constrain(speed, 0, 100);
    speed = map(speed, 0, 100, 0, 90);
    this->speed = speed;
}
