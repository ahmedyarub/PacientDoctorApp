import {Injectable} from '@angular/core';

@Injectable()
export class GlobalVars {

    apiUrl: string;
    vhsUrl: string;

    constructor() {
        //this.apiUrl = "http://localhost:8100";
    }

    public getApiUrl() {
        return this.apiUrl;
    }

    public getVhsUrl() {
        return this.vhsUrl;
    }

}