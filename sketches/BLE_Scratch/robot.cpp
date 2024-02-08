#include "robot.h"
#include <Servo.h>

// define the constructor of the Flasher class
Robot::Robot(int rightWheelPin, int leftWheelPin) {
  rightWheel = Servo();
  leftWheel = Servo();
  rightWheel.attach(rightWheelPin);
  leftWheel.attach(leftWheelPin);
  speed = 10;
  // used to calibrate the middle point 
  rightWheel.write(90);
  leftWheel.write(90);
}

// define the concrete update method of the class
void Robot::moveForward(int steps) {
  // TODO: use millis() instead of delay
  // for loop on steps
  rightWheel.write(90 + speed);
  leftWheel.write(90 - speed);
  delay(1000);
  rightWheel.write(90);
  leftWheel.write(90);
}

void Robot::moveBackward(int steps) {
  // TODO: use millis() instead of delay
  // for loop on steps
  rightWheel.write(90 - speed);
  leftWheel.write(90 + speed);
  delay(1000);
  rightWheel.write(90);
  leftWheel.write(90);
  }


void Robot::turnRight() {
    rightWheel.write(90 + speed);
    leftWheel.write(90 + speed);
    delay(700);
    rightWheel.write(90);
    leftWheel.write(90);
}

void Robot::turnLeft() {
    rightWheel.write(90 - speed );
    leftWheel.write(90 - speed);
    delay(700);
    rightWheel.write(90);
    leftWheel.write(90);
}
