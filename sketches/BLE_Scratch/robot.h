#pragma once

#include <Arduino.h>
#include <Servo.h>

class Robot {
private:
  Servo rightWheel;
  Servo leftWheel;
  int speed;

public:
  Robot(int rightWheelPin, int leftWheelPin);
  void setSpeed(const int speed);  
  void moveForward(const int steps);
  void moveBackward(const int steps);
  void turnRight();
  void turnLeft();

};
