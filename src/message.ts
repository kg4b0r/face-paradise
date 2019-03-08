export enum EventType {
    AvatarUpload = 'avatarUpload',
    Start = 'start',
    FaceImagesUpload = 'faceImagesUpload',
    VoteUpload = 'voteUpload',
    GameConfig = 'gameConfig',
    VoteConfig = 'voteConfig',
    Result = 'result'
}

export class Message {
    event: EventType;
    data: any;
}