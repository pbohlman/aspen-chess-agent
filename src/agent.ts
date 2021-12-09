import { Agent, Log } from '@aspen.cloud/agent-typings';

import { Chess, ChessInstance } from 'chess.js';

const chessAgent: Agent = {
  aggregations: {
    gameState: {
      initialize: (chessFen?: string) => {
        return new Chess(chessFen ?? undefined);
      },
      reducer: (game: ChessInstance, event: Log<any>) => {
        console.log(event);
        if (event.data.type === 'chess_move') {
          if (game.game_over()) {
            // if game over, say so and why
            console.log('Game over!');
            if (game.in_checkmate()) console.log(`${game.turn()} in checkmate`);
            if (game.in_draw()) console.log(`In draw`);
            if (game.in_stalemate()) console.log(`In stalemate`);
            if (game.in_threefold_repetition())
              console.log(`In threefold repetition`);
            if (game.insufficient_material())
              console.log(`Insufficient material`);
          } else {
            // otherwise, try and make a move
            const moveStr = event.data.moveStr;
            const gameId = event.data.gameId;

            if (!game.move(moveStr, { sloppy: true })) {
              // inform of an invalid move
              console.log(`${moveStr} is invalid`);
            } else {
              console.log(`moved ${moveStr} in game ${gameId}`);
              // successful moves show the board
              // console.log(game.ascii());
            }
            // in every case, indicate the current color to move
            console.log(`${game.turn()} to move`);
          }
        }
        return game;
      },
      serialize: (game: ChessInstance) => {
        return game.fen();
      },
    },
    games: {
      initialize: (games?: string[]) => new Set(games),
      reducer: (gameSet: Set<string>, event) => {
        if (event.data.type === 'new_game') {
          gameSet.add(event.data.gameId);
        }
        return gameSet;
      },
      serialize: (gameSet: Set<string>) => Array.from(gameSet.values()),
    },
  },
  views: {
    ascii: async ({ gameId }, aspen) => {
      const fen = (
        await aspen.getAggregation('gameState', {
          tags: { gameId },
          range: 'continuous',
        })
      );
      const state = new Chess(fen ?? undefined);
      return state.ascii();
    },

    fen: async ({ gameId }, aspen) => {
      const state = await aspen.getAggregation('gameState', {
        tags: { gameId },
        range: 'continuous',
      });
      return state;
    },

    moves: async ({ gameId }, aspen) => {
      const state = await aspen.getAggregation('gameState', {
        tags: { gameId },
        range: 'continuous',
      });
      return state.legalMoves;
    },

    games: async (_param, aspen) => {
      const games = await aspen.getAggregation('games', {
        range: 'continuous',
      });
      return games;
    },
  },
  actions: {
    move: async ({ moveStr, gameId }, aspen) => {
      await aspen.pushEvent(
        'chess_move',
        {
          moveStr,
          gameId,
        },
        {
          gameId,
        },
      );
      return `Tried ${moveStr} in game ${gameId}`;
    },
    newGame: async ({ gameId }, aspen) => {
      await aspen.pushEvent('new_game', {
        gameId,
      });
      return `Created new game ${gameId}`;
    },
    // randomMove: async (_param, aspen) => {
    //   const moves = await aspen.getView('moves');
    //   const move = moves.[Math.floor(Math.random()*moves.length)];
    //   await aspen.pushEvent('chess_move', {
    //     moveStr: move,
    //   });
    //   return `Tried ${move}`;
    // }
  },
  automations: {
    randomAI: {
      runOn: {
        kind: 'log-event',
        source: "",
        tags: {},
      },
      action: (evt, aspen) => {
        
      }
    }
  }
};

export default chessAgent;
