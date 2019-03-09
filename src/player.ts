export class Player {
    avatarId: number;
    score: number = 0;
    gameList: string[] = [];
    voteList: string[] = [];

    constructor(avatarId: number) {
        this.avatarId = avatarId;
    }

    addGame(gameImageId: string, faceImageId: string): void {
        this.gameList[gameImageId] = faceImageId;
    }
}