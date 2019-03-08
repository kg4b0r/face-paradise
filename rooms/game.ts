import { Room } from "colyseus";
import {Player} from "../src/player";

export class Game extends Room {
    maxClients = 5;
    players: Player[];

    state = {
        mainState: 'lobby',
        gameImageList: [],
        faceImageList: [],
        voteRound : 0
    };

    onInit (options) {
        this.setState(this.state);
    }

    onJoin (client) {
       // this.broadcast(`${ client.sessionId } joined.`);
    }

    onLeave (client) {
       // this.broadcast(`${ client.sessionId } left.`);
    }

    onMessage (client, data) {
        // handle here: [start, avatarUpload, faceImagesUpload, voteUpload]

        switch (data.event) {
            case 'start':
                break;

            case 'avatarUpload':
                this.state.faceImageList.push(data.data);

                this.players[client.sessionId] = new Player(this.state.faceImageList.length);
                break;

            case 'faceImagesUpload':
                break;

            case 'voteUpload':
                break;

        }

        console.log("BasicRoom received message from", client.sessionId, ":", data);
        this.broadcast(`(${ client.sessionId }) ${ data.message }`);
    }

    onDispose () {
    }

}
