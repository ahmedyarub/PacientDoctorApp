import { Component } from '@angular/core';
import {AlertController, Events, Platform} from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import {LoginPage} from "../pages/login/login";
import {Http} from "@angular/http";

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
    rootPage: any = LoginPage;

    constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, public http: Http,
                public events: Events, public alertCtrl: AlertController) {
        platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            statusBar.styleDefault();
            splashScreen.hide();
        });
    }
}
