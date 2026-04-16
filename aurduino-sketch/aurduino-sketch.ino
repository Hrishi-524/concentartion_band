int sensorPin = A0;

void setup() {
  Serial.begin(115200);
}

void loop() {
  int value = analogRead(sensorPin);
  Serial.println(value);
  delay(4);
}