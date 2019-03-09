const nanoid = require('nanoid');
const moniker = require('moniker');
import {Client, Delayed, Room} from "colyseus";
import {Player} from "../src/player";
import {EventType, Message} from "../src/message";
import {StateType} from "../src/state";
import * as images from '../images.json';

export class Game extends Room {
    minPlayers = 0;
    maxClients = 5;
    points: 500;

    sourceGameImageList = [];

    voteConfigIndexes     = [];
    voteConfig      = {};
    validVoteConfig = {};

    nextVoteIntervalDelayed : Delayed;

    state = {
        playerCount: 0,
        mainState: StateType.Lobby,
        gameImageList: {},
        faceImageList: {},
        voteRound: 0,
        maxVoteRound: 0,
        voteConfig : {},
        players: {}
    };

    onInit(options) {
        this.sourceGameImageList = images;
        this.setMetadata(moniker.choose());
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

    onLeave(client)
    {
        // this.broadcast('left player: ' + client.sessionId);
        // console.log(client.sessionId);
        // this.state.playerCount--;
        // delete this.state.players[client.sessionId];
    }

    onMessage(client, message: Message) {
        switch (message.event) {
            case EventType.Start:
                if (Object.keys(this.state.players).length < this.minPlayers)
                {
                    this.send(client, new Message(EventType.InvalidStart, "Not enough player!!!"));
                }
                else
                {
                    this.lock();
                    this.state.mainState = StateType.Game;
                    let gameImageKeys = Array.from(this.sourceGameImageList.keys());
                    gameImageKeys = shuffle(gameImageKeys);
                    gameImageKeys = gameImageKeys.slice(0, Object.keys(this.state.players).length * 5);
                    gameImageKeys.forEach(function (gameImageId) {
                        this.state.gameImageList[gameImageId] = this.sourceGameImageList[gameImageId];
                    }, this);
                    this.clients.forEach(function (playerClient: Client) {
                        if (typeof this.state.players[playerClient.sessionId] !== 'undefined')
                        {
                            this.send(playerClient, new Message(EventType.GameConfig, gameImageKeys.splice(0,5)));
                        }
                    }, this);
                }
                break;

            case EventType.AvatarUpload:
                const avatarId = nanoid(8);
                this.state.faceImageList[avatarId] = message.data;

                if (Object.keys(this.state.players).length < 1)
                {
                    this.send(client, new Message(EventType.DisplayStart, ''));
                }

                this.state.players[client.sessionId] = new Player(avatarId);

                break;

            case EventType.FaceImagesUpload:
                message.data.forEach(function (item) {
                    if (typeof item.gameImageId !== 'undefined' && typeof item.faceImage !== 'undefined'
                     && item.gameImageId !== null && item.faceImage !== null) {
                        const imageId = nanoid(8);

                        this.state.faceImageList[imageId] = item.faceImage;

                        this.state.players[client.sessionId].addGame(item.gameImageId, imageId);
                    }
                }, this);

                let ready = true;

                Object.keys(this.state.players).forEach(function(key) {
                    if (Object.keys(this.state.players[key].gameList).length == 0) {
                        ready = false;
                    }
                }, this);

                if(ready && this.state.mainState == StateType.Game)
                {
                    this.state.mainState = StateType.Vote;
                    this.startVote();
                }
                break;

            case EventType.VoteUpload:
                message.data.forEach(function (item) {
                    if (this.validVoteConfig[item.gameImageId] == item.faceImageId) {
                        if(!this.state.players[client.sessionId].gameList.hasOwnProperty(item.gameImageId))
                        {
                            this.state.players[client.sessionId].score += this.points;
                        }
                    }
                }, this);

                this.state.players[client.sessionId].isVoted = true;

                let isEveryOneVoted = true;

                Object.keys(this.state.players).forEach(function(key) {
                    if (this.state.players[key].isVoted == false) {
                        isEveryOneVoted = false;
                    }
                }, this);

                if (isEveryOneVoted && this.state.mainState == StateType.Vote)
                {
                    this.state.mainState = StateType.Result;
                    this.sendResult();
                }

                break;
        }
    }

    startVote()
    {
        this.state.mainState = StateType.Vote;

        Object.keys(this.state.players).forEach(function(key) {
            let randomPlayerVoteKeys = Object.keys(this.state.players[key].gameList);
            randomPlayerVoteKeys = shuffle(randomPlayerVoteKeys);
            randomPlayerVoteKeys = randomPlayerVoteKeys.slice(0, 2);
            randomPlayerVoteKeys.forEach(function (gameImageId) {
                this.validVoteConfig[gameImageId] = this.state.players[key].gameList[gameImageId];
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
            this.voteConfigIndexes.push(gameImageId);
        }, this);

        console.log(this.validVoteConfig);

        this.state.voteRound = 0;
        this.state.maxVoteRound = Object.keys(this.voteConfig).length-1;
        this.state.voteConfig = this.voteConfig;

        this.broadcast(new Message(EventType.NextVote, {
            'gameImageId': this.voteConfigIndexes[this.state.voteRound],
            'isLast': false
        }));

        this.nextVoteIntervalDelayed = this.clock.setInterval(function (game : Game) {
            game.state.voteRound++;
            if (game.state.voteRound <= game.state.maxVoteRound)
            {
                let isLast = game.state.voteRound == game.state.maxVoteRound;
                game.broadcast(new Message(EventType.NextVote, {
                    'gameImageId': game.voteConfigIndexes[game.state.voteRound],
                    'isLast': isLast
                }));
            }
        },
            3000,
            this
        )
    }


    sendResult() {
        this.nextVoteIntervalDelayed.clear();

        const result = Object.keys(this.state.players)
            .map(c => ({ faceImageId: this.state.players[c].faceImageId, score: this.state.players[c].score}))
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
