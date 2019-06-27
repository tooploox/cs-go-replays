import * as demofile from "demofile"

import io from "socket.io-client"

const socket = io("http://localhost:5000/upload")

const input = document.querySelector('input')
const preview = document.querySelector('.preview');

input.addEventListener('change', () => {
    preview.innerHTML = '';
    const para = document.createElement('p');
    if (input.files.length > 0) {
        const current = input.files[0]
        para.textContent = 'File name ' + current.name + ', file size ' + fileSize(current.size) + '.';
        process(current)
    } else {
        para.textContent = 'No files currently selected for upload';
    }
    preview.appendChild(para);
}, false)

function fileSize(number: number) {
    if(number < 1024) {
      return number + 'bytes';
    } else if(number >= 1024 && number < 1048576) {
      return (number/1024).toFixed(1) + 'KB';
    } else if(number >= 1048576) {
      return (number/1048576).toFixed(1) + 'MB';
    }
  }

function process(file: File) {
    const reader = new FileReader()
    reader.onload = (ev: ProgressEvent) => {
        if (ev.loaded == ev.total) {
            const demoFile = new demofile.DemoFile();
            demoFile.on("start", () => {
                const para = document.createElement('p');
                para.textContent = "Demo server name:" + demoFile.header.serverName + ', TickRate ' + demoFile.tickRate + '.'
                preview.appendChild(para);

                socket.emit("start", JSON.stringify(demoFile.header))
            })

            demoFile.gameEvents.on("player_death", e => {
              const victim = demoFile.entities.getByUserId(e.userid)
              const victimName = victim ? victim.name : "unnamed"
          
              // Attacker may have disconnected so be aware.
              // e.g. attacker could have thrown a grenade, disconnected, then that grenade
              // killed another player.
              const attacker = demoFile.entities.getByUserId(e.attacker)
              const attackerName = attacker ? attacker.name : "unnamed"
          
              const headshotText = e.headshot ? " HS" : ""
          
              socket.emit("player_death", JSON.stringify({
                id: e.userid,
                attackerName: attackerName,
                weapon: e.weapon,
                headshotText: headshotText,
                victimName: victimName
              }))
            });

            demoFile.gameEvents.on("player_footstep", e => {
              const player = demoFile.entities.getByUserId(e.userid)
              if (player) {
                socket.emit("player_footstep", JSON.stringify({
                  id: e.userid,
                  position: player.position
                }))
              }
            });

            demoFile.on("end", () => {
              socket.emit("end")
              // Stop parsing - we're finished
              demoFile.cancel()
            })

            
            demoFile.parse(reader.result);
        }
    }
    reader.readAsArrayBuffer(file)
}