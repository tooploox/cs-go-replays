import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from tqdm import tqdm
import json
import sys

MAPS = "maps"

class Recording:
    def __init__(self, stream):
        self.stream = stream
        self.ps = self._ps()
        self.ts = self._ts()
        self.user_ids = self._user_ids()

        self.header = self._header()
        self.first_round_start = self._round_start()
        self.first_round_end = self._round_end()

        self.footsteps = self._footsteps()

    def _ps(self):
        return [data["position"] for [ev, data] in self.stream if ev == "player_footstep"]

    def _ts(self):
        return [data['time'] for [ev, data] in self.stream if data is not None and 'time' in data]

    def _user_ids(self):
        return list(set([data['id'] for [ev, data] in self.stream if data is not None and'id' in data]))

    def _header(self):
        return [data for (ev, data) in self.stream if ev == "start"][0]

    def _round_start(self, round_num=0):
        return [data for (ev, data) in self.stream if ev == "round_start"][round_num]

    def _round_end(self, round_num=0):
        return [data for (ev, data) in self.stream if ev == "round_end"][round_num]

    def _footsteps(self):
        return {data["time"]:data for (ev, data) in self.stream if ev == "player_footstep"}


class UserColors:
    def __init__(self, user_ids):
        self._mapping = {id:np.random.uniform(low=0.0, high=1.0, size=(3)) for id in user_ids}

    def get(self, user_id):
        return self._mapping[user_id]

class Extent:
    def __init__(self, ps):
        self._ps = ps

        xs = self._xs()
        ys = self._ys()

        self.min_x = min(xs)
        self.max_x = max(xs)
        self.min_y = min(ys)
        self.max_y = max(ys)

    def _xs(self):
        return [p['x'] for p in self._ps]

    def _ys(self):
        return [p['y'] for p in self._ps]

    def tuple(self):
        return (self.min_x, self.max_x, self.min_y, self.max_y)

class AnimationStream:
    def __init__(self, footsteps, frames):
        self.frames = frames
        self._footsteps = footsteps
        self.keyframes = self._keyframes()

    def _keyframes(self):
        proto_keyframes = sorted(list(self._footsteps.keys()))
        keyframes = {}
        last_idx = 0
        for x in self.frames:
            keyframes[x] = []
            for idx in range(last_idx, len(proto_keyframes)):
                kf = proto_keyframes[idx]
                if kf > x:
                    continue
                last_idx = idx
                keyframes[x].append(kf)
        return keyframes

class Animator:
    def __init__(self, stream):
        self._recording = Recording(stream)
        self._extent = Extent(self._recording.ps)
        self._user_colors = UserColors(self._recording.user_ids)
        self._animation_stream = AnimationStream(frames=self._frames, footsteps=self._recording.footsteps)

    @property
    def _frames(self):
        return np.linspace(self._recording.first_round_start["time"], self._recording.first_round_end["time"], 100)

    @property
    def map_layout(self):
        map_name = self._recording.header['mapName']
        return f"{MAPS}/{map_name}.jpg"

    def create(self, output_file):
        img = plt.imread(self.map_layout)
        fig, ax = plt.subplots()

        ax.axis('off')
        ax.imshow(img, extent=self._extent.tuple())

        def init():
            ax.set_xlim(self._extent.min_x, self._extent.max_x)
            ax.set_ylim(self._extent.min_y, self._extent.max_y)
            return []

        def update(frame):
            if frame not in self._animation_stream.keyframes:
                return []
            for k in self._animation_stream.keyframes[frame]:
                data = self._recording.footsteps[k]
                position = data["position"]
                user_id = data['id']
                ax.plot([position["x"]], [position["y"]], 'o', c=self._user_colors.get(user_id))
            return []

        ani = FuncAnimation(fig, update, frames=tqdm(self._animation_stream.frames),
                            init_func=init, blit=True, interval=100,
                            repeat=False)
        ani.save(output_file)
