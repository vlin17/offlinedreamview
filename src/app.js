'use strict';

/** Import modules **/
const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const fs = require('fs');
const async = require('async');
const path = require('path');
const bodyParser = require('body-parser');

const routes = require('./routes');
// const ws = require('./routes/websocket_service');


/** Parameters **/
const port = 8888;


/** Initialization **/
const app = express();

app.use(bodyParser.json({ limit: '1024kb' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


/***** used for development only ****
    allow cross domain 
 */
app.all('*', function (req, res, next) {

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers',
        'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.send(200);
    }
    else {
        next();
    }
});

app.use(routes);
// app.use(ws);


const server = http.createServer(app);
const wss = new WebSocket.Server({ server });







/** main logic **/

// function handleFrameDataRequest(ws, config) {
//     console.log("received request: ", config);

//     const numFrames = 336;
//     const fileNames = [...Array(numFrames).keys()];
//     async.eachSeries(fileNames,
//         (filename, callback) => {
//             const filepath = path.join(__dirname, `../output_data/${config.id}/${filename+1}.json`);
//             // console.log(config.clientId, ', processing file:', filepath);

//             const data = fs.readFileSync(filepath, 'utf-8');
//             setTimeout(() => {
//                 if (ws.isAlive) {
//                     ws.send(data.replace('\n', ''));
//                     callback();
//                 } else {
//                     callback('stop');
//                 }

//             }, 50);
//             // fs.readFile(filepath, (error, data) => {
//             // 	setTimeout(() => {
//             // 		ws.send(data + ',' + config.clientId);
//             // 		callback();
//             // 	}, 2000);
//             // });

//         }, (error) => {
//             if (error) {
//                 console.error(error);
//             } else {
//                 console.log("All files have been processed successfully");
//             }
//         });
// }

function handleSimulationWorldRequest(ws, input) {
    if (input.jobId === undefined || input.frameId === undefined) {
        return;
    }

    console.log("handleSimulationWorldRequest:", input);
    const jobId = input.jobId;
    const frameId = input.frameId;
    const filepath = path.join(__dirname, `../output_data/${jobId}/${frameId}.json`);
    fs.readFile(filepath, 'utf8', (error, data) => {
        if (error) {
            console.error("Error reading simulation world frame data: ", filepath);
            return;
        }

        if (ws.isAlive) {
            ws.send(data.replace('\n', ''));
        }
    });
}

function handleFrameCountRequest(ws, id) {
    const filepath = path.join(__dirname, `../output_data/${id}/index.meta`);
    fs.readFile(filepath, 'utf8', (error, data) => {
        if (error) {
            console.error("Error reading index.meta: ", filepath);
            return;
        }

        if (ws.isAlive) {
            ws.send(JSON.stringify({
                type: 'FrameCount',
                data: data,
            }));
        }        
        console.log("frame count:", data);
    });
}

function handleGroundMetaRequest(ws, input) {
    const mapId = input.mapId;
    const metaInfoPath = path.join(__dirname, `../map/${mapId}/metaInfo.json`);

    const data = fs.readFileSync(metaInfoPath, 'utf-8');
    if (ws.isAlive) {
        ws.send(JSON.stringify({
            type: 'GroundMetadata',
            data: {
                mapId: mapId,
                metadata: JSON.parse(data)[mapId],
            }
        }));
    }
}

wss.on('connection', function connection(ws, req) {
    const location = url.parse(req.url, true);
    // You might use location.query.access_token to authenticate or share sessions
    // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
    ws.isAlive = true;

    ws.on('message', (event) => {
        const message = JSON.parse(event);

        switch (message.type) {
            case "RetrieveGroundMeta":
                console.log("RetrieveGroundMeta....");
                handleGroundMetaRequest(ws, message.data);
                break;
            case "RetrieveFrameCount":
                console.log("RetrieveFrameCount....");
                handleFrameCountRequest(ws, message.id);
                break;
            // case "RetrieveFrameData":
            //     console.log("handleFrameDataRequest....");
            //     handleFrameDataRequest(ws, message.data);
            //     break;
            case "RequestSimulationWorld":
                handleSimulationWorldRequest(ws, message);
                break;
                // case "RetrieveMapData":
                //     handleMapDataRequest(ws, message.elements);
                //     break;
            case "Echo":
                // console.log("Got echo data: ", message.data);
                ws.send(message.data);
                break;
        }
    });

    ws.on('close', function close() {
        ws.isAlive = false;
        console.log('====> disconnected');
    });
});

server.listen(port, function listening() {
    console.log('Listening on %d', server.address().port);
});