const fs = require('fs');
const archiver = require('archiver');
const request = require('request-promise-native');

class Zip {
    constructor({ host, sourceFolder, buildPath, devPassword }) {
        this.host = host;
        this.devPassword = devPassword;
        this.sourceFolder = sourceFolder;
        this.buildPath = buildPath;
    }
    archive(source = this.sourceFolder, target = this.buildPath) {
        this.sourceFolder = source;
        this.buildPath = target;
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(this.buildPath);
            const zip = archiver('zip', {
                zlib: {
                    level: 9
                }
            });
            output.on('error', err => {
                reject(new Error(`[ZipUtil] Failed to write stream: ${err}`));
            });
            output.on('close', () => {
                console.info(`Zip created at ${this.buildPath} (${zip.pointer()} total bytes)`);
                resolve();
            });
            zip.on('error', err => {
                reject(new Error(`[ZipUtil] Failed to create zip: ${err}`));
            });
            zip.pipe(output);
            zip.directory(this.sourceFolder, false);
            zip.finalize();
        });
    }
    async upload(host = this.host, password = this.devPassword) {
        this.host = host;
        this.devPassword = password;
        const options = {
            method: 'POST',
            uri: `http://${this.host}/plugin_install`,
            auth: {
                user: 'rokudev',
                pass: this.devPassword,
                sendImmediately: false
            },
            formData: {
                mysubmit: 'Install',
                archive: fs.createReadStream(this.buildPath)
            }
        };
        console.info(`Installing zip to host ${this.host}`);
        try {
            await request(options);
            console.info(`Installed on host ${this.host}`);
        } catch(err) {
            throw new Error(`[ZipUtil] Upload failed: ${err}`);
        }
    }
}

module.exports = Zip;
