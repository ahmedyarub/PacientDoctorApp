import {NgModule, ErrorHandler} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {MyApp} from './app.component';

import {AboutPage} from '../pages/about/about';
import {HomePage} from '../pages/home/home';
import {TabsPage} from '../pages/tabs/tabs';
import {RegistrationPage} from '../pages/registration/registration';

import {StatusBar} from '@ionic-native/status-bar';
import {SplashScreen} from '@ionic-native/splash-screen';
import {LoginPage} from "../pages/login/login";
import {HttpModule} from "@angular/http";
import {FormattingService} from "../providers/formatting-service";
import {QuestionsPage} from "../pages/questions/questions";

import {KeysPipe} from "../pipes/keys-pipe";
import {DoctorsPage} from "../pages/doctors/doctors";

@NgModule({
    declarations: [
        MyApp,
        AboutPage,
        QuestionsPage,
        HomePage,
        TabsPage,
        LoginPage,
        RegistrationPage,
        DoctorsPage,
        KeysPipe
    ],
    imports: [
        BrowserModule,
        HttpModule,
        IonicModule.forRoot(MyApp)
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        AboutPage,
        QuestionsPage,
        HomePage,
        TabsPage,
        LoginPage,
        DoctorsPage,
        RegistrationPage
    ],
    providers: [
        StatusBar,
        SplashScreen,
        FormattingService,
        {provide: ErrorHandler, useClass: IonicErrorHandler}
    ]
})
export class AppModule {
}
