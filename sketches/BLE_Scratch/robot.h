#pragma once

#include <Arduino.h>
#include <Servo.h>

class Robot {
private:
  Servo rightWheel;
  Servo leftWheel;
  int speed;
  /*
      [0,89]     => go forward (from faster to slower)
      90         => stop
      [91-180]   => go backward (from lower to faster)
     */
public:
  Robot(int rightWheelPin, int leftWheelPin);
  
  void moveForward(const int steps);
  void moveBackward(const int steps);
  void turnRight();
  void turnLeft();
  void stop();
};
