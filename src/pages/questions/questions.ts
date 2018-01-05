import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';
import {Http} from "@angular/http";
import {DoctorsPage} from "../doctors/doctors";
import {Camera} from "@ionic-native/camera";

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
    image: string;

    constructor(public navCtrl: NavController, public http: Http, public camera: Camera) {
        this.http.get('/localapi/categories/list')
            .map(res => res.json())
            .subscribe(data => {
                if (data.status === 0) {
                    this.categories = data.data;
                }
            });
    }

    takePhoto() {
         this.camera.getPicture({
             destinationType: this.camera.DestinationType.DATA_URL,
             sourceType: this.camera.PictureSourceType.CAMERA
         }).then((imageData) => {
             this.image = "data:image/jpeg;base64," + imageData;
         }, (err) => {
             alert(err);
         });
    }

    dataURItoBlob(dataURI) {
        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(dataURI.split(',')[1]);
        // else
        //     byteString = unescape(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ia], {type: mimeString});
    }

    categoryChange($event) {
        this.http.get("/localapi/questions/select_questions?category=" + this.category_id)
            .map(res => res.json())
            .subscribe(data => {
                if (data.status === 0) {
                    this.questions = data.data;
                    this.answers = new Map<number, number>();
                    this.written_answers = new Map<number, string>();

                    for (var i = 0; i < this.questions.length; i++) {
                        this.answers.set(this.questions[i].id, null);
                        this.written_answers.set(this.questions[i].id, null);
                    }
                }
            });
    }

    answer() {
        var formData = new FormData();

        this.answers.forEach((value: number, key: number) => {
            formData.append('answers[' + key.toString() + ']', this.answers[key] == null ? '' : String(this.answers[key]));
        });

        this.written_answers.forEach((value: string, key: number) => {
            formData.append('written_answers[' + key + ']', this.written_answers[key] == null ? '' : String(this.written_answers[key]));
        });

        formData.append('category_id', this.category_id.toString());

        if (this.image)
            formData.append('image', this.dataURItoBlob(this.image), "image.jpg");

        this.http.post("/localapi/questions/select_doctor", formData).map(res => res.json())
            .subscribe(data => {
                if (data.status === 0) {
                    this.navCtrl.push(DoctorsPage, {'data': data.data});
                }
            });
    }
}
