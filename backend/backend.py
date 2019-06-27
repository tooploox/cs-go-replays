import os
from flask import Flask, render_template
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ['SECRET_KEY']
socketio = SocketIO(app)

@socketio.on('start', namespace="/upload")
def on_start(data):
    print("User start")
    print(data)

@socketio.on('player_death', namespace="/upload")
def on_player_death(data):
    print("player_death")
    print(data)

@socketio.on('player_footstep', namespace="/upload")
def on_player_footstep(data):
    print("User player_footstep")
    print(data)

@socketio.on('end', namespace="/upload")
def on_end():
    print("User data end")


if __name__ == '__main__':
    socketio.run(app)
