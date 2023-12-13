from flask import Flask, render_template, send_from_directory, Response
from flask_sock import Sock
import socket 
import cv2

app = Flask(__name__)
sock = Sock(app)



@app.route('/')
def index():
    hostname = (socket.gethostname().split(".")[0]).upper()
    return render_template('index.html', hostname=hostname)

@app.route("/manifest.json")
def manifest():
    return send_from_directory('./static', 'manifest.json')

@sock.route('/echo')
def echo(sock):
    while True:
        data = sock.receive()
        sock.send(data)

# From https://www.aranacorp.com/en/stream-video-from-a-raspberry-pi-to-a-web-browser/
def video_gen():
    """Video streaming generator function."""
    vs = cv2.VideoCapture(0)
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