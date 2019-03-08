const nanoid = require('nanoid');
import {Room} from "colyseus";
import {Player} from "../src/player";
import {EventTypes, Message} from "../src/message";

export class Game extends Room {
    maxClients = 5;
    players: Player[] = [];

    state = {
        mainState: 'lobby',
        gameImageList: [],
        faceImageList: [],
        voteRound: 0
    };

    onInit(options) {
        this.setState(this.state);
    }

    onJoin(client) {
        // this.broadcast(`${ client.sessionId } joined.`);
    }

    onLeave(client) {
        // this.broadcast(`${ client.sessionId } left.`);
    }

    onMessage(client, data: Message) {
        switch (data.event) {
            case EventTypes.Start:
                break;

            case EventTypes.AvatarUpload:
                const avatarId = nanoid(8);
                this.state.faceImageList[avatarId] = data.data;

                this.players[client.sessionId] = new Player(avatarId);
                break;

            case EventTypes.FaceImagesUpload:
                break;

            case EventTypes.VoteUpload:
                break;

        }

        console.log(this.players[client.sessionId]);
        console.log("BasicRoom received message from", client.sessionId, ":", data);
        this.broadcast(`(${client.sessionId}) ${data.message}`);
    }

    onDispose() {
    }

}
