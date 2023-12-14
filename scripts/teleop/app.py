from flask import Flask, render_template, send_from_directory, Response
from flask_sock import Sock
import socket 
import cv2
# from picamera2 import Picamera2

app = Flask(__name__)
sock = Sock(app)

import time
from trilobot import Trilobot

speed = 0.5
tbot = Trilobot()

# picam2 = Picamera2()
# picam2.configure(picam2.create_preview_configuration(main={"format": 'BGR888', "size": (640, 480)})) # opencv works in BGR not RGB
# picam2.start()

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
        cmd = sock.receive()

        if cmd == "left":
            tbot.curve_forward_left(speed)

        elif cmd == "right":
            tbot.curve_forward_right(speed)

        elif cmd == "up":
            tbot.forward(speed)

        elif cmd == "down":
            tbot.forward(speed)

        else: 
            print("send either `up` `down` `left` or `right` to move your robot!")

# From https://www.aranacorp.com/en/stream-video-from-a-raspberry-pi-to-a-web-browser/
def video_gen():
    """Video streaming generator function."""
    vs = cv2.VideoCapture(0)
    # vs = picam2.capture_array()
    while True:
        ret,frame=vs.read()
        ret, jpeg = cv2.imencode('.jpg', frame)
        frame=jpeg.tobytes()
        yield (b'--frame\r\n'
        b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        
    vs.release()
    cv2.destroyAllWindows() 

@app.route('/video_feed')
def video_feed():
    """Video streaming route. Put this in the src attribute of an img tag."""
    return Response(video_gen(),mimetype='multipart/x-mixed-replace; boundary=frame')


if __name__ == "__main__":
    app.run(host='0.0.0.0', port =5000, debug=True, threaded=True)