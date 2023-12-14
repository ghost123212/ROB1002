from flask import Flask, render_template, send_from_directory, Response
from flask_sock import Sock
import socket 
import cv2
from picamera2 import Picamera2
import numpy as np

app = Flask(__name__)
sock = Sock(app)

import time
from trilobot import Trilobot

speed = 0.5
tbot = Trilobot()

enable_colour_detect = False

picam2 = Picamera2()
picam2.configure(picam2.create_preview_configuration(main={"format": 'BGR888', "size": (640, 480)})) # opencv works in BGR not RGB
picam2.start()

@app.route('/')
def index():
    hostname = (socket.gethostname().split(".")[0]).upper()
    return render_template('index.html', hostname=hostname)

@app.route("/manifest.json")
def manifest():
    return send_from_directory('./static', 'manifest.json')

@app.route("/app.js")
def script():
    return send_from_directory('./static', 'app.js')

@sock.route('/command')
def command(sock):
    
    while True:
        cmd = sock.receive().split(':')

        if cmd[0] == "left":
            tbot.curve_forward_left(speed)

        elif cmd[0] == "right":
            tbot.curve_forward_right(speed)

        elif cmd[0] == "up":
            tbot.forward(speed)

        elif cmd[0] == "down":
            tbot.backward(speed)

        elif cmd[0] == "stop":
            tbot.stop()

        elif cmd[0] == "speed":
            speed = float(cmd[1])

        else: 
            print("send either `up` `down` `left` `right` or `stop` to move your robot!")

def colour_detect(_img):
    hsv_img = cv2.cvtColor(_img, cv2.COLOR_BGR2HSV) # convert to hsv image

    # Create a binary (mask) image, HSV = hue (colour) (0-180), saturation  (0-255), value (brightness) (0-255)
    hsv_thresh = cv2.inRange(hsv_img,
                                np.array((50, 0, 0)), # lower range
                                np.array((80, 255, 255))) # upper range

    # Find the contours in the mask generated from the HSV image
    hsv_contours, hierachy = cv2.findContours(
        hsv_thresh.copy(),
        cv2.RETR_TREE,
        cv2.CHAIN_APPROX_SIMPLE)
    
        
    # In hsv_contours we now have an array of individual closed contours (basically a polgon around the blobs in the mask). Let's iterate over all those found contours.
    for c in hsv_contours:
        # This allows to compute the area (in pixels) of a contour
        a = cv2.contourArea(c)
        # and if the area is big enough, we draw the outline
        # of the contour (in blue)
        if a > 100.0:
            cv2.drawContours(_img, c, -1, (255, 0, 0), 10)

    return _img

# From https://www.aranacorp.com/en/stream-video-from-a-raspberry-pi-to-a-web-browser/
def video_gen():
    """Video streaming generator function."""
    while True:
        img = picam2.capture_array()
        if enable_colour_detect:
            img = colour_detect(img)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB) # convert back to rgb image
        ret, jpeg = cv2.imencode('.jpg', img)
        frame=jpeg.tobytes()
        yield (b'--frame\r\n'
        b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    """Video streaming route. Put this in the src attribute of an img tag."""
    return Response(video_gen(),mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port =5000, debug=False, threaded=True)
    tbot.stop()
    print("Trilobot stopped.")