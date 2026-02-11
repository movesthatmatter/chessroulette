import { MovexReducer } from 'movex-core-util';
import {
  ActivityActions,
  ActivityState,
  initialActivityState,
  roomActivityReducer,
} from './activities/movex';
// import { mapReducer } from '@/lib/util';

export type RoomState = {
  activity: ActivityState;
};

export const initialRoomState: RoomState = {
  activity: initialActivityState,
};

export type RoomActions = ActivityActions;

// TODO: I leave it here as I went pretty deep into this mapping of the reducer which is not too critical.
// I can simply revert to what I had before as that was working nicely no that I fixed the compose
// export const reducer = mapReducer(roomActivityReducer, (activity) => ({
//   activity,
// }));

export const reducer: MovexReducer<RoomState, RoomActions> = (
  state = initialRoomState,
  action: RoomActions
): RoomState => ({
  activity: roomActivityReducer(state.activity, action),
});

if (roomActivityReducer.$transformState) {
  const roomActivityTransformer = roomActivityReducer.$transformState;
  reducer.$transformState = (state, masterContext) => ({
    ...state,
    activity: roomActivityTransformer(state.activity, masterContext),
  });
}

// export const reducer: MovexReducer<RoomState, RoomActions> = (
//   state = initialRoomState,
//   action: RoomActions
// ): RoomState => {
//   const nextRoomState = roomReducer(state, action);

//   return {
//     // ...nextRoomState, // TODO: Bring back once it is updayeable
//     activity: roomActivityReducer(
//       nextRoomState.activity,
//       action as ActivityActions
//     ),
//   };
// };

// export const reducer = wrapReducer(
//   roomReducer,
//   (next, action) => ({
//     activity: roomActivityReducer(next.activity, action),
//   }),
//   {
//     $transformState:
//       : undefined,
//   }
// );

// reducer.$transformState = (state, masterContext) => ({
//   ...state,
//   // HACK: Apply the roomActivityReducer.$transformState
//   // TODO: Ths is a hack, because of the way I designed the reducers, all nested into the Room,
//   //  but this can be avoided with a better design!
//   ...(roomActivityReducer.$transformState && {
//     activity: roomActivityReducer.$transformState(
//       state.activity,
//       masterContext
//     ),
//   }),
// });
