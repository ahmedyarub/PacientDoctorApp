import {Component, ViewChild} from '@angular/core';
import {AlertController, Content, Events, LoadingController, NavController, NavParams} from 'ionic-angular';
import * as io from "socket.io-client";
import {Http} from "@angular/http";
import {Platform} from 'ionic-angular';
import { NativeAudio } from '@ionic-native/native-audio';

declare var cordova: any;

var temp;

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {
    @ViewChild(Content) content: Content;

    cases_count: number = 0;
    tabBarElement: any;
    show_configuration: boolean = false;
    interval: number;

    evaluation: number = 5;
    case_id: number = null;
    question_answer: string = '';
    photo: string = '';
    notes: string = '';
    case_result: string = '';
    other_notes: string = '';
    message: string;

    cases: Array<any> = new Array<any>();

    video_devices: Array<any> = new Array<any>();
    audio_devices: Array<any> = new Array<any>();
    audio_device_id: string;
    video_device_id: string;

    call_status = 'Pending';

    user_type: number = 0;

    isChannelReady: boolean = false;
    isInitiator: boolean = false;
    isStarted: boolean = false;
    localStream: any;
    pc: any;
    remoteStream: any;
    turnReady: any;
    pcConfig: any = {
        iceTransportPolicy: "relay",
        'iceServers': [{
            'url': 'turn:fam-doc.com:5349',
            credential: 'test',
            username: 'test'
        }]
    };

    sdpConstraints: any = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
    };
    socket: any = io.connect('https://fam-doc.com:8780/');
    constraints: any = {
        audio: true,
        video: true
    };

    iceCandidates: any;

    constructor(public navCtrl: NavController, public alertCtrl: AlertController, private nativeAudio: NativeAudio,
                public http: Http, public events: Events, public navParams: NavParams, public plt: Platform, public loadingCtrl: LoadingController) {
        this.user_type = Number(window.localStorage.getItem("USER_TYPE"));

        if (this.user_type == 0) {
            this.tabBarElement = document.querySelector('.tabbar.show-tabbar');
            this.case_id = navParams.get('case_id');
        }

        this.nativeAudio.preloadSimple('uniqueId1', 'assets/ringtone.mp3');
    }

    send_message($event) {
        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });

        loader.present();

        this.http.post("/localapi/doctors/send_message", {
            case_id: this.case_id,
            message: this.message
        }).map(res => res.json())
            .subscribe(data => {
                loader.dismissAll();

                if (data.status === 0) {
                    alert('Message sent successfully!');
                } else {
                    alert('Error sending message!');
                }
            });
    }

    toggle_configuration($event) {
        this.show_configuration = !this.show_configuration;

        setTimeout(() => {
            let dimensions = this.content.getContentDimensions();
            this.content.scrollTo(0, dimensions.contentHeight, 0.5);
        }, 500);
    }

    call($event) {
        this.socket.emit('create or join', this.case_id);
        console.log('Attempted to create or  join room', this.case_id);
    }

    submit_evaluation($event) {
        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });

        loader.present();

        this.http.post("/localapi/queue/submit_evaluation", {
            case_id: this.case_id,
            evaluation: this.evaluation
        }).map(res => res.json())
            .subscribe(data => {
                loader.dismissAll();

                if (data.status === 0) {
                    alert('Evaluation submitted successfully!');
                }
            });
    }

    submit_notes($event) {
        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });

        loader.present();

        this.http.post("/localapi/queue/submit_notes", {
            case_id: this.case_id,
            notes: this.notes
        }).map(res => res.json())
            .subscribe(data => {
                loader.dismissAll();

                if (data.status === 0) {
                    alert('Journal saved successfully!');
                }
            });
    }

    submit_result($event) {
        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });

        loader.present();

        this.http.post("/localapi/queue/submit_case_result", {
            case_id: this.case_id,
            case_result: this.case_result,
            other_notes: this.other_notes
        }).map(res => res.json())
            .subscribe(data => {
                loader.dismissAll();

                if (data.status === 0) {
                    alert('Case result submitted successfully!');
                }
            });
    }


    receive_notes($event) {
        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });

        loader.present();

        this.http.get("/localapi/queue/receive_notes/" + this.case_id)
            .map(res => res.json())
            .subscribe(data => {
                loader.dismissAll();

                if (data.status === 0) {
                    this.notes = data.data;
                    alert('Journal received successfully!');
                }
            });
    }

    getUserMedia() {
        if (this.video_device_id)
            this.constraints.video = {deviceId: this.video_device_id};
        else
            this.constraints.video = true;

        navigator.mediaDevices.getUserMedia(this.constraints)
            .then((stream) => {
                console.log('Adding local stream.');
                document.querySelector('#localVideo').setAttribute('src', window.URL.createObjectURL(stream));
                this.localStream = stream;
                this.sendMessage('got user media');
            })
            .catch((e) => {
                alert('getUserMedia() error: ' + e.name);
            });
    }


    update_cases() {
        temp.http.get('/localapi/doctors/waiting_patients')
            .map(res => res.json())
            .subscribe(data => {
                if (data.status == 0) {
                    if (temp.cases_count != data.cases_count) {
                        temp.cases_count = data.cases_count;

                        alert('Cases updated!');
                    }
                }

                setTimeout(temp.update_cases, 5000);
            });
    }

    ionViewDidLoad() {
        temp = this;
        if (window.localStorage.getItem("USER_TYPE") != '0') {
            this.update_cases();
        }

        if (this.plt.is('ios')) {
            cordova.plugins.iosrtc.registerGlobals();

            this.interval = setInterval(() => {
                if (document.getElementsByTagName("ion-alert").length != 0) {
                    document.getElementById("remoteVideo").style.zIndex = "-1";
                    document.getElementById("localVideo").style.zIndex = "-1";
                } else {
                    document.getElementById("remoteVideo").style.zIndex = "1";
                    document.getElementById("localVideo").style.zIndex = "1";
                }
                //cordova.plugins.audioroute.overrideOutput('speaker');
                cordova.plugins.iosrtc.refreshVideos();
            }, 500);
        }

        navigator.mediaDevices.enumerateDevices()
            .then((deviceInfos: MediaDeviceInfo[]) => {
                for (var i = 0; i !== deviceInfos.length; ++i) {
                    var deviceInfo = deviceInfos[i];

                    if (deviceInfo.kind === 'audiooutput') {
                        this.audio_devices.push({
                            id: deviceInfo.deviceId,
                            label: deviceInfo.label || ('Audio ' + (i + 1))
                        });
                    } else if (deviceInfo.kind === 'videoinput') {
                        this.video_devices.push({
                            id: deviceInfo.deviceId,
                            label: deviceInfo.label || ('Video ' + (i + 1))
                        });
                    }
                }
            });

        this.getUserMedia();

        console.log('Getting user media with constraints', this.constraints);

        this.socket.on('created', (room) => {
            console.log('Created room ' + room);
        });

        this.socket.on('full', (room) => {
            console.log('Room ' + room + ' is full');
        });

        this.socket.on('join', (room) => {
            console.log('Another peer made a request to join room ' + room);
            console.log('This peer is the initiator of room ' + room + '!');

            if (!this.isStarted) {
                this.isChannelReady = true;

                this.nativeAudio.loop('uniqueId1')

                var r = confirm("Accept call?");
                if (r == true) {
                    this.maybeStart();
                }

                this.nativeAudio.stop('uniqueId1')            }
        });

        this.socket.on('joined', (room) => {
            console.log('joined: ' + room);
            this.isChannelReady = true;
        });

        this.socket.on('log', (array) => {
            console.log.apply(console, array);
        });

        this.socket.on('message', (message) => {
            console.log('Client received message:', message);
            if (message === 'got user media') {
                //this.maybeStart();
            } else if (message.type === 'offer') {
                this.nativeAudio.loop('uniqueId1')

                //var r = confirm("Accept call?");

                this.nativeAudio.stop('uniqueId1')

                //if (r == true) {
                console.log('Call accepted');
                if (!this.isInitiator) {
                    this.maybeStart();
                }

                console.log('Setting remote description');
                this.pc.setRemoteDescription(new RTCSessionDescription(message));

                for (var i = 0; i < this.iceCandidates.length; i++) {
                    this.pc.addIceCandidate(this.iceCandidates[i]);
                }

                console.log('Sending answer to peer.');
                this.pc.createAnswer().then(
                    (sessionDescription) => {
                        // Set Opus as the preferred codec in SDP if Opus is present.
                        //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
                        this.pc.setLocalDescription(sessionDescription);
                        console.log('setLocalAndSendMessage sending message', sessionDescription);
                        this.sendMessage(sessionDescription);
                    }, (error) => {
                        console.log('Failed to create session description: ' + error.toString());
                    }
                );
                //}
            } else if (message.type === 'answer') {
                this.pc.setRemoteDescription(new RTCSessionDescription(message));
            } else if (message.type === 'candidate') {
                var candidate = new RTCIceCandidate({
                    sdpMLineIndex: message.label,
                    candidate: message.candidate
                });
                if (this.isStarted) {
                    console.log('Add candidates');
                    this.pc.addIceCandidate(candidate);
                } else {
                    console.log('Queue candidates');
                    this.iceCandidates.push(candidate);
                }
            } else if (message === 'bye' && this.isStarted) {
                this.handleRemoteHangup();
            }
        });

        if (window.localStorage.getItem("USER_TYPE") == '0') {
            let loader = this.loadingCtrl.create({
                content: "Loading..."
            });

            loader.present();

            this.http.post("/localapi/queue/start_call", {
                case_id: this.case_id
            }).map(res => res.json())
                .subscribe(data => {
                    loader.dismissAll();

                    if (data.status === 0) {
                        //alert('Evaluation submitted successfully!');
                    }
                });

            this.isInitiator = true;
            this.socket.emit('create or join', this.case_id);
            console.log('Attempted to create or  join room', this.case_id);
        }

        //if (location.hostname !== 'localhost') {
        this.requestTurn(
            window.location.hostname === "localhost" ? '/stun/' : 'https://fam-doc.com:3478/'
        );
        //}

        window.onbeforeunload = () => {
            this.sendMessage('bye');
        };
    }

    sendMessage(message) {
        console.log('Client sending message: ', message);
        this.socket.emit('message', message);
    }

    maybeStart() {
        console.log('>>>>>>> maybeStart() ', this.isStarted, this.localStream, this.isChannelReady);
        if (!this.isStarted && typeof this.localStream !== 'undefined' && this.isChannelReady) {
            //if (typeof this.localStream !== 'undefined' && this.isChannelReady) {
            console.log('>>>>>> creating peer connection');
            this.createPeerConnection();
            this.pc.addStream(this.localStream);

            if (this.user_type == 0)
                this.tabBarElement.style.display = 'none';

            this.isStarted = true;
            console.log('isInitiator', this.isInitiator);
            if (this.isInitiator) {
                this.doCall();
            }
        }
    }

    createPeerConnection() {
        try {
            this.pc = new webkitRTCPeerConnection(this.pcConfig);
            this.pc.oniceconnectionstatechange = () => {
                if (!this.pc)
                    console.log('ICE state: Connection dropped');
                else {
                    console.log('ICE state: ', this.pc.iceConnectionState);

                    if (this.plt.is('ios') && this.pc.iceConnectionState == 'connected')
                        cordova.plugins.audioroute.overrideOutput('speaker');
                }
            };
            this.pc.onicecandidate = (event) => {
                console.log('icecandidate event: ', event);
                if (event.candidate) {
                    this.socket.emit('message', {
                        type: 'candidate',
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        candidate: event.candidate.candidate
                    });
                } else {
                    console.log('End of candidates.');
                }
            };
            this.pc.onaddstream = (event) => {
                console.log('Remote stream added.');
                document.querySelector('#remoteVideo').setAttribute('src', window.URL.createObjectURL(event.stream));
                this.remoteStream = event.stream;

                this.call_status = 'In Progress';
            };

            this.pc.onremovestream = (event) => {
                console.log('Remote stream removed. Event: ', event);
            };
            console.log('Created RTCPeerConnnection');
        } catch (e) {
            console.log('Failed to create PeerConnection, exception: ' + e.message);
            alert('Cannot create RTCPeerConnection object.');
            return;
        }
    }

    setAudioOutput() {
        let tmp: any = document.querySelector('#remoteVideo');
        tmp.setSinkId(this.audio_device_id);
    }

    handleCreateOfferError(event) {
        console.log('createOffer() error: ', event);
    }

    doCall() {
        console.log('Sending offer to peer');
        this.pc.createOffer((sessionDescription) => {
            // Set Opus as the preferred codec in SDP if Opus is present.
            //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
            this.pc.setLocalDescription(sessionDescription);
            console.log('setLocalAndSendMessage sending message', sessionDescription);
            this.sendMessage(sessionDescription);
        }, (error) => {
            console.log('Failed to create session description: ' + error.toString());
        });
    }

    next_case() {
        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });

        loader.present();

        this.http.get('/localapi/queue/next_patient')
            .map(res => res.json())
            .subscribe(data => {
                loader.dismissAll();

                this.call_status = 'Pending';
                this.iceCandidates = new Array();
                if (data.status === 0) {
                    this.question_answer = data.question_answer;
                    this.photo = data.image;
                    this.case_id = data.case_id;
                } else {
                    alert('No more cases available!');
                }
            });
    }

    requestTurn(turnURL) {
        var turnExists = false;
        for (var i in this.pcConfig.iceServers) {
            if (this.pcConfig.iceServers[i].url.substr(0, 5) === 'turn:') {
                turnExists = true;
                this.turnReady = true;
                break;
            }
        }
        if (!turnExists) {
            console.log('Getting TURN server from ', turnURL);
            // No TURN server. Get one from computeengineondemand.appspot.com:
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    var turnServer = JSON.parse(xhr.responseText);
                    console.log('Got TURN server: ', turnServer);
                    this.pcConfig.iceServers.push({
                        'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
                        'credential': turnServer.password
                    });
                    this.turnReady = true;
                }
            };
            xhr.open('GET', turnURL, true);
            xhr.send();
        }
    }

    hangup() {
        console.log('Hanging up.');
        this.stop();
        this.sendMessage('bye');
    }

    handleRemoteHangup() {
        console.log('Session terminated.');
        this.stop();
        this.isInitiator = false;
    }

    stop() {
        if (this.user_type == 0)
            this.tabBarElement.style.display = 'flex';

        this.call_status = 'Finished';
        this.isStarted = false;
        // isAudioMuted = false;
        // isVideoMuted = false;
        this.pc.close();
        this.pc = null;
    }

