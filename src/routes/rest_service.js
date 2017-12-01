'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const console = require('console')
const router = express.Router();

const OperationfileAzure = require('../lib/azure_operationfile');
const AzureBlob = new OperationfileAzure();

const adu_data_path = process.env.adu_data_path;

router.get('/', (req, res) => {
    res.set('Content-Encoding', 'gzip');
    const dreamviewPath = path.join(adu_data_path, '../public/index.html');
    res.sendfile(dreamviewPath);
});


router.get('/map/getMapPic', (req, res) => {
    /* allow cross origin requests */
    res.header('Access-Control-Allow-Origin', '*');

    const mapId = req.query.mapId;
    const row = req.query.i;
    const col = req.query.j;
    const imageName = `0.05_${row}_${col}_1024.png`;
    const imagePath = path.join(adu_data_path, '/map', mapId, imageName);

    res.sendFile(imagePath);
});

router.get('/ground/meta/:id', (req, res) => {
    const mapId = req.params.id;
    const metaInfoPath = path.join(adu_data_path, `/map/${mapId}/metaInfo.json`);

    fs.readFile(metaInfoPath, 'utf-8', (error, meta) => {
        if (error) {
            throw error;
        }
        res.json({
            mapId: mapId,
            metadata: JSON.parse(meta)[mapId],
        });
    });
});

router.get('/frame/:jobId/count', (req, res) => {
    const jobId = req.params.jobId;
    const filepath = path.join(adu_data_path, `/offlineview/${jobId}/index.meta`);
    fs.readFile(filepath, 'utf8', (error, data) => {
        if (error) {
            console.error("Error reading index.meta: ", filepath);
            return;
        }

        console.log("frame count:", data);
        res.json(JSON.parse(data));
    });
});

router.get('/frame/:jobId/data/:frameId', (req, res) => {
    const jobId = req.params.jobId;
    const frameId = req.params.frameId;
    const filepath = path.join(adu_data_path, `/offlineview/${jobId}/${frameId}.json`);
    fs.readFile(filepath, 'utf8', (error, data) => {
        if (error) {
            console.error("Error reading index.meta: ", filepath);
            return;
        }

        res.json(JSON.parse(data));
    });
});


router.get('/pulldata', (req, res) => {
    const recordId = req.query.id;
    const mapId = req.query.mapId;

    if (recordId) {
        AzureBlob.pullOfflineViewdata(recordId, (success) => {
            const msg = success ? 'done!' : 'Failed to pull offline data.';
            res.send(msg);
        });
    } else if (mapId) {
        AzureBlob.pullMapImagedata(mapId, (success) => {
            const msg = success ? 'done!' : 'Failed to pull offline data.';
            res.send(msg);
        });
    }
});

module.exports = router;