#include "robot.h"
#include <Servo.h>

Robot::Robot(int rightWheelPin, int leftWheelPin) {
  this->rightWheel = Servo();
  this->leftWheel = Servo();
  this->rightWheel.attach(rightWheelPin);
  this->leftWheel.attach(leftWheelPin);
  this->setSpeed(10);
}

void Robot::moveForward(int steps) {
  for (int i = 0; i < steps; i++) {
    this->rightWheel.write(90 + this->speed);
    leftWheel.write(90 - this->speed);
    delay(1000);
    this->rightWheel.write(90);
    this->leftWheel.write(90);
    delay(500);
  }
}

void Robot::moveBackward(int steps) {
  for (int i = 0; i < steps; i++) {
    this->rightWheel.write(90 - this->speed);
    this->leftWheel.write(90 + this->speed);
    delay(1000);
    this->rightWheel.write(90);
    this->leftWheel.write(90);
    delay(500);
  }
}

void Robot::turnRight() {
    this->rightWheel.write(90 + 10);
    this->leftWheel.write(90 + 10);
    // FIXME: the delay should be correlated with the speed. Another approach is to use the compass
    delay(700);
    this->rightWheel.write(90);
    this->leftWheel.write(90);
}

void Robot::turnLeft() {
    this->rightWheel.write(90 - 10);
    this->leftWheel.write(90 - 10);
    delay(700);
    this->rightWheel.write(90);
    this->leftWheel.write(90);
}
// set the speed of the robot. From 0 (no speed) to 100 (max speed)
void Robot::setSpeed(int speed) {
    speed = constrain(speed, 0, 100);
    speed = map(speed, 0, 100, 0, 90);
    this->speed = speed;
}
