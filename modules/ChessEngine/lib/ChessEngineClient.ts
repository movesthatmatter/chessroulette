import { invoke, objectKeys } from '@/lib/misc';
import { UnsubscribeFn } from 'movex-core-util';
import { Pubsy } from 'ts-pubsy';
import { INFO_NUMBER_TYPES, REGEX } from './constants';
import {
  InfoLine,
  BestMoveUCIResponse,
  IdUCIResponse,
  OptionUCIResponse,
  UCIResponsesMap,
  UCI_Commands,
} from './types';
import { ConditionalBuffer } from './ConditionalBuffer';
import { UciEmitter } from './UciEmitter';
import { infoLineSchema } from './io';
import { ChessFEN } from '@/lib/ChessRouler';

type PubsyEventsMap = Omit<UCIResponsesMap, 'info'> & {
  infoLine: InfoLine;
};

type SearchHash = `${ChessFEN}-${number}`; // fen-depth

export class ChessEngineClient {
  public id?: IdUCIResponse;

  public isInit: boolean = false;

  private pubsy = new Pubsy<PubsyEventsMap>();

  private unsubscribers: UnsubscribeFn[] = [];

  private cachedSearches: Record<
    SearchHash,
    {
      bestMove: BestMoveUCIResponse;
      bestLine: InfoLine;
    }
  > = {};

  constructor(private uciEmitter: UciEmitter) {
    const offMsg = this.uciEmitter.onMsg((raw: string) => {
      const splitted = raw.split(' ');
      const msgType = splitted[0] as keyof UCIResponsesMap;

      if (msgType === 'info') {
        const r = infoLineSchema.safeParse(this.parseInfo(raw));

        if (r.success) {
          this.pubsy.publish('infoLine', r.data);
        }

        return;
      }

      this.pubsy.publish(
        msgType,
        invoke(() => {
          if (msgType === 'bestmove') {
            return this.parseBestMove(splitted);
          }

          // TODO: Add others

          return splitted.slice(1).join(' ');
        })
      );
    });

    this.unsubscribers.push(offMsg);
  }

  init() {
    return new Promise<InitiatedChessEngineClient>((resolve) => {
      if (this.isInit) {
        // Return early if already initiated
        console.warn(
          '[ChessEngineClient] attempted to initiate multiple times!'
        );
        return resolve(this as InitiatedChessEngineClient);
      }

      const buffer = new ConditionalBuffer<string>({
        until: (line) => line === 'uciok',
      });
      const msgHandler = (data: string) => {
        buffer.push(data);
      };

      const offMsg = this.uciEmitter.onMsg(msgHandler);

      buffer.get().then((lines) => {
        // TODO: Do something with the id and options
        const { id, options } = lines.reduce(
          (accum, nextLine) => {
            const cmdType = REGEX.cmdType.exec(nextLine)?.[1];

            if (cmdType === 'id') {
              return {
                ...accum,
                id: {
                  ...accum.id,
                  ...this.parseId(nextLine),
                },
              };
            }

            if (cmdType === 'option') {
              return {
                ...accum,
                options: {
                  ...accum.options,
                  ...this.parseOption(nextLine),
                },
              };
            }

            return accum;
          },
          {} as {
            id: IdUCIResponse;
            options: OptionUCIResponse;
          }
        );

        this.id = id;

        // Remove the listener once finished
        offMsg();

        this.isInit = true;

        // Resolve the Promise
        resolve(this as InitiatedChessEngineClient);
      });

      // Send the command to start the response buffer
      // Bypass the "isInit" error by calling the uciEmitter directly
      this.uciEmitter.cmd('uci');
    });
  }

  private parseId(line: string) {
    const parsed = REGEX.id.exec(line);
    if (!parsed || !parsed[1] || !parsed[2]) return null;
    return {
      [parsed[1]]: parsed[2],
    };
  }

  private parseOption(line: string) {
    const parsed = REGEX.option.exec(line);
    if (!parsed) {
      return null;
    }

    const option: {
      type: string;
      default?: boolean | number | string;
      options?: string[];
      min?: number;
      max?: number;
    } = {
      type: parsed[2],
    };

    switch (parsed[2]) {
      case 'check':
        option.default = parsed[3] === 'true';
        break;
      case 'spin':
        option.default = parseInt(parsed[3]);
        option.min = parseInt(parsed[4]);
        option.max = parseInt(parsed[5]);
        break;
      case 'combo':
        option.default = parsed[3];
        option.options = parsed[6].split(/ ?var ?/g);
        break; //combo breaker?
      case 'string':
        option.default = parsed[3];
        break;
      case 'button':
        //no other info
        break;
    }

    return {
      [parsed[1]]: option,
    };
  }

