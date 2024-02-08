#ifndef Robot_h
#define Robot_h

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
  // this is the constructor of the class
  Robot(int rightWheelPin, int leftWheelPin);
  void moveForward(int steps);
  void moveBackward(int steps);
  void turnRight();
  void turnLeft();
};
#endif
