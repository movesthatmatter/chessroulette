// Env
const ENV = process.env.NEXT_PUBLIC_ENV as
  | 'prod'
  | 'staging'
  | 'dev'
  | 'local-dev'
  | 'vercel-dev';
const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';

// Endpoints
const SIGNALING_SERVER_CONFIG = {
  host: process.env.NEXT_PUBLIC_SIGNALING_SERVER_HOST as string,
  port: Number(process.env.NEXT_PUBLIC_SIGNALING_SERVER_PORT),
  secure: Number(process.env.NEXT_PUBLIC_SIGNALING_SERVER_SECURE) === 1,
};

const MOVEX_ENDPOINT_URL = process.env.NEXT_PUBLIC_MOVEX_ENDPOINT_URL as string;

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL as string;

// Services
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN as string | undefined;

// App
const CAMERA_ON = process.env.NEXT_PUBLIC_CAMERA_ON === 'true' || !DEBUG_MODE;

const RELEASE_VERSION =
  (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || '';

export const config = {
  ENV,
  DEBUG_MODE,
  SIGNALING_SERVER_CONFIG,
  MOVEX_ENDPOINT_URL,
  ENGINE_URL,
  CAMERA_ON,
  SENTRY_DSN,
  RELEASE_VERSION,
};

if (DEBUG_MODE) {
  console.debug('Client Config', config);
}

console.log(`Welcome to Chessroulette ${RELEASE_VERSION}!`);
