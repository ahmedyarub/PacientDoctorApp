import {Component} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';
import {Http} from "@angular/http";
import {QueuePage} from "../queue/queue";

@Component({
    selector: 'page-doctors',
    templateUrl: 'doctors.html'
})
export class DoctorsPage {

    doctors: Map<number, string>;
    doctor_id: number;
    case_id: number;

    constructor(public navCtrl: NavController, public http: Http, public navParams: NavParams) {
        let data: any = navParams.get('data');

        this.case_id = data.case_id;
        this.doctors = data.doctors;
    }

    queue($event){
        this.http.post("http://fam-doc.com/PacientDoctor/public/index.php/doubts/savedoubt", {
            case_id: this.case_id,
            doctor_id: this.doctor_id
        }).map(res => res.json())
            .subscribe(data => {
                if (data.status === 0) {
                    this.navCtrl.push(QueuePage,{'case_id': this.case_id});
                }
            });
    }
}
