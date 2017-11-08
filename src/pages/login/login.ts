import {Component} from '@angular/core';
import {LoadingController, Platform, IonicPage, NavController} from 'ionic-angular';
import {ViewController, AlertController} from 'ionic-angular';
import {Http} from '@angular/http';
import 'rxjs/add/operator/map';
import {TabsPage} from "../tabs/tabs";
import {RegistrationPage} from "../registration/registration";

//import {GlobalVars} from "../../providers/global-vars";

@IonicPage()
@Component({
    selector: 'page-login',
    templateUrl: 'login.html',
})
export class LoginPage {
    email: string;
    password: string;

    constructor(public navCtrl: NavController,
                public viewCtrl: ViewController, public http: Http, public alertCtrl: AlertController,
                public platform: Platform, public loadingCtrl: LoadingController) {
        this.http.get('/localapi/validate_session',
            {}
        )
            .map(res => res.json())
            .subscribe(data => {
                if (data.status === 0) {
                    this.navCtrl.setRoot(TabsPage);
                }
            });

        this.email = window.localStorage.getItem("REMEMBER_ME");
    }

    login() {
        this.http.post('/localapi/login',
            {
                email: this.email,
                password: this.password,
            }
        )
            .map(res => res.json())
            .subscribe(data => {
                    if (data.status === 0) {
                        this.rememberUser();
                        window.localStorage.setItem("USER_TYPE", data.user_type);
                        this.navCtrl.setRoot(TabsPage);
                    }
                    else {
                        let alert = this.alertCtrl.create({
                            title: 'Error!',
                            subTitle: 'Invalid credencials!',
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

    registration(type: string) {
        this.navCtrl.push(RegistrationPage, {"type": type});
    }

    rememberUser() {
        window.localStorage.setItem("REMEMBER_ME", this.email);
    }
}
