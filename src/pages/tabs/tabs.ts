import {Component} from '@angular/core';

import {QuestionsPage} from '../questions/questions';
import {HomePage} from '../home/home';
import {AlertController, Events, NavController} from "ionic-angular";
import {CasesPage} from "../cases/cases";
import {ProfilePage} from "../profile/profile";
import {Http} from "@angular/http";
import {LogoutPage} from "../logout/logout";

@Component({
    templateUrl: 'tabs.html'
})
export class TabsPage {

    tab1Root: any = null;
    tab2Root: any = CasesPage;
    tab3Root: any = ProfilePage;
    tab4Root: any = LogoutPage;
    user_type: string;

    constructor(public navCtrl: NavController, public events: Events, public http: Http, public alertCtrl: AlertController) {
        this.user_type = window.localStorage.getItem("USER_TYPE");

        events.subscribe('user:logout', () => {
            location.reload();
        });

        if (this.user_type == '1')
            this.tab1Root = HomePage;
        else
            this.tab1Root = QuestionsPage;
    }

    logout(event) {
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
