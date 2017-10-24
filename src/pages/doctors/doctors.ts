import {Component} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';
import {Http} from "@angular/http";

@Component({
    selector: 'page-doctors',
    templateUrl: 'doctors.html'
})
export class DoctorsPage {

    doctors: Map<number, string>;
    doubt_id: number;

    constructor(public navCtrl: NavController, public http: Http, public navParams: NavParams) {
        let data: any = navParams.get('data');

        this.doubt_id = data.doubt_id;
        this.doctors = data.doctors;
    }
}
