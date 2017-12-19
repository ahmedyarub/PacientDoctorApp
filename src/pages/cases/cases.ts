import {Component} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';
import {Http} from "@angular/http";

@Component({
    selector: 'page-cases',
    templateUrl: 'cases.html'
})
export class CasesPage {
    cases: Map<number, string>;
    case_id: number;
    message: string;

    constructor(public navCtrl: NavController, public http: Http, public navParams: NavParams) {
        this.http.get('/localapi/doctors/doctor_cases')
            .map(res => res.json())
            .subscribe(data => {
                if (data.status === 0) {
                    this.cases = data.cases;
                }
            });
    }

    send_message($event) {
        this.http.post("/localapi/doctors/send_message", {
            case_id: this.case_id,
            message: this.message
        }).map(res => res.json())
            .subscribe(data => {
                if (data.status === 0) {
                    alert('Message sent successfully!');
                } else {
                    alert('Error sending message!');
                }
            });
    }
}
