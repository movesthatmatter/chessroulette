console.log("heree");

import { reducer as roomReducer } from '@/modules/Room/movex';
import { config } from './config';
import { reducerLogger } from './lib/util';

export default {
  resources: {
    // room: roomReducer,
    // room: reducerLogger(roomReducer, 'Room Movex'),
    room: config.DEBUG_MODE
      ? reducerLogger(roomReducer, 'Room Movex')
      : roomReducer,
  },
};
