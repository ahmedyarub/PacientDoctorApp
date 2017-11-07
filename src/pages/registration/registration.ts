import {Component} from '@angular/core';
import {AlertController, IonicPage, NavController, NavParams, LoadingController} from 'ionic-angular';
import {RegistrationModel} from "../../models/registration-model";
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {EmailValidator} from "../../validators/email"
import {FormattingService} from "../../providers/formatting-service";
import {Http, ResponseContentType} from '@angular/http';
import {LoginPage} from "../login/login";

/**
 * Generated class for the TipoCadastroPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-registration',
    templateUrl: 'registration.html',
})
export class RegistrationPage {
    private static registration_options_list: Map<string, RegistrationTypeData> = new Map();
    type: string;
    registration_type: RegistrationTypeData;
    registration_data: RegistrationModel;

    submitAttempt: boolean = false;

    constructor(public navCtrl: NavController, public navParams: NavParams,
                public loadingCtrl: LoadingController, public formBuilder: FormBuilder, public formattingService: FormattingService
        , public http: Http, public alertCtrl: AlertController) {
        this.registration_data = new RegistrationModel();

        RegistrationPage.registration_options_list['doctor'] = new RegistrationTypeData();
        RegistrationPage.registration_options_list['doctor'].title = 'Doctor';
        RegistrationPage.registration_options_list['doctor'].url = '/doctors/add';
        RegistrationPage.registration_options_list['doctor'].form_group = formBuilder.group({
            name: ['', Validators.compose([Validators.maxLength(50), Validators.pattern('[a-zA-Z ]*'), Validators.required])],
            phone: ['', Validators.compose([Validators.required, Validators.pattern('[()0-9\- ]*')])],
            address: ['', Validators.compose([Validators.required])],
            specialization: ['', Validators.compose([Validators.maxLength(50), Validators.required])],
            email: ['', Validators.compose([Validators.maxLength(50), EmailValidator.isValid, Validators.required])],
            password: ['', Validators.compose([Validators.required])],
            password_confirmation: ['', Validators.compose([Validators.required])],
        });

        RegistrationPage.registration_options_list['patient'] = new RegistrationTypeData();
        RegistrationPage.registration_options_list['patient'].titulo = 'Patient';
        RegistrationPage.registration_options_list['patient'].url = '/pacients/add';
        RegistrationPage.registration_options_list['patient'].form_group = formBuilder.group({
            name: ['', Validators.compose([Validators.maxLength(50), Validators.pattern('[a-zA-Z ]*'), Validators.required])],
            city: ['', Validators.compose([Validators.maxLength(50), Validators.required])],
            state: ['', Validators.compose([Validators.maxLength(50), Validators.required])],
            genre: ['', Validators.compose([Validators.maxLength(50), Validators.required])],
            phone: ['', Validators.compose([Validators.maxLength(14), Validators.required])],
            email: ['', Validators.compose([Validators.maxLength(50), EmailValidator.isValid, Validators.required])],
            password: ['', Validators.compose([Validators.required])],
            password_confirmation: ['', Validators.compose([Validators.required])],
        });

        this.type = navParams.get('type');
        this.registration_type = RegistrationPage.registration_options_list[this.type];
    }

    register() {
        this.submitAttempt = true;

        if (!this.registration_type.form_group.valid) {
            for (let key in this.registration_type.form_group.controls) {
                if (!this.registration_type.form_group.controls[key].valid) {
                    this.registration_type.form_group.controls[key].markAsDirty();
                }
            }

            return;
        }

        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });

        loader.present();

        this.http.post('http://fam-doc.com/PacientDoctor/public/index.php' + RegistrationPage.registration_options_list[this.type].url,
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
                            subTitle: 'You will soon receive a confirmation email. Please click on the link inside the email to activate your account.',
                            buttons: [{
                                text: 'OK',
                                handler: () => {
                                    this.navCtrl.push(LoginPage);
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

class RegistrationTypeData {
    title: string;
    url: string;
    form_group: FormGroup
}