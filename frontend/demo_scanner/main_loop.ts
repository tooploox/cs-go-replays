import * as io from "socket.io-client"
import {Header, WebSocketProtocol} from '../app/api'
import * as fs from 'fs'
import * as util from 'util'
import FileScanner from "./file_scanner"

class FakeSocket {
    emit(a, b) {
        console.log(a, b);
    }
    send(payload) {
        console.log(payload);
    }
};

export default class MainLoop {
    fileScanner: FileScanner;
    ws: WebSocketProtocol;
    socket: FakeSocket;

    constructor(directory: string) {
        this.fileScanner = new FileScanner(directory);
        // this.socket = io("http://localhost:5000/upload");
        this.socket = new FakeSocket();
        this.ws = new WebSocketProtocol(this.socket);
    }

    delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async start() {
        const asyncReadFile = util.promisify(fs.readFile)
        while(true) {
            console.log('Main loop started');
            let nextDemo = this.fileScanner.nextDemoToParse()
            if(nextDemo) {
                console.log(`File '${nextDemo.filepath}' parsing start`)
                await new Promise(async (resolve, reject) => {
                    this.ws.fromBuffer(await asyncReadFile(nextDemo.filepath), () => {
                        resolve()
                    })
                })
                console.log(`File '${nextDemo.filepath}' parsing done`)
            } else {
                await this.delay(10000)
            }
            this.fileScanner.saveStateToFile()
        }
    }
}
