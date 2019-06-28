import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from tqdm import tqdm
import json
import sys

MAPS = "maps"

class Animator:
    def __init__(self, stream):
        self.stream = stream

    def create(self, output_file):
        stream = self.stream
        ps = [data["position"] for [ev, data] in stream if ev == "player_footstep"]
        ts = [data['time'] for [ev, data] in stream if data is not None and 'time' in data]
        ids = list(set([data['id'] for [ev, data] in stream if data is not None and'id' in data]))
        user_colors = {id:np.random.uniform(low=0.0, high=1.0, size=(3)) for id in ids}
        xs = [p['x'] for p in ps]
        ys = [p['y'] for p in ps]
        min_x = min(xs)
        max_x = max(xs)
        min_y = min(ys)
        max_y = max(ys)
        min_ts = min(ts)
        max_ts = max(ts)

        header = [data for (ev, data) in stream if ev == "start"][0]
        round_start = [data for (ev, data) in stream if ev == "round_start"][0]
        round_end = [data for (ev, data) in stream if ev == "round_end"][0]

        map_layout = f"{MAPS}/{header['mapName']}.jpg"
        footsteps = {data["time"]:data for (ev, data) in stream if ev == "player_footstep"}

        proto_keyframes = sorted(list(footsteps.keys()))
        frames = np.linspace(0, round_end["time"], 100)
        keyframes = {}
        last_idx = 0
        for x in frames:
            keyframes[x] = []
            for idx in range(last_idx, len(proto_keyframes)):
                kf = proto_keyframes[idx]
                if kf > x:
                    continue
                last_idx = idx
                keyframes[x].append(kf)
        img = plt.imread(map_layout)
        fig, ax = plt.subplots()
        ax.axis('off')
        ax.imshow(img, extent=(min_x, max_x, min_y, max_y))


        def init():
            ax.set_xlim(min_x, max_x)
            ax.set_ylim(min_y, max_y)
            return []


        def update(frame):
            if frame not in keyframes:
                return []
            ax.plot([max_x, min_x, max_x, min_x], [max_y, min_y, min_y, max_y], 'ro')
            for k in keyframes[frame]:
                data = footsteps[k]
                position = data["position"]
                ax.plot([position["x"]], [position["y"]], 'o', c=user_colors[data['id']])
            return []

        ani = FuncAnimation(fig, update, frames=tqdm(frames),
                            init_func=init, blit=True, interval=100,
                            repeat=False)
        ani.save(output_file)