///////////////////////////////////////////

// Set Opus as the default audio codec if it's present.
    preferOpus(sdp) {
        var sdpLines = sdp.split('\r\n');
        var mLineIndex;
        // Search for m line.
        for (var i = 0; i < sdpLines.length; i++) {
            if (sdpLines[i].search('m=audio') !== -1) {
                mLineIndex = i;
                break;
            }
        }
        if (mLineIndex === null) {
            return sdp;
        }

        // If Opus is available, set it as the default in m line.
        for (i = 0; i < sdpLines.length; i++) {
            if (sdpLines[i].search('opus/48000') !== -1) {
                var opusPayload = this.extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
                if (opusPayload) {
                    sdpLines[mLineIndex] = this.setDefaultCodec(sdpLines[mLineIndex],
                        opusPayload);
                }
                break;
            }
        }

        // Remove CN in m line and sdp.
        sdpLines = this.removeCN(sdpLines, mLineIndex);

        sdp = sdpLines.join('\r\n');
        return sdp;
    }

    extractSdp(sdpLine, pattern) {
        var result = sdpLine.match(pattern);
        return result && result.length === 2 ? result[1] : null;
    }

// Set the selected codec to the first in m line.
    setDefaultCodec(mLine, payload) {
        var elements = mLine.split(' ');
        var newLine = [];
        var index = 0;
        for (var i = 0; i < elements.length; i++) {
            if (index === 3) { // Format of media starts from the fourth.
                newLine[index++] = payload; // Put target payload to the first.
            }
            if (elements[i] !== payload) {
                newLine[index++] = elements[i];
            }
        }
        return newLine.join(' ');
    }

// Strip CN from sdp before CN constraints is ready.
    removeCN(sdpLines, mLineIndex) {
        var mLineElements = sdpLines[mLineIndex].split(' ');
        // Scan from end for the convenience of removing an item.
        for (var i = sdpLines.length - 1; i >= 0; i--) {
            var payload = this.extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
            if (payload) {
                var cnPos = mLineElements.indexOf(payload);
                if (cnPos !== -1) {
                    // Remove CN payload from m line.
                    mLineElements.splice(cnPos, 1);
                }
                // Remove CN line in sdp
                sdpLines.splice(i, 1);
            }
        }

        sdpLines[mLineIndex] = mLineElements.join(' ');
        return sdpLines;
    }
}