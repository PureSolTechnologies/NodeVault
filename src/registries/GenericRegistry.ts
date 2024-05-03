import axios, { AxiosProxyConfig, AxiosResponse } from 'axios';
import fs, { PathLike } from 'fs';
import http from 'http';
import https from 'https';
import { Readable } from 'stream';
import { Registry } from './Registry.js';

export class GenericRegistry implements Registry {

    private proxy: false | AxiosProxyConfig = false;

    constructor(readonly baseURL: string) { }

    async download(url: URL, target: PathLike): Promise<PathLike> {
        const response = await axios<Readable, AxiosResponse<Readable>>({
            method: 'get',
            url: url.toString(),
            responseType: 'stream',
            httpAgent: new http.Agent({ keepAlive: false }),
            httpsAgent: new https.Agent({ keepAlive: false }),
            maxRedirects: 3,
            validateStatus: (status) => (status >= 200 && status < 400) || status === 404,
            proxy: this.proxy,
        });
        return await new Promise((resolve, reject) => {
            const stream = fs.createWriteStream(target);
            response.data.pipe(stream);
            let error: Error | null = null;
            stream.on('error', err => { // Handle errors
                console.error(`Error downloading file '${target}': ${err.message}`)
                error = err;
                fs.unlinkSync(target); // delete the (partial) file and then return the error
                reject(err.message);
            });
            stream.on("finish", () => {
                stream.close();
            });
            stream.on('close', () => {
                if (!error) {
                    resolve(target);
                }
                //no need to call the reject here, as it will have been called in the
                //'error' stream;
            });
        });
    }

    async downloadProjectMetaInfo(projectName: string, target: PathLike): Promise<void> {
        await this.download(new URL(`${this.baseURL}/${projectName}`), target);
    }
}