import { Component } from '@angular/core';

import {QuestionsPage} from '../questions/questions';
import { HomePage } from '../home/home';
import {LoginPage} from "../login/login";
import {Events, NavController} from "ionic-angular";

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = QuestionsPage;
  tab2Root = HomePage;

  constructor(public navCtrl: NavController, public events: Events) {
      events.subscribe('user:logout', () => {
          navCtrl.setRoot(LoginPage);
      });
  }
}
