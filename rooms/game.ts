const nanoid = require('nanoid');
import {Client, Room} from "colyseus";
import {Player} from "../src/player";
import {EventType, Message} from "../src/message";
import {StateType} from "../src/state";

export class Game extends Room {
    minPlayers = 0;
    maxClients = 5;
    players: Player[] = [];

    sourceGameImageList = [
        'base_64_image_1',
        'base_64_image_2',
        'base_64_image_3',
        'base_64_image_4',
        'base_64_image_5',
        'base_64_image_6',
        'base_64_image_7',
        'base_64_image_8',
        'base_64_image_9',
        'base_64_image_11',
        'base_64_image_12',
        'base_64_image_13',
        'base_64_image_14',
        'base_64_image_15',
        'base_64_image_16',
        'base_64_image_17',
        'base_64_image_18',
        'base_64_image_19',
        'base_64_image_21',
        'base_64_image_22',
        'base_64_image_23',
        'base_64_image_24',
        'base_64_image_25',
        'base_64_image_26',
        'base_64_image_27',
        'base_64_image_28',
        'base_64_image_29',
    ];

    state = {
        playerCount: 0,
        mainState: StateType.Lobby,
        gameImageList: [],
        faceImageList: [],
        voteRound: 0,
        hostSessionId: ''
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
                console.log(this.players.length);
                console.log(this.minPlayers);

                if (this.players.length < this.minPlayers)
                {
                    this.send(client, new Message(EventType.InvalidStart, "Not enough player!!!"));
                }
                else
                {
                    this.state.mainState = StateType.Game;
                    let gameImageKeys = Array.from(this.sourceGameImageList.keys());
                    gameImageKeys = shuffle(gameImageKeys);
                    this.clients.forEach(function (playerClient: Client) {
                        this.send(playerClient, new Message(EventType.GameConfig, gameImageKeys.splice(0,5)));
                    }, this);
                }
                break;

            case EventType.AvatarUpload:
                const avatarId = nanoid(8);
                this.state.faceImageList[avatarId] = message.data;

                this.state.hostSessionId = client.sessionId;

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

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}
