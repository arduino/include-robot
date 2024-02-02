#include "robot.h"
#include <Servo.h>

// define the constructor of the Flasher class
Robot::Robot(int rightWheelPin, int leftWheelPin) {
  rightWheel = Servo();
  leftWheel = Servo();
  rightWheel.attach(rightWheelPin);
  leftWheel.attach(leftWheelPin);
}

// define the concrete update method of the class
void Robot::moveForward(int steps) {
  // TODO: use millis() instead of delay
  // for loop on steps
  rightWheel.write(100);
  leftWheel.write(80);
  delay(1000);
  rightWheel.write(90);
  leftWheel.write(90);
  delay(500);
}

void Robot::moveBackward(int steps) {
  // TODO: use millis() instead of delay
  // for loop on steps
  rightWheel.write(80);
  leftWheel.write(100);
  delay(1000);
  rightWheel.write(90);
  leftWheel.write(90);
  delay(500);
}


void Robot::turnRight() {
    rightWheel.write(45);
    leftWheel.write(-135);
    delay(500);
    rightWheel.write(90);
    leftWheel.write(90);
    delay(500);
}

void Robot::turnLeft() {
    rightWheel.write(-135);
    leftWheel.write(45);
    delay(500);
    rightWheel.write(90);
    leftWheel.write(90);
    delay(500);
}
