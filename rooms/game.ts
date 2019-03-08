import { Room } from "colyseus";

export class Game extends Room {
    maxClients = 5;
    votes = 1;

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
                break;

            case 'faceImagesUpload':
                break;

            case 'voteUpload':
                break;

        }

        this.votes++;
        console.log(this.votes);
        console.log("BasicRoom received message from", client.sessionId, ":", data);
        this.broadcast(`(${ client.sessionId }) ${ data.message }`);
    }

    onDispose () {
    }

}
