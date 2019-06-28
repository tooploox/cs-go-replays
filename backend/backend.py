import os
from flask import Flask, render_template
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ['SECRET_KEY']
socketio = SocketIO(app)

@socketio.on('message', namespace="/upload")
def on_message(data):
    print(data)

if __name__ == '__main__':
    socketio.run(app)
