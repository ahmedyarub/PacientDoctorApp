import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';
import {Http} from "@angular/http";
import {DoctorsPage} from "../doctors/doctors";

@Component({
    selector: 'page-questions',
    templateUrl: 'questions.html'
})
export class QuestionsPage {

    categories: Map<number, string>;
    category_id: number;
    questions: any;
    answers: Map<number, number>;
    written_answers: Map<number, string>;

    constructor(public navCtrl: NavController, public http: Http) {
        this.http.get('/localapi/categories/list')
            .map(res => res.json())
            .subscribe(data => {
                if (data.status === 0) {
                    this.categories = data.data;
                }
            });
    }

    categoryChange($event) {
        this.http.get("/localapi/questions/select_questions?category=" + this.category_id)
            .map(res => res.json())
            .subscribe(data => {
                if (data.status === 0) {
                    this.questions = data.data;
                    this.answers = new Map<number, number>();
                    this.written_answers = new Map<number, string>();

                    for (var i=0;i<this.questions.length;i++) {
                        this.answers[this.questions[i].id] = null;
                        this.written_answers[this.questions[i].id] = null;
                    }
                }
            });
    }

    answer() {
        this.http.post("/localapi/questions/select_doctor", {
            answers: this.answers,
            written_answers: this.written_answers,
            category_id: this.category_id
        }).map(res => res.json())
            .subscribe(data => {
                if (data.status === 0) {
                    this.navCtrl.push(DoctorsPage,{'data': data.data});
                }
            });
    }
}
