export interface GameConfig {
    id: string;
    name: string;
    description: string;
    minPlayers: number;
    maxPlayers: number;
    icon: string;
}

export const gameRegistry: GameConfig[] = [
    {
        id: 'tictactoe',
        name: 'Tic-Tac-Toe',
        description: 'Classic 3x3 grid game. Get three in a row to win!',
        minPlayers: 2,
        maxPlayers: 2,
        icon: '❌⭕',
    },
];
