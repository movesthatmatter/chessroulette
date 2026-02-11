import { Twilio } from 'twilio';
import { serverConfig } from '../config/config.server';
import { IceServerRecord } from '../modules/PeerToPeer/providers/PeerToPeerProvider/type';
import { config } from '../config';

const twilioClient: any = new Twilio(
  serverConfig.twilio.TWILIO_ACCOUNT_SID,
  serverConfig.twilio.TWILIO_AUTH_TOKEN
);

const DEFAULT_ICE_SERVERS = [
  {
    url: 'stun:stun.ideasip.com',
    urls: 'stun:stun.ideasip.com',
    credential: undefined,
    username: undefined,
  },
];

export const twilio = {
  DEFAULT_ICE_SERVERS,
  getIceServers: async (): Promise<IceServerRecord[]> => {
    try {
      if (!config.CAMERA_ON) {
        throw 'Camera off - meant to catch!';
      }

      return (await twilioClient.tokens.create()).iceServers;
    } catch {
      // Return the defaults if no connection or other error
      return DEFAULT_ICE_SERVERS;
    }
  },
};
