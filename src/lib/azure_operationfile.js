const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
const azure = require('azure-storage');

const azure_storage_account = process.env.azure_storage_account;
const azure_storage_access_key = process.env.azure_storage_access_key;
const adu_data_path = process.env.adu_data_path;


function OperationfileAzure() {
    
    const blobSvc = azure.createBlobService(azure_storage_account, azure_storage_access_key);
 
    this.pullData = function (id, fileName, container, suffix, callback) {
        var blobName = id + suffix;
        console.log('INFO', 'container: ' + container + ' blob: ' + blobName);
        blobSvc.getBlobToLocalFile(container, blobName, fileName, function(error, result, response) {
            if (error) {
                console.log('ERROR', 'pull data error: ' + error);
                callback(1);
            } else {
                console.log('INFO', 'pull data ok');
                callback();
            }
        });
    };

    this.pullMapImagedata = function (mapid, callback) {
        var tmpPath = path.join(__dirname, '.', 'map.zip');
        var aduDataPath = adu_data_path;
        this.pullData(mapid, tmpPath, 'imaged-map', '.zip', function(result) {
            if (1 === result) {
                console.log('ERROR', 'pull map error');
                callback();
            } else {
                console.log('INFO', 'pull map ok under ', aduDataPath);
                shell.exec('mkdir -p ' + aduDataPath + '/map/');
                var tarCommand = 'unzip -o ' + tmpPath + ' -d ' + aduDataPath + '/map/';
                var tarResult  = shell.exec(tarCommand);
                callback();
            }
        });
    };

    this.pullOfflineViewdata = function (recordId, callback) {
        var tmpPath = path.join(__dirname, '.', 'map.zip');
        var aduDataPath = adu_data_path;
        this.pullData(recordId, tmpPath, 'offlineview', '.zip', function(result) {
            if (1 === result) {
                console.log('ERROR', 'pull offline view error');
                callback();
            } else {
                console.log('INFO', 'pull offline view ok under', aduDataPath);
                shell.exec('mkdir -p ' + aduDataPath + '/offlineview/');
                var tarCommand = 'unzip -o ' + tmpPath + ' -d ' + aduDataPath + '/offlineview/';
                var tarResult  = shell.exec(tarCommand);
                callback();
            }
        });
    };
}

module.exports = OperationfileAzure;