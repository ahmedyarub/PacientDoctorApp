import {Component} from '@angular/core';
import {LoadingController, Platform, IonicPage, NavController} from 'ionic-angular';
import {ViewController, AlertController} from 'ionic-angular';
import {Http} from '@angular/http';
import 'rxjs/add/operator/map';
import {TabsPage} from "../tabs/tabs";
import {RegistrationPage} from "../registration/registration";
import {AndroidPermissions} from '@ionic-native/android-permissions';
import {Push, PushObject, PushOptions} from '@ionic-native/push';

@IonicPage()
@Component({
    selector: 'page-login',
    templateUrl: 'login.html',
})
export class LoginPage {
    email: string;
    password: string;
    push_id: string;
    showPassword: boolean = false;

    options: PushOptions = {
        android: {
            senderID: '63467285075'
        },
        ios: {
            alert: 'true',
            badge: true,
            sound: 'false'
        }
    };

    constructor(public navCtrl: NavController,
                public viewCtrl: ViewController, public http: Http, public alertCtrl: AlertController, private push: Push,
                public platform: Platform, public loadingCtrl: LoadingController, private androidPermissions: AndroidPermissions) {
        if (document.URL.startsWith('file') && this.platform.is('android')) {
            this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.CAMERA).then(
                success => console.log('Permission granted'),
                err => this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA)
            );

            this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO).then(
                success => console.log('Permission granted'),
                err => this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO)
            );

            this.androidPermissions.requestPermissions([this.androidPermissions.PERMISSION.CAMERA, this.androidPermissions.PERMISSION.RECORD_AUDIO]);

            this.push.hasPermission()
                .then((res: any) => {

                    if (res.isEnabled) {
                        console.log('We have permission to send push notifications');
                    } else {
                        console.log('We do not have permission to send push notifications');
                    }

                });

            const pushObject: PushObject = this.push.init(this.options);

            pushObject.on('notification').subscribe((notification: any) =>   alert(notification.message));

            pushObject.on('registration').subscribe((registration: any) => {
                console.log('Device registered', registration);
                this.push_id = registration.registrationId;
            });
        }

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
                push_id: this.push_id,
                platform: this.platform.is('ios') ? 'ios' : 'android'
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
                        subTitle: 'Invalid credencials!',
                        buttons: ['OK']
                    });
                    alert.present();
                });
    }

    forgot_password() {
        this.http.post('/localapi/password_reset',
            {
                email: this.email
            }
        )
            .map(res => res.json())
            .subscribe(data => {
                    if (data.status === 0) {
                        let alert = this.alertCtrl.create({
                            title: 'Password Reset!',
                            subTitle: 'A new password has been sent to your email!',
                            buttons: ['OK']
                        });
                        alert.present();
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
                        subTitle: 'Invalid credencials!',
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
