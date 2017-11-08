import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class CadastrosService {
    data: any = null;

    constructor(public http: Http) {
    }

    load() {
        if (this.data) {
            return Promise.resolve(this.data);
        }
        return new Promise(resolve => {
            this.http.get('/localapi/login_mobile')
                .map(res => res.json())
                .subscribe(data => {
                    this.data = data;
                    resolve(this.data);
                });
        });
    }

    getDadosCadastro() {
        this.data = null;
        return this.load().then(data => {
            return data;
        });
    }
}