
function handleFrameDataRequest(ws, config) {
    console.log("received request: ", config);

    const numFrames = 336;
    const fileNames = [...Array(numFrames).keys()];
    async.eachSeries(fileNames,
        (filename, callback) => {
            const filepath = path.join(__dirname, `../output_data/${config.id}/${filename+1}.json`);
            console.log(config.clientId, ', processing file:', filepath);

            const data = fs.readFileSync(filepath, 'utf-8');
            setTimeout(() => {
                if (ws.isAlive) {
                    ws.send(data.replace('\n', ''));
                    callback();
                } else {
                    callback('stop');
                }

            }, 50);
            // fs.readFile(filepath, (error, data) => {
            // 	setTimeout(() => {
            // 		ws.send(data + ',' + config.clientId);
            // 		callback();
            // 	}, 2000);
            // });

        }, (error) => {
            if (error) {
                console.error(error);
            } else {
                console.log("All files have been processed successfully");
            }
        });
}

function handleMapDataRequest(ws, data) {
    console.log("handleMapDataRequeste:", data);
    const mapId = data.mapId;
    const row = data.row;
    const col = data.col;

    const filepath = path.join(__dirname, `../map/${mapId}/0.05_${row}_${col}_1024.png`);
    fs.readFile(filepath, (error, image) => {
        if (error) throw error;
        if (ws.isAlive) {
            ws.send(JSON.stringify({
                type: 'MapData',
                data: {
                    row: data.row,
                    col: data.col,
                    img: image,
                },
            }));
        }
    });

}


function handleMapMetaRequest(ws, input) {
	const mapId = input.mapId;
    const metaInfoPath = path.join(__dirname, `../map/${mapId}/metaInfo.json`);

    const data = fs.readFileSync(metaInfoPath, 'utf-8');    
    if (ws.isAlive) {
        ws.send(JSON.stringify({
        	type: 'MapMeta',
        	data: {
        		mapId: mapId,
        		metadata: JSON.parse(data)[mapId],
        	}
        }));
    }
}

function connection(ws, req) {
    const location = url.parse(req.url, true);
    // You might use location.query.access_token to authenticate or share sessions
    // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
    ws.isAlive = true;

    ws.on('message', (event) => {
        const message = JSON.parse(event);

        switch (message.type) {
            case "RetrieveMapMeta":
                handleMapMetaRequest(ws, message.data);
                break;
            case "FrameData":
                handleFrameDataRequest(ws, message.data);
                break;
            case "RetrieveMapData":
                handleMapDataRequest(ws, message.elements);
                break;
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
}

module.exports = connection;