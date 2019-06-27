import io from "socket.io-client"
import {Header, WebSocketProtocol} from "./api"

const socket = io("http://localhost:5000/upload")

const input = document.querySelector('input')
const preview = document.querySelector('.preview');
const ws = new WebSocketProtocol(socket, (header: Header) => {
  const para = document.createElement('p');
  para.textContent = `Demo server name: ${header.serverName}.`
  preview.appendChild(para);
})

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
          ws.fromBuffer(reader.result as ArrayBuffer)
        }
    }
    reader.readAsArrayBuffer(file)
}