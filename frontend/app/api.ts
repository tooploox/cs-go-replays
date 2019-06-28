import * as demofile from "demofile"

export interface Header {
    serverName: string,
    tickRate: number
}

interface Socket {
  send: (payload: any) => void
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

interface RoundEndEvent {
  reason: string
}

// https://wiki.alliedmods.net/Counter-Strike:_Global_Offensive_Events#round_start
interface RoundStartEvent {
  timelimit: number,
  fraglimit: number,
  objective: string
}

function stringify(event: string, payload?: any): string {
  return JSON.stringify([event, payload])
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
            this.socket.send(stringify("start", demoFile.header))
        })

        demoFile.gameEvents.on("player_death", (e: PlayerDeathEvent) => {
          const victim = demoFile.entities.getByUserId(e.userid)
          const victimName = victim ? victim.name : null
      
          // Attacker may have disconnected so be aware.
          // e.g. attacker could have thrown a grenade, disconnected, then that grenade
          // killed another player.
          const attacker = demoFile.entities.getByUserId(e.attacker)
          const attackerName = attacker ? attacker.name : null
      
          this.socket.send(stringify("player_death", {
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
            this.socket.send(stringify("player_footstep", {
              id: e.userid,
              position: player.position,
              time: demoFile.currentTime,
            }))
          }
        })
      
        demoFile.gameEvents.on("round_start", (e: RoundStartEvent)=> {
          this.socket.send(stringify("round_start", {
            time: demoFile.currentTime,
            timelimit: e.timelimit,
            fraglimit: e.fraglimit,
            objective: e.objective
          }))
        })
      
        demoFile.gameEvents.on("round_announce_match_start", ()=> {
          this.socket.send(stringify("round_announce_match_start", {
            time: demoFile.currentTime
          }))
        })
      
        demoFile.gameEvents.on("round_end", (e: RoundEndEvent)=> {
          this.socket.send(stringify("round_end", {
            time: demoFile.currentTime,
            reason: e.reason
          }))
        })
      
        demoFile.gameEvents.on("round_officially_ended", () => {
          const teams = demoFile.teams
          const ts = teams[2]
          const cts = teams[3]

          this.socket.send(stringify("round_officially_ended", {
            ts: {
              score: ts.score
            },
            cts: {
              score: cts.score
            }
          }))
        })

        demoFile.on("end", () => {
          this.socket.send(stringify("end"))
          // Stop parsing - we're finished
          demoFile.cancel()
        })

        
        demoFile.parse(buf);
    }
}