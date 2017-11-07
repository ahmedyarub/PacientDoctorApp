import {Component} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';
import {Http} from "@angular/http";
import {HomePage} from "../home/home";

@Component({
    selector: 'page-queue',
    templateUrl: 'queue.html'
})
export class QueuePage {
    case_id: number;
    queue_count: number = 0;

    constructor(public navCtrl: NavController, public http: Http, public navParams: NavParams) {
        this.case_id = navParams.get('case_id');
    }

    update_queue($event){
        this.http.get("http://fam-doc.com/PacientDoctor/public/index.php/queue/index/" + this.case_id).map(res => res.json())
            .subscribe(data => {
                if (data.status === 0) {
                    this.queue_count = data.queue_count;
                    if(data.queue_count == 0)
                    {
                        this.navCtrl.push(HomePage,{'case_id': this.case_id});
                    }
                }
            });
    }
}
