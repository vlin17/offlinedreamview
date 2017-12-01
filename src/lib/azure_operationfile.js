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
        shell.exec('mkdir -p ' + adu_data_path + '/map/');
        var tmpPath = path.join(adu_data_path, '/map/', `${mapid}.zip`);
        this.pullData(mapid, tmpPath, 'imaged-map', '.zip', function(result) {
            if (1 === result) {
                console.log('ERROR', 'pull map error');
                callback(false);
            } else {
                console.log('INFO', 'pull map ok under ', adu_data_path);
                var tarCommand = 'unzip -o ' + tmpPath + ' -d ' + adu_data_path + '/map/';
                var tarResult  = shell.exec(tarCommand);
                callback(true);
            }
        });
    };

    this.pullOfflineViewdata = function (recordId, callback) {
        shell.exec('mkdir -p ' + adu_data_path + '/offlineview/');
        var tmpPath = path.join(adu_data_path, '/offlineview/', `${recordId}.zip`);
        this.pullData(recordId, tmpPath, 'offlineview', '.zip', function(result) {
            if (1 === result) {
                console.log('ERROR', 'pull offline view error');
                callback(false);
            } else {
                console.log('INFO', 'pull offline view ok under', adu_data_path);
                var tarCommand = 'unzip -o ' + tmpPath + ' -d ' + adu_data_path + '/offlineview/';
                var tarResult  = shell.exec(tarCommand);
                callback(true);
            }
        });
    };
}

module.exports = OperationfileAzure;