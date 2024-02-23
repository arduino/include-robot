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
  void setSpeed(const int steps);
  void moveForward(const int steps, const int step_duration_seconds);
  void moveBackward(const int steps, const int step_duration_seconds);
  void turnRight(const int for_ms);
  void turnLeft(const int for_ms);
};
