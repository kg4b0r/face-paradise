const nanoid = require('nanoid');
const moniker = require('moniker');
import {Client, Room} from "colyseus";
import {Player} from "../src/player";
import {EventType, Message} from "../src/message";
import {StateType} from "../src/state";

export class Game extends Room {
    minPlayers = 0;
    maxClients = 5;
    players: Player[] = [];
    points: 500;

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

    voteConfig      = {};
    validVoteConfig = {};

    state = {
        playerCount: 0,
        mainState: StateType.Lobby,
        gameImageList: {},
        faceImageList: {},
        voteRound: -1,
        hostSessionId: '',
        maxVoteRound: 0,
        voteConfig : {}
    };

    onInit(options) {
        this.roomId = moniker.choose();
        this.setState(this.state);
    }

    requestJoin (options, isNewRoom: boolean) {
        return (options.create)
            ? (options.create && isNewRoom)
            : this.clients.length > 0;
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
                if (this.players.length < this.minPlayers)
                {
                    this.send(client, new Message(EventType.InvalidStart, "Not enough player!!!"));
                }
                else
                {
                    this.lock();
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
                    if (Object.keys(this.players[key].gameList).length == 0) {
                        ready = false;
                    }
                }, this);

                if(ready)
                {
                    this.startVote();
                }
                break;

            case EventType.VoteUpload:
                message.data.forEach(function (item) {
                    if (this.validVoteConfig[item.gameImageId] == item.faceImageId) {
                        if(!this.players[client.sessionId].gameList.hasOwnProperty(item.gameImageId))
                        {
                            this.players[client.sessionId].score += this.points;
                        }
                    }
                }, this);
                break;

        }

       // console.log(this.players[client.sessionId]);
//        console.log("BasicRoom received message from", client.sessionId, ":", message);
        this.broadcast(`(${client.sessionId}) ${message.event}`);
    }

    startVote()
    {
        this.state.mainState = StateType.Vote;
        console.log('VOTE!!!');

        Object.keys(this.players).forEach(function(key) {
            let randomPlayerVoteKeys = Object.keys(this.players[key].gameList);
            randomPlayerVoteKeys = shuffle(randomPlayerVoteKeys);
            randomPlayerVoteKeys = randomPlayerVoteKeys.slice(0, 2);
            randomPlayerVoteKeys.forEach(function (gameImageId) {
                this.validVoteConfig[gameImageId] = this.players[key].gameList[gameImageId];
            }, this);
        }, this);

        Object.keys(this.validVoteConfig).forEach(function (gameImageId) {
            let validFaceId = this.validVoteConfig[gameImageId];
            let faceIdKeys = Object.keys(this.state.faceImageList);
            faceIdKeys = faceIdKeys.filter(item => item != validFaceId);
            faceIdKeys = shuffle(faceIdKeys);
            faceIdKeys = faceIdKeys.slice(0, 4);
            faceIdKeys.push(validFaceId);
            faceIdKeys = shuffle(faceIdKeys);
            this.voteConfig[gameImageId] = faceIdKeys;
        }, this);

        console.log(this.validVoteConfig);

        this.state.voteRound = 1;
        this.state.maxVoteRound = Object.keys(this.voteConfig).length;
        this.state.voteConfig = this.voteConfig;

        this.broadcast(new Message(EventType.NextVote,""));
    }

    sendResult() {
        this.state.mainState = StateType.Result;
        const result = Object.keys(this.players)
            .map(c => ({ faceImageId: this.players[c].faceImageId, score: this.players[c].score}))
            .sort((a, b) => a.score - b.score);

        this.broadcast(new Message(EventType.Result, result));
    }

    onDispose() {
    }

}

function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;

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
