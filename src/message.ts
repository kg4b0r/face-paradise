export enum EventType {
    AvatarUpload = 'avatarUpload',
    Start = 'start',
    FaceImagesUpload = 'faceImagesUpload',
    VoteUpload = 'voteUpload',

    InvalidStart = 'invalidStart',
    GameConfig = 'gameConfig',
    VoteConfig = 'voteConfig',
    Result = 'result'
}

export class Message {
    event: EventType;
    data: any;

    constructor(event: EventType, data: any) {
        this.event = event;
        this.data = data;
    }
}