  // Inspired from https://github.com/ebemunk/node-uci/blob/master/src/parseUtil/parseInfo.js
  private parseInfo(line: string) {
    return objectKeys(REGEX.info).reduce((prev, nextKey) => {
      const val = REGEX.info[nextKey];
      const parsed = val.exec(line);

      if (!parsed) {
        return prev;
      }

      if (nextKey === 'score') {
        return {
          ...prev,
          [nextKey]: {
            unit: parsed[1],
            value: parseFloat(parsed[2]),
          },
        };
      }

      return {
        ...prev,
        [nextKey]: INFO_NUMBER_TYPES.includes(nextKey)
          ? parseFloat(parsed[1])
          : parsed[1],
      };
    }, {} as Partial<Record<keyof typeof REGEX.info, any>>);
  }

  private parseBestMove(line: string[]) {
    const [_, bestmove, __, ponder] = line;

    return {
      bestmove,
      ponder,
    };
  }

  on<TResponseType extends keyof PubsyEventsMap>(
    type: TResponseType,
    fn: (payload: PubsyEventsMap[TResponseType]) => void
  ) {
    return this.pubsy.subscribe(type, fn);
  }

  isReady() {
    return new Promise<void>((resolve) => {
      const unsubscribe = this.on('readyok', () => {
        // Listen for the "readyok" msg and remove the handler once received
        resolve();
        unsubscribe();
      });

      this.cmd('isready');
    });
  }

  async newGame() {
    this.cmd('ucinewgame');

    await this.isReady().then((s) => {
      // Reset the cached searches on each new game!
      this.cachedSearches = {};

      return s;
    });
  }

  private searchPosition(fen: ChessFEN) {
    this.cmd(`position`, `fen ${fen}`);
  }

  private go(opts: {
    depth: number; // 15
    // TODO: Add later
    // searchmoves: string[];
    // ponder: boolean;
  }) {
    this.cmd('go', `depth ${String(opts.depth)}`);
  }

  async search(fen: ChessFEN, depth: number = 6) {
    const hash: SearchHash = `${fen}-${depth}`;
    const cachedSearch = this.cachedSearches[hash];

    if (cachedSearch) {
      // this.pubsy.publish('bestLine', cachedSearch.bestLine);
      this.pubsy.publish('infoLine', cachedSearch.bestLine);
      this.pubsy.publish('bestmove', cachedSearch.bestMove);
      return cachedSearch;
    }

    return new Promise<{
      bestMove: BestMoveUCIResponse; // TODO: Type this
      bestLine: InfoLine;
    }>((resolve) => {
      const infoLineBuffer: InfoLine[] = [];

      const offInfoLine = this.on('infoLine', (l) => infoLineBuffer.push(l));

      // This represents the end of the search (uci go command)
      const offBestmove = this.on('bestmove', (bestMove) => {
        resolve({
          bestMove,
          bestLine: infoLineBuffer.sort((a, b) => b.depth - a.depth)[0],
        });

        offBestmove();
        offInfoLine();
      });

      this.searchPosition(fen);
      this.go({ depth });
    }).then((result) => {
      // Cache the result for further usages
      this.cachedSearches[hash] = result;

      return result;
    });
  }

  // TO be handled
  goInfinite() {}

  quit() {
    this.cmd('quit');
  }

  // TODO: Type the payloads as well
  private cmd(cmd: UCI_Commands, payload?: string) {
    if (!this.isInit) {
      // TODO: Type this better
      throw {
        errorMessage:
          '[ChessEngineClient] Attempted to send command before init!',
        cmd,
        payload,
      };
    }

    this.uciEmitter.cmd(cmd, payload);
  }

  destroy() {
    this.unsubscribers.forEach(invoke);
  }
}

export type InitiatedChessEngineClient = ChessEngineClient & {
  isInit: true;
  id: NonNullable<IdUCIResponse>;
};
