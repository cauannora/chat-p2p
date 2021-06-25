import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  ILocalAudioTrack,
} from 'agora-rtc-sdk-ng';

interface ILocalTracks {
  video: ICameraVideoTrack;
  audio: ILocalAudioTrack;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit {
  client: IAgoraRTCClient;
  uid = null;
  localTracks: ILocalTracks = { audio: null, video: null };

  constructor() {
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  }
  ngOnInit(): void {
    this.client.on('user-published', async (remoteUser, mediaType) => {
      await this.client.subscribe(remoteUser, mediaType);
      console.log('subscribe success');

      if (mediaType === 'video') {
        const remoteVideoTrack = remoteUser.videoTrack;
        const playerContainer = document.createElement('div');
        playerContainer.id = `${remoteUser.uid}`;
        playerContainer.style.width = '640px';
        playerContainer.style.height = '480px';
        document.getElementById('player').append(playerContainer);

        remoteVideoTrack.play(playerContainer);
      }

      if (mediaType === 'audio') {
        const remoteAudioTrack = remoteUser.audioTrack;
        remoteAudioTrack.play();
      }
    });
    this.client.on('user-unpublished', (remoteUser) => {
      const playerContainer = document.getElementById(`${remoteUser.uid}`);
      playerContainer.remove();
    });
  }

  async joinCall() {
    this.uid = await this.client.join(
      'INSERT APP ID HERE',
      'teste',
      null,
      this.client.uid
    );

    this.localTracks.audio = await AgoraRTC.createMicrophoneAudioTrack();
    this.localTracks.video = await AgoraRTC.createCameraVideoTrack();
    this.localTracks.video.play('myPlayer');

    Object.values(this.localTracks).map((track) => {
      if (track) this.client.publish(track);
    });
  }

  async leaveCall() {
    for (let trackName in this.localTracks) {
      var track = this.localTracks[trackName];
      if (track) {
        track.stop();
        track.close();
        this.localTracks[trackName] = null;
      }
    }

    this.client.remoteUsers.forEach((user) => {
      const playerContainer = document.getElementById(`${user.uid}`);
      playerContainer && playerContainer.remove();
    });

    await this.client.leave();
  }
}
