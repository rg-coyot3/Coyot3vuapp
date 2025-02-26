import WebSocket, { WebSocketServer } from 'ws';
import  express  from 'express'
import http  from 'http'
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = http.createServer( ( req, res) => {
  res.appendHeader('Access-Control-Allow-Origin','*')
  console.log(`${Date().now} : request for : ${req.url}`);
  let filePath = __dirname + '/www' + req.url;
    if (filePath == './')
        filePath = __dirname + '/www/index.html';

    let extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;      
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
    }
    console.log(`searching for ${filePath}`)
    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
              console.log(`no ent!`)
                fs.readFile(__dirname + '/www/404.html', function(error, content) {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                });
            }
            else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                res.end(); 
            }
        }
        else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});
server.listen(8080, () => {
  console.log(`server opened at port 8080`)
});



const wss = new WebSocketServer({
  server : server,
  path : '/coyot3/ws',
  autoAcceptConnections : false,
  perMessageDeflate: {
    zlibDeflateOptions: {
      // See zlib defaults.
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    // Other options settable:
    clientNoContextTakeover: true, // Defaults to negotiated value.
    serverNoContextTakeover: true, // Defaults to negotiated value.
    serverMaxWindowBits: 10, // Defaults to negotiated value.
    // Below options specified as default values.
    concurrencyLimit: 10, // Limits zlib concurrency for perf.
    threshold: 1024 // Size (in bytes) below which messages
    // should not be compressed if context takeover is disabled.
  }
});

function isOriginAllowed(origin){
  console.log(`connection from :: ${JSON.stringify(origin)}`);
  return true;
}


wss.on('request', function(request) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  let connection = request.accept('echo-protocol', request.origin);
  console.log((new Date()) + ' Connection accepted.');
  connection.on('message', function(message) {
      if (message.type === 'utf8') {
          console.log('Received Message: ' + message.utf8Data);
          connection.sendUTF(message.utf8Data);
      }
      else if (message.type === 'binary') {
          console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
          connection.sendBytes(message.binaryData);
      }
  });
  connection.on('close', function(reasonCode, description) {
      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });
});

// wss.on('connection', (ws) => {
//   console.log(`connection : `);
//   ws.on('error', console.error);
//   ws.on('message', (data) => {
//     console.log(`rx : ${data}`);
//   });


//   ws.on('disconnect', () => {
//     console.log(`disconnected`)
//   })
// })

let key = "22222222";

let packet = {
  type : 'ping',
  payload : {
    ts : Date.now(),
    key : key
  }
}
setInterval( () => {
  console.log(`connected clients [${wss.clients.length}]`)
  wss.clients.forEach( (cli) => {
    console.log(`sending packet`);
    cli.send(JSON.stringify(packet));
  });
},1000)
