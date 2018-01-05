import {Component} from '@angular/core';
import {AlertController, Events, NavController, NavParams} from 'ionic-angular';
import {Http} from "@angular/http";

@Component({
    selector: 'page-logout',
    templateUrl: 'logout.html'
})
export class LogoutPage {
    constructor(public navCtrl: NavController, public http: Http, public navParams: NavParams, public alertCtrl: AlertController, public events: Events) {
        this.http.post('/localapi/logout',
            {}
        )
            .map(res => res.json())
            .subscribe(data => {

                    if (data.status === 0) {
                        this.events.publish('user:logout');
                    } else {
                        let alert = this.alertCtrl.create({
                            title: 'Error!',
                            subTitle: 'Error logging out!',
                            buttons: ['OK']
                        });
                        alert.present();
                    }
                },
                err => {
                    let alert = this.alertCtrl.create({
                        title: 'Erro!',
                        subTitle: 'Communication error!',
                        buttons: ['OK']
                    });
                    alert.present();
                });
    }
}
