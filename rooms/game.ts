const nanoid = require('nanoid');
import {Room} from "colyseus";
import {Player} from "../src/player";
import {EventType, Message} from "../src/message";

export class Game extends Room {
    maxClients = 5;
    players: Player[] = [];

    state = {
        mainState: 'lobby',
        playerCount: 0,
        gameImageList: {},
        faceImageList: {},
        voteRound: 0
    };

    onInit(options) {
        this.setState(this.state);
    }

    onJoin(client) {
        this.state.playerCount++;
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
                message.data.forEach(function (item) {
                    const imageId = nanoid(8);

                    this.state.faceImageList[imageId] = item.faceImage;

                    this.players[client.sessionId].addGame(item.gameImageId, imageId);
                }, this);

                let ready = true;

                Object.keys(this.players).forEach(function(key) {
                    console.log(this.players[key]);
                    if (Object.keys(this.players[key].gameList).length == 0) {
                        ready = false;
                    }
                }, this);

                if(ready)
                {
                    this.startVote(this.state);
                }
                break;

            case EventType.VoteUpload:
                break;

        }

       // console.log(this.players[client.sessionId]);
//        console.log("BasicRoom received message from", client.sessionId, ":", message);
        this.broadcast(`(${client.sessionId}) ${message.event}`);
    }

    startVote(state)
    {
        console.log('VOTE!!!');
        //console.log(state);
    }

    onDispose() {
    }

}
