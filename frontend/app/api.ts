import * as demofile from "demofile"
import Socket from "socket.io-client"

export interface Header {
    serverName: string,
    tickRate: number
}


interface PlayerDeathEvent {
    userid: number,
    attacker: number,
    headshot: boolean,
    weapon: string
}

interface PlayerFootstepEvent {
    userid: number
}

export class WebSocketProtocol {
    constructor(
        readonly socket: Socket,
        readonly onStart: (header: Header) => void
    ) {}

    fromBuffer(buf: ArrayBuffer) {
        const demoFile = new demofile.DemoFile();
        demoFile.on("start", () => {
            this.onStart(demoFile.header)
            this.socket.emit("start", JSON.stringify(demoFile.header))
        })

        demoFile.gameEvents.on("player_death", (e: PlayerDeathEvent) => {
          const victim = demoFile.entities.getByUserId(e.userid)
          const victimName = victim ? victim.name : null
      
          // Attacker may have disconnected so be aware.
          // e.g. attacker could have thrown a grenade, disconnected, then that grenade
          // killed another player.
          const attacker = demoFile.entities.getByUserId(e.attacker)
          const attackerName = attacker ? attacker.name : null
      
          this.socket.emit("player_death", JSON.stringify({
            attacker: {
              id: e.attacker,
              attackerName: attackerName,
            },
            victim: {
              name: victimName,
              id: e.userid,
            },
            headshot: e.headshot,
            weapon: e.weapon,
            time: demoFile.currentTime,
          }))
        });

        demoFile.gameEvents.on("player_footstep", (e: PlayerFootstepEvent) => {
          const player = demoFile.entities.getByUserId(e.userid)
          if (player) {
            this.socket.emit("player_footstep", JSON.stringify({
              id: e.userid,
              position: player.position,
              time: demoFile.currentTime,
            }))
          }
        });

        demoFile.on("end", () => {
          this.socket.emit("end")
          // Stop parsing - we're finished
          demoFile.cancel()
        })

        
        demoFile.parse(buf);
    }
}