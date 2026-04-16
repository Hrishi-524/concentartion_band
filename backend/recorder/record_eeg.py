import serial
import time
import csv

PORT = 'COM6'  
BAUD = 115200
DURATION = 300  

ser = serial.Serial(PORT, BAUD)
time.sleep(2)

filename = f"eeg_data_{int(time.time())}.csv"

with open(filename, mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(["timestamp", "value"])

    start_time = time.time()

    print("Recording started...")

    while True:
        try:
            line = ser.readline().decode('utf-8').strip()

            if line.isdigit():
                timestamp = time.time()
                writer.writerow([timestamp, int(line)])

        except:
            continue

        if time.time() - start_time > DURATION:
            break

print(f"Recording saved to {filename}")
ser.close()