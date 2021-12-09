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
            game.move(moveStr)
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
    playerMap: {
      initialize: (playerMap?: Record<string, {white: string, black:string}>) => playerMap ?? {'test' : {white: 'human', black: 'human'}},
      reducer: (playerMap: Record<string, {white: string, black:string}>, event) => {
        if (event.data.type === 'new_game') {
          const gameId = event.data.gameId
          const white = event.data.white
          const black = event.data.black
          playerMap[gameId] = {white: white, black: black}
        }
        return playerMap;
      },
      serialize: (playerMap: Record<string, {white: string, black:string}>) => playerMap,
    }
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
      return {
        ascii: state.ascii(),
        turn: state.turn(),
        inCheck: state.in_check(),
        inCheckmate: state.in_checkmate(),
        gameOver: state.game_over()
      }
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

    players: async ({gameId}, aspen) => {
      const playerMap = await aspen.getAggregation('playerMap', {
        range: 'continuous',
      });
      return playerMap[gameId]
    }
  },
  actions: {
    move: async ({ moveStr, gameId }, aspen) => {
      const fen = await aspen.getView('fen', {gameId})
      const state = new Chess(fen ?? undefined)
      if (state.move(moveStr)){
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
      }
    },
      
    newGame: async ({ gameId, white, black }, aspen) => {
      await aspen.pushEvent('new_game', {
        gameId,
        white,
        black
      });
      return `Created new game ${gameId} with white player ${white} and black player ${black}`;
    },
  },
  automations: {
    randomAI: {
      runOn: {
        kind: 'log-event',
        source: "pbohlman/chess",
        tags: {},
      },
      action: async (evt, aspen) => {
        if (evt.type === 'chess_move' || evt.type === 'new_game') {
          const gameId = evt.gameId;
          const fen = await aspen.getView('fen', {gameId})
          const players = await aspen.getView('players', {gameId});
          const state = new Chess(fen ?? undefined)
          const turn = state.turn()
          if (players.white === 'ai' && turn === 'w' ||
              players.black === 'ai' && turn === 'b') {
            const moves = state.moves()
            const move = moves[Math.floor(Math.random()*moves.length)]
            await aspen.pushEvent(
              'chess_move',
              {
                move,
                gameId,
              },
              {
                gameId,
              },
            );
          }
        }
      }
    }
  }
};

export default chessAgent;
