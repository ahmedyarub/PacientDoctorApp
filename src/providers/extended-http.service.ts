import {Injectable} from '@angular/core';
import {Request, XHRBackend, RequestOptions, Response, Http, RequestOptionsArgs, Headers} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import {Events, AlertController} from 'ionic-angular';

@Injectable()
export class ExtendedHttpService extends Http {
    constructor(backend: XHRBackend, defaultOptions: RequestOptions, public events: Events, public alertCtrl: AlertController) {
        super(backend, defaultOptions);
    }

    request(url: string | Request, options?: RequestOptionsArgs): Observable<Response> {

        if (typeof url === 'string') {
            if (document.URL.startsWith('file:///'))
                url = url.replace('/localapi/', 'http://fam-doc.com/PacientDoctor/public/');

            if (!options) {
                options = {headers: new Headers()};
            }
            this.setHeaders(options);
        } else {
            if (document.URL.startsWith('file:///'))
                url.url = url.url.replace('/localapi/', 'http://fam-doc.com/PacientDoctor/public/');

            this.setHeaders(url);
        }

        return super.request(url, options).catch(this.catchErrors());
    }


    private catchErrors() {

        return (res: Response) => {

            if (res.status === 401) {
                let alert = this.alertCtrl.create({
                    title: 'Warning!',
                    subTitle: 'Session expired!',
                    buttons: ['OK']
                });
                alert.present();

                this.events.publish('user:logout');
            }
            return Observable.throw(res);
        };
    }

    private setHeaders(objectToSetHeadersTo: Request | RequestOptionsArgs) {
    }
}