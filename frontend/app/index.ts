import io from "socket.io-client"
import { Header, WebSocketProtocol } from "./api"

const API = "http://localhost:5000"

const socket = io(`${API}/upload`)

const input = document.querySelector('input')
const preview = document.querySelector('.preview');
const ws = new WebSocketProtocol(socket, (header: Header) => {
  const para = document.createElement('p');
  para.textContent = `Demo server name: ${header.serverName}.`
  preview.appendChild(para);
})

socket.on("render_error", (cause: string) => {
  console.error(cause)
})

socket.on("render_done", (path: string) => {
//   <video width="320" height="240" controls>
//   <source src="movie.mp4" type="video/mp4">
//   Your browser does not support the video tag.
//   </video>
  preview.innerHTML = ''
  const v = document.createElement('video')
  v.width = 320
  v.height = 240
  v.controls = true
  v.innerText = 'Your browser does not support the video tag.'
  const vSrc = document.createElement('source')
  vSrc.src = `${API}/${path}`
  vSrc.type = "video/mp4"
  v.appendChild(vSrc)
  preview.appendChild(v)
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