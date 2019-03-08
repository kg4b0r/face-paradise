export class Player {
    avatarId: number;
    score: number = 0;
    gameList: number[];
    voteList: number[];

    constructor(avatarId: number) {
        this.avatarId = avatarId;
    }
}