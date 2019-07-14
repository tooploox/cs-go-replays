import logging
from argparse import ArgumentParser
from multiprocessing import Pool

from backend import backend

log = logging.getLogger()

parser = ArgumentParser()
parser.add_argument("-d", "--debug", action='store_true', help="Enable Flask debugger")
parser.add_argument("-L", "--listen", default='127.0.0.1', help="Listen this address for HTTP")
parser.add_argument("-P", "--port", default=8000, help="Listen this port for HTTP", type=int)
parser.add_argument("-p", "--pool", default=10, help="Amount of process in worker pool", type=int)
parser.add_argument('--log-level', help='Set logging level', default='info',
                    choices=('critical', 'fatal', 'error', 'warning', 'warn', 'info', 'debug'))

options = parser.parse_args()

logging.basicConfig(
    level=getattr(logging, options.log_level.upper(), logging.INFO),
    format="[%(asctime)s] %(filename)s:%(lineno)d %(levelname)s %(message)s"
)

log.info("Starting service on http://%s:%d/", options.listen, options.port)

with Pool(options.pool) as p:
    backend(p, host=options.listen, port=options.port, debug=options.debug)
