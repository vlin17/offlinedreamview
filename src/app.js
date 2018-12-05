'use strict';

/** Import modules **/
const express = require('express');
const compression = require('compression');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const async = require('async');
const path = require('path');
const bodyParser = require('body-parser');

const restService = require('./routes/rest_service');
const wsService = require('./routes/websocket_service');

/** Parameters **/
const port = process.env.PORT || 8087;

/** Initialization **/
const app = express();
app.use(compression());
app.use(bodyParser.json({ limit: '1024kb' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


/***** development purpose only *****
 *****   allow cross domain      ****
 ************************************/
app.all('*', function(req, res, next) {

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers',
        'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.send(200);
    } else {
        next();
    }
});

app.use(restService);


const server = http.createServer(app);
const wss = new WebSocket.Server({
    server: server,
    perMessageDeflate: true,
});
wss.on('connection', wsService.connection);




server.listen(port, function listening() {
    console.log('Listening on %d', server.address().port);
});