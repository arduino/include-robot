#ifndef Robot_h
#define Robot_h

// include the Arduino standard functions and definitions(like digitalWrite(), OUTPUT)
#include <Arduino.h>
#include <Servo.h>

class Robot {
private:
  Servo rightWheel;
  Servo leftWheel;

public:
  // this is the constructor of the class
  Robot(int rightWheelPin, int leftWheelPin);
  void moveForward(int steps);
  void moveBackward(int steps);
  void turnRight();
  void turnLeft();
};
#endif
