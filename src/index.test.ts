import ChessAgent from './agent';
import AgentSimulator from './aspen-simulator';

describe('Passing tests', () => {
  it('can pass a test', () => {
    expect(true).toBeTruthy();
  });
});

// describe('Basic moves', async () => {
//   it('can add events to the log through actions', async () => {
//     const agent = new AgentSimulator(ChessAgent);

//     await agent.runAction('move', { color: 'white', move: 'e4' });

//     expect(agent.log).toHaveLength(1);
//   });
// });

describe('Making a new game', () => {
  it('can make multiple games', async () => {
    const agent = new AgentSimulator(ChessAgent);
    await agent.runAction('newGame', { gameId: 'abc' });
    await agent.runAction('newGame', { gameId: '123' });
    expect(agent.log).toHaveLength(2);
    const gameList = await agent.getView('games', {});
    expect(gameList).toHaveLength(2);
    console.log(gameList);
  });
});

describe('Playing one game', () => {
  it('can make a move in a specific game', async () => {
    const agent = new AgentSimulator(ChessAgent);
    const game1 = 'abc';
    await agent.runAction('newGame', { gameId: game1 });
    expect(agent.log).toHaveLength(1);
    const gameList = await agent.getView('games', {});
    expect(gameList).toHaveLength(1);
    console.log(gameList);
    await agent.runAction('move', { moveStr: 'e4', gameId: game1 });
    expect(agent.log).toHaveLength(2);
    const ascii = await agent.getView('ascii', { gameId: game1 });
    console.log(ascii);
  });
});

describe('Playing two games at once', () => {
  it('can make a move in a specific game', async () => {
    const agent = new AgentSimulator(ChessAgent);
    const game1 = 'abc';
    const game2 = '123';
    await agent.runAction('newGame', { gameId: game1 });
    await agent.runAction('newGame', { gameId: game2 });
    expect(agent.log).toHaveLength(2);
    const gameList = await agent.getView('games', {});
    expect(gameList).toHaveLength(2);
    console.log(gameList);
    await agent.runAction('move', { moveStr: 'e4', gameId: game1 });
    await agent.runAction('move', { moveStr: 'd4', gameId: game2 });
    expect(agent.log).toHaveLength(4);
    const ascii1 = await agent.getView('ascii', { gameId: game1 });
    const ascii2 = await agent.getView('ascii', { gameId: game2 });
    console.log(ascii1);
    console.log(ascii2);
  });
});

// describe('Playing a game of chass', async () => {
//   it('can update board by playing a move', async () => {
//     const agent = new AgentSimulator(ChessAgent);
//     await agent.runAction('randomMove', null);
//     expect(agent.log).toHaveLength(1);
//     const state = await agent.getAggregation('gameState', {});
//     expect(typeof state.fen).toBe('string');
//     expect(state.fen.length).toBeGreaterThan(0);
//   });

//   it('can get board state as ascii', async () => {
//     const agent = new AgentSimulator(ChessAgent);
//     await agent.runAction('randomMove', null);
//     await agent.runAction('move', 'e5');
//     expect(agent.log).toHaveLength(2);
//   });
// });
