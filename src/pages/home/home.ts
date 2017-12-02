import {Component} from '@angular/core';
import {AlertController, Events, NavController, NavParams} from 'ionic-angular';
import * as io from "socket.io-client";
import {Http} from "@angular/http";
import {Platform} from 'ionic-angular';

declare var cordova: any;

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {
    evaluation: number = 5;
    case_id: number = null;

    user_type: number = 0;

    isChannelReady: boolean = false;
    isInitiator: boolean = false;
    isStarted: boolean = false;
    localStream: any;
    pc: any;
    remoteStream: any;
    turnReady: any;
    pcConfig: any = {
        iceTransportPolicy:"relay",
        'iceServers': [{
            'url': 'turn:fam-doc.com:5349?transport=tcp',
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
        video: true,
        audio: true
    };

    iceCandidates: any;

    constructor(public navCtrl: NavController, public alertCtrl: AlertController,
                public http: Http, public events: Events, public navParams: NavParams, public plt: Platform) {
        this.case_id = navParams.get('case_id');
        this.user_type = Number(window.localStorage.getItem("USER_TYPE"));
    }

    submit_evaluation($event) {
        this.http.post("/localapi/queue/submit_evaluation", {
            case_id: this.case_id,
            evaluation: this.evaluation
        }).map(res => res.json())
            .subscribe(data => {
                if (data.status === 0) {
                    alert('Evaluation submitted successfully!');
                }
            });
    }

    next_patient($event) {
        this.http.post("/localapi/queue/next_patient", {
            case_id: this.case_id
        }).map(res => res.json())
            .subscribe(data => {
                this.iceCandidates = new Array();
                if (data.status === 0) {
                    this.case_id = data.case_id;
                    alert('Case starting: ' + data.case_id);
                    this.socket.emit('create or join', this.case_id);
                    console.log('Attempted to create or  join room', this.case_id);
                } else {
                    alert('No more cases available!');
                }
            });
    }

    ionViewDidLoad() {
        if (this.plt.is('ios')) {
            cordova.plugins.iosrtc.registerGlobals();
        }

        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
            .then((stream) => {
                console.log('Adding local stream.');
                //document.querySelector('#localVideo').setAttribute('src', window.URL.createObjectURL(stream));
                this.localStream = stream;
                this.sendMessage('got user media');
            })
            .catch((e) => {
                alert('getUserMedia() error: ' + e.name);
            });

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
            this.isChannelReady = true;
            this.maybeStart();
        });

        this.socket.on('joined', (room) => {
            console.log('joined: ' + room);
            this.isChannelReady = true;
            this.maybeStart();
        });

        this.socket.on('log', (array) => {
            console.log.apply(console, array);
        });

        this.socket.on('message', (message) => {
            console.log('Client received message:', message);
            if (message === 'got user media') {
                //this.maybeStart();
            } else if (message.type === 'offer') {
                let confirm = this.alertCtrl.create({
                    title: 'Call received',
                    subTitle: 'Start video call?',
                    buttons: [
                        {
                            text: 'Yes',
                            handler: () => {
                                console.log('Call accepted');

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
                            }
                        },
                        {
                            text: 'No'
                        }
                    ]
                });
                confirm.present();
            } else if (message.type === 'answer'/* && this.isStarted*/) {
                this.pc.setRemoteDescription(new RTCSessionDescription(message));

                for (var i = 0; i < this.iceCandidates.length; i++) {
                    this.pc.addIceCandidate(this.iceCandidates[i]);
                }

            } else if (message.type === 'candidate'/* && this.isStarted*/) {
                console.log('Candidate received');
                var candidate = new RTCIceCandidate({
                    sdpMLineIndex: message.label,
                    candidate: message.candidate
                });

                console.log('Checking candidate´s IP');
                if (candidate.candidate.indexOf('139.') !== -1) {
                        console.log('Adding candidate to queue');
                        this.iceCandidates.push(candidate);
                        console.log('Candidate added to queue');
                }
            } else if (message === 'bye' && this.isStarted) {
                this.handleRemoteHangup();
            }
        });

        if (window.localStorage.getItem("USER_TYPE") == '0') {
            this.iceCandidates = new Array();
            this.http.post("/localapi/queue/start_call", {
                case_id: this.case_id
            }).map(res => res.json())
                .subscribe(data => {
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
                console.log('ICE state: ', this.pc.iceConnectionState);
            };
            this.pc.onicecandidate = (event) => {
                console.log('icecandidate event: ', event);
                if (event.candidate) {
                    if (event.candidate.candidate.indexOf('139.') !== -1) {
                        console.log('icecandidate emit: ', event);
                        this.socket.emit('message', {
                            type: 'candidate',
                            label: event.candidate.sdpMLineIndex,
                            id: event.candidate.sdpMid,
                            candidate: event.candidate.candidate
                        });
                    } else {
                        console.log('End of candidates.');
                    }
                }
            };
            this.pc.onaddstream = (event) => {
                console.log('Remote stream added.');
                document.querySelector('#remoteVideo').setAttribute('src', window.URL.createObjectURL(event.stream));
                this.remoteStream = event.stream;
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
        stop();
        this.sendMessage('bye');
    }

    handleRemoteHangup() {
        console.log('Session terminated.');
        stop();
        this.isInitiator = false;
    }

    stop() {
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

    logout(event) {
        this.http.post('/localapi/logout',
            {}
        )
            .map(res => res.json())
            .subscribe(data => {

                    if (data.status === 0) {
                        this.events.publish('user:logout');
                    } else {
                        let alert = this.alertCtrl.create({
                            title: 'Error!',
                            subTitle: 'Error logging out!',
                            buttons: ['OK']
                        });
                        alert.present();
                    }
                },
                err => {
                    let alert = this.alertCtrl.create({
                        title: 'Erro!',
                        subTitle: 'Communication error!',
                        buttons: ['OK']
                    });
                    alert.present();
                });
    }

}
