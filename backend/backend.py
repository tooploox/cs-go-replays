import os
from uuid import uuid4
import json
from multiprocessing import Pool

from flask_socketio import SocketIO, emit, join_room
from flask import Flask, render_template, request, send_from_directory
from cachetools import LRUCache

def render(path, data):
    from visualize.animator import Animator

    Animator(data).create(path)

def backend(worker_pool, **kwargs):
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ['SECRET_KEY']
    socketio = SocketIO(app)

    buf = LRUCache(1024)

    @socketio.on('message', namespace="/upload")
    def on_message(data):
        if request.sid not in buf:
            buf[request.sid] = []
        buf[request.sid].append(json.loads(data))

    @socketio.on('reset', namespace="/upload")
    def on_reset():
        if request.sid in buf:
            buf[request.sid] = []

    @app.route('/anim/<path:path>')
    def send_anim(path):
        return send_from_directory('anim', path)

    @app.route('/dist/<path:path>')
    def send_dist(path):
        return send_from_directory('dist', path)

    @socketio.on('render', namespace="/upload")
    def on_render():
        if request.sid not in buf or buf[request.sid] == []:
            emit("render_error", "empty_data")
        else:
            room = str(uuid4())
            path = f"anim/{room}.mp4"
            join_room(room)
            try:
                res = worker_pool.apply_async(
                    func=render,
                    args=(path, buf[request.sid],),
                    error_callback=lambda x: socketio.emit("render_error", "server_error", room=room) # Outside request context -> cannot use top-level emit()
                )
                res.get(timeout=60)
                emit("render_done", path),
            except:
                emit("render_error", "server_error")
                raise
    return socketio.run(app, **kwargs)

if __name__ == '__main__':
    with Pool(2) as p:
        backend(p)
