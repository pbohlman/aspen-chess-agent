import AgentSimulator from './aspen-simulator';
import ChessAgent from './agent';

const agent = new AgentSimulator(ChessAgent);
window.agent = agent;

async function printBoard({ gameId }) {
  const asciiBoard = await agent.getView('ascii', { gameId });
  console.log(asciiBoard);
}

window.printBoard = printBoard;

window.move = async (moveStr: string, { gameId }) => {
  await agent.runAction('move', moveStr);
  await agent.getAggregation('gameState', { tags: gameId });
};

window.randMove = async ({ gameId }) => {
  await agent.runAction('randomMove', { gameId });
  await agent.getAggregation('gameState', { tags: gameId });
};

window.newGame = async (gameId: string) => {
  await agent.runAction('newGame', { gameId });
};

// window.randGame = async () => {
//   var isOver = false
//   while (!isOver){
//     await agent.runAction('randomMove', null);
//     var state = await agent.getAggregation('gameState', null)
//     isOver = state.isOver
//   }
// }
