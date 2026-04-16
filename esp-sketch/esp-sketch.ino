#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "Redmi Note 9 Pro";
const char* password = "hrishi1234";

// Your laptop IP (VERY IMPORTANT)
const char* serverUrl = "http://192.168.43.253:8000/eeg";

const int sensorPin = 34; // ADC pin

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnected!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    int value = analogRead(sensorPin);

    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String json = "{\"value\": " + String(value) + "}";

    http.POST(json);
    http.end();
  }

  delay(4); // ~250Hz
}