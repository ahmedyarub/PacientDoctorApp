import {Component} from '@angular/core';
import {AlertController, NavController, NavParams, LoadingController} from 'ionic-angular';
import {RegistrationModel} from "../../models/registration-model";
import {FormBuilder, FormGroup} from '@angular/forms';
import {FormattingService} from "../../providers/formatting-service";
import {Http, ResponseContentType} from '@angular/http';
import {LoginPage} from "../login/login";

@Component({
    selector: 'page-registration',
    templateUrl: 'profile.html',
})
export class ProfilePage {
    user_type: number = 0;

    registration_data: RegistrationModel = new RegistrationModel();

    constructor(public navCtrl: NavController, public loadingCtrl: LoadingController, public formattingService: FormattingService
        , public http: Http, public alertCtrl: AlertController) {
        this.user_type = Number(window.localStorage.getItem("USER_TYPE"));

        this.http.get('/localapi/profile')
            .map(res => res.json())
            .subscribe(data => {
                if (data.status === 0) {
                    this.registration_data = data.data;
                }
            });
    }

    submit() {
        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });

        loader.present();

        this.http.post('/localapi/update_profile',
            this.registration_data,
            {
                responseType: ResponseContentType.Json
            }
        )
            .map(res => res.json())
            .subscribe(data => {
                    loader.dismiss();
                    if (data.status === 0) {
                        let alert = this.alertCtrl.create({
                            title: 'Success!',
                            subTitle: 'Profile updated successfully!',
                            buttons: [{
                                text: 'OK',
                                handler: () => {
                                }
                            }]
                        });
                        alert.present();
                    } else {
                        let alert = this.alertCtrl.create({
                            title: 'Error!',
                            subTitle: data.errors,
                            buttons: ['OK']
                        });
                        alert.present();
                    }
                }
            );
    }
}
