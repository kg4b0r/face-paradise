const nanoid = require('nanoid');
import {Room} from "colyseus";
import {Player} from "../src/player";
import {EventType, Message} from "../src/message";

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

    onMessage(client, message: Message) {
        switch (message.event) {
            case EventType.Start:
                break;

            case EventType.AvatarUpload:
                const avatarId = nanoid(8);
                this.state.faceImageList[avatarId] = message.data;

                this.players[client.sessionId] = new Player(avatarId);
                break;

            case EventType.FaceImagesUpload:
                break;

            case EventType.VoteUpload:
                break;

        }

        console.log(this.players[client.sessionId]);
        console.log("BasicRoom received message from", client.sessionId, ":", message);
        this.broadcast(`(${client.sessionId}) ${message.event}`);
    }

    onDispose() {
    }

}
