import os
from uuid import uuid4
import json
from multiprocessing import Pool

from flask_socketio import SocketIO, emit
from flask import Flask, render_template, request
from cachetools import LRUCache


app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ['SECRET_KEY']
socketio = SocketIO(app)

buf = LRUCache(1024)

def render(data):
    from visualize.animator import Animator

    Animator(data).create(f"anim/{str(uuid4())}.mp4")

@socketio.on('message', namespace="/upload")
def on_message(data):
    if request.sid not in buf:
        buf[request.sid] = []
    buf[request.sid].append(json.loads(data))

@socketio.on('reset', namespace="/upload")
def on_reset():
    if request.sid in buf:
        buf[request.sid] = []

with Pool(10) as p:
    @socketio.on('render', namespace="/upload")
    def on_render():
        if request.sid not in buf or buf[request.sid] == []:
            emit("render_error", "empty_data")
        else:
            try:
                p.apply_async(
                    func=render,
                    args=(buf[request.sid],),
                    callback=lambda x: print("Done"),
                    error_callback=lambda x: print("Fail", x)
                )
            except:
                emit("render_error", "server_error")
                raise

    if __name__ == '__main__':
        socketio.run(app)
