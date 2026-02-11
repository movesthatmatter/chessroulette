import { config } from './config.client';

export const serverConfig = {
  auth: {
    JWT_SECRET: process.env.AUTH_JWT_SECRET as string,
    EMAIL_SERVER_HOST: process.env.AUTH_EMAIL_SERVER_HOST as string,
    EMAIL_SERVER_USER: process.env.AUTH_EMAIL_SERVER_USER as string,
    EMAIL_SERVER_PASSWORD: process.env.AUTH_EMAIL_SERVER_PASSWORD as string,
    EMAIL_SERVER_PORT: Number(process.env.AUTH_EMAIL_SERVER_PORT as string),
    EMAIL_FROM: process.env.AUTH_EMAIL_FROM as string,
  },
  twilio: {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID as string,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN as string,
  },
};

if (config.DEBUG_MODE) {
  console.log('Server Config', serverConfig);
}
