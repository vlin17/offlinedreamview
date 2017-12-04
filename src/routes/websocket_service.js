const path = require('path');
const fs = require('fs');

const adu_data_path = process.env.adu_data_path;

function handleSimulationWorldRequest(ws, input) {
    if (input.jobId === undefined || input.frameId === undefined) {
        return;
    }

    const jobId = input.jobId;
    const frameId = input.frameId;
    const filepath = path.join(adu_data_path, `/offlineview/${jobId}/${frameId}.json`);

    fs.readFile(filepath, 'utf8', (error, data) => {
        if (error) {
            console.error("Error reading simulation world frame data: ", filepath);
            return;
        }
        try {
            const delay = Math.random() * 3000;
            setTimeout( () => {
                if (ws.isAlive) {
                    console.log("SimulationWorldResponse:", frameId, " delay:", delay, ' ms');
                    ws.send(data.replace('\n', ''));
                }
            }, delay);
        } catch (error) {
            console.log("Failed to handleSimulationWorldRequest:", error);
        }
    });
}

function handleFrameCountRequest(ws, id) {
    const filepath = path.join(adu_data_path, `/offlineview/${id}/index.meta`);
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
    });
}

function handleGroundMetaRequest(ws, mapId) {
    const metaInfoPath = path.join(adu_data_path, `/map/${mapId}/metaInfo.json`);

    try {
        const data = fs.readFileSync(metaInfoPath, 'utf-8');
        if (ws.isAlive) {
            ws.send(JSON.stringify({
                type: 'GroundMetadata',
                data: JSON.parse(data)[mapId],
            }));
        }
    } catch (error) {
        console.log("Failed to handleGroundMetaRequest:", error);
    }

}


function connection(ws, req) {
    // const location = url.parse(req.url, true);
    // You might use location.query.access_token to authenticate or share sessions
    // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
    ws.isAlive = true;

    ws.on('message', (event) => {
        const message = JSON.parse(event);

        switch (message.type) {
            case "RetrieveGroundMeta":
                handleGroundMetaRequest(ws, message.mapId);
                break;
            case "RetrieveFrameCount":
                handleFrameCountRequest(ws, message.jobId);
                break;
            case "RequestSimulationWorld":
                handleSimulationWorldRequest(ws, message);
                break;
        }
    });

    ws.on('close', function close() {
        ws.isAlive = false;
    });

}

module.exports = {
    connection,
}