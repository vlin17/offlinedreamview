const path = require('path');
const fs = require('fs');

function handleSimulationWorldRequest(ws, input) {
    if (input.jobId === undefined || input.frameId === undefined) {
        return;
    }

    console.log("handleSimulationWorldRequest:", input);
    const jobId = input.jobId;
    const frameId = input.frameId;
    const filepath = path.join(__dirname, `../../output_data/${jobId}/${frameId}.json`);
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
    const filepath = path.join(__dirname, `../../output_data/${id}/index.meta`);
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
    const metaInfoPath = path.join(__dirname, `../../map/${mapId}/metaInfo.json`);

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


function connection(ws, req) {
    // const location = url.parse(req.url, true);
    // You might use location.query.access_token to authenticate or share sessions
    // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
    ws.isAlive = true;

    ws.on('message', (event) => {
        const message = JSON.parse(event);

        switch (message.type) {
            case "RetrieveGroundMeta":
                handleGroundMetaRequest(ws, message.data);
                break;
            case "RetrieveFrameCount":
                handleFrameCountRequest(ws, message.id);
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