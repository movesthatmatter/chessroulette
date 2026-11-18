import { ChessColor } from '@xmatter/util-kit';
import Cookies from 'js-cookie';
export function getMovesDetailsFromPGN(pgn: string): {
  totalMoves: number;
  lastMoveBy: ChessColor | undefined;
} {
  if (pgn.length === 0) {
    return {
      totalMoves: 0,
      lastMoveBy: undefined,
    };
  }

  // algorithm logic by chatGPT
  const tokens = pgn
    .split(/\s+/)
    .filter(
      (token) =>
        !/^\d+\.$/.test(token) && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token)
    );

  return {
    totalMoves: Math.ceil(tokens.length / 2),
    lastMoveBy: tokens.length % 2 === 0 ? 'b' : 'w',
  };
}

let movexUpdateQueue = Promise.resolve();
export function enqueueMovexUpdatePlay<T>(
  updateFn: () => Promise<T> | void
): Promise<void> {
  movexUpdateQueue = movexUpdateQueue
    .then(async () => {
      await updateFn();
      // dispatch() returns void immediately but Movex does async work internally
      // (server roundtrip + syncState). Without this delay all queued dispatches
      // fire in the same event loop tick → "PromiseDelegate is already settled"
      await new Promise<void>((resolve) => setTimeout(resolve, 150));
    })
    .catch((err) => console.error('Error in Movex update:', err));

  return movexUpdateQueue;
}

export async function ai_prompt(
  question: string,
  activeBotName?: string,
  previusMessageId?: string
) {
  const token = Cookies.get('sessionToken');

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + `ai_prompt_agent_v2`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agent_name: activeBotName,
          prompt: question,
          previous_response_id: previusMessageId || '',
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return data?.message || `Error: ${response.status}`;
    }
    return data;
  } catch (error) {
    console.error('Fetch error', error);
  }
}
export async function getUserInfo() {
  const token = Cookies.get('sessionToken');
  if (!token) {
    console.log('token error');
    return;
  }
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + 'current_user_info',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Fetch error', error);
  }
}
export async function getBotRating() {
  const token = Cookies.get('sessionToken');
  if (!token) {
    return;
  }
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + 'bots_data',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Fetch error', error);
  }
}

export const findIfBots = (challengeeId: string, challengerId: string) => {
  const idsToCheck = [challengeeId, challengerId].filter(Boolean);

  const bot = chatBotList.find((b) => idsToCheck.includes(b.id));

  return bot;
};

export const getMakeFakeName = () => {
  const pathParts = window.location.pathname.split('/');
  const matchId = pathParts[pathParts.length - 1];
  let result = '';
  for (let i = 0; i < matchId.length; i++) {
    const charCode = matchId.charCodeAt(i);
    result += charCode % 10;
  }
  const name = 'Guest ' + result;
  const fakeBot = {
    id: 'TbN0mQQJy8s2-',
    name: name,
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 4,
  };
  return fakeBot;
};

export const chatBotList = [
  {
    id: '_TjQM58i13jmm000',
    name: 'Obbina',
    lastName: 'Okafor',
    picture: 'https://api.outpostchess.com/upload/w_250,ao_1/https://outpostchess.fra1.digitaloceanspaces.com/f5907c84-ea34-4b21-8db9-e09290f1fd39.png',
    botType: 'botelja',
  },
  {
    id: 'zldVhT0HMLRc1000',
    name: 'Yuki',
    lastName: 'Nakata',
    picture: 'https://outpostchess.fra1.digitaloceanspaces.com/25570bf4-bda0-4750-b3d2-924485838a0f.png',
    botType: 'botelja',
  },
  {
    id: '9yzBb59_POb9L000',
    name: 'Viola',
    lastName: 'Boticelli',
    picture:
      'https://api.outpostchess.com/upload/w_64,ao_1/https://outpostchess.fra1.digitaloceanspaces.com/2153132f-0e18-4778-b619-12e3e058da68.png',
    botType: 'botelja',
  },
  {
    id: '9aEXYS0xwZS21000',
    name: 'Stella',
    lastName: 'Frustain',
    picture:
      'https://api.outpostchess.com/upload/w_64,ao_1/https://outpostchess.fra1.digitaloceanspaces.com/2f2d0621-f741-4ee3-83a7-b75db533c4b6.png',
    botType: 'botelja',
  },
  {
    id: 'fH0667J9nJ1Ez000',
    name: 'Margareta',
    lastName: 'Boncwik',
    picture:
      'https://api.outpostchess.com/upload/w_64,ao_1/https://outpostchess.fra1.digitaloceanspaces.com/66922ae6-fd30-42d4-8137-a03713b34563.png',
    botType: 'botelja',
  },
  {
    id: '-BihTlRZ-SKTL000',
    name: 'Laura',
    lastName: 'Stein',
    picture:
      'https://api.outpostchess.com/upload/w_64,ao_1/https://outpostchess.fra1.digitaloceanspaces.com/bb7350ac-c63b-44a8-b68e-700a8bab9e48.png',
    botType: 'botelja',
  },
  {
    id: 'Pjdw8gu5kpiRk000',
    name: 'Damian',
    lastName: 'Petersson',
    picture:
      'https://api.outpostchess.com/upload/w_64,ao_1/https://outpostchess.fra1.digitaloceanspaces.com/9b54c468-1718-45a2-b6a3-7b2909c35a20.png',
    botType: 'botelja',
  },
  {
    id: '8WCVE7ljCQJTW020',
    name: 'Botsworth',
    lastName: 'Smith',
    picture:
      'https://outpostchess.fra1.digitaloceanspaces.com/24c74ef4-7788-472c-b4b7-f1fbadb91418.webp',
    botType: 'basic',
  },
  {
    id: 'NaNuXa7Ew8Kac002',
    name: 'Botvik',
    lastName: 'Johansen',
    picture:
      'https://outpostchess.fra1.digitaloceanspaces.com/c48b09df-d50f-4c5c-a0ce-359fa8a0b21a.webp',
    botType: 'basic',
  },
  {
    id: 'O8kiLgwcKJWy9005',
    name: 'Botelia',
    lastName: 'Fernandez',
    picture:
      'https://outpostchess.fra1.digitaloceanspaces.com/9210a0dc-7a72-48fd-8b94-473661402d44.webp',
    botType: 'basic',
  },
  {
    id: 'KdydnDHbBU1JY008',
    name: 'Botaraj',
    lastName: 'Singh',
    picture:
      'https://outpostchess.fra1.digitaloceanspaces.com/75c36151-6a8a-4e02-ac7e-fc97e07d27b5.webp',
    botType: 'basic',
  },
  {
    id: 'vpHH6Jf7rYKwN010',
    name: 'Botxiang',
    lastName: 'Li',
    picture:
      'https://outpostchess.fra1.digitaloceanspaces.com/4d76d0f2-879d-4763-8928-fca49ffe04f3.webp',
    botType: 'basic',
  },
  {
    id: 'Y5MbWjWjIVQZw',
    name: 'Amara',
    lastName: 'Diallo',
    picture: '',
    botType: 'matchFake',
    level: 1,
  },
  {
    id: 'sl0BRsRcmd1RX',
    name: 'Kwame',
    lastName: 'Asante',
    picture: '',
    botType: 'matchFake',
    level: 2,
  },
  {
    id: 'CrARTofbHqDrb',
    name: 'Fatima',
    lastName: 'Okafor',
    picture: '',
    botType: 'matchFake',
    level: 3,
  },
  {
    id: 'Z9AqXjzkMYgd-',
    name: 'Seun',
    lastName: 'Adeyemi',
    picture: '',
    botType: 'matchFake',
    level: 4,
  },
  {
    id: 'X3r6UTx627ZoG',
    name: 'Nadia',
    lastName: 'Mensah',
    picture: '',
    botType: 'matchFake',
    level: 5,
  },
  {
    id: 'CLeUBmNBqlQfX',
    name: 'Wei',
    lastName: 'Zhang',
    picture: '',
    botType: 'matchFake',
    level: 6,
  },
  {
    id: 'M51vZsaExoX9C',
    name: 'Yuki',
    lastName: 'Tanaka',
    picture: '',
    botType: 'matchFake',
    level: 7,
  },
  {
    id: '2C9NmRvfaRVj9',
    name: 'Hana',
    lastName: 'Kim',
    picture: '',
    botType: 'matchFake',
    level: 8,
  },
  {
    id: '91NoBxnln7MOt',
    name: 'Jian',
    lastName: 'Liu',
    picture: '',
    botType: 'matchFake',
    level: 1,
  },
  {
    id: '3s7vuKkkbpgul',
    name: 'Min-jun',
    lastName: 'Park',
    picture: '',
    botType: 'matchFake',
    level: 2,
  },
  {
    id: 'YvxAjFrAa6oHR',
    name: 'Priya',
    lastName: 'Sharma',
    picture: '',
    botType: 'matchFake',
    level: 3,
  },
  {
    id: 'hIdXS7Ab7DhSY',
    name: 'Arjun',
    lastName: 'Patel',
    picture: '',
    botType: 'matchFake',
    level: 4,
  },
  {
    id: 'uBGlS5JqsokIE',
    name: 'Sneha',
    lastName: 'Reddy',
    picture: '',
    botType: 'matchFake',
    level: 5,
  },
  {
    id: 'UlRx1Uy6RLPYd',
    name: 'Rajan',
    lastName: 'Nair',
    picture: '',
    botType: 'matchFake',
    level: 6,
  },
  {
    id: 'oLgZm3Vrj5nWP',
    name: 'Siti',
    lastName: 'Rahmat',
    picture: '',
    botType: 'matchFake',
    level: 7,
  },
  {
    id: 'mDq4toCnzWVvL',
    name: 'Batu',
    lastName: 'Erdene',
    picture: '',
    botType: 'matchFake',
    level: 8,
  },
  {
    id: '9DnY3r7_DwAV5',
    name: 'Sofia',
    lastName: 'Andersen',
    picture: '',
    botType: 'matchFake',
    level: 1,
  },
  {
    id: 'lBMjWlJsDwkHK',
    name: 'Lukas',
    lastName: 'Müller',
    picture: '',
    botType: 'matchFake',
    level: 2,
  },
  {
    id: 'RmB8Xld9MDixi',
    name: 'Isabelle',
    lastName: 'Dupont',
    picture: '',
    botType: 'matchFake',
    level: 3,
  },
  {
    id: 'sxu-t30QhMqI0',
    name: 'Carlos',
    lastName: 'Fernández',
    picture: '',
    botType: 'matchFake',
    level: 4,
  },
  {
    id: 'IIqk2Cql8Yx0W',
    name: 'Emma',
    lastName: 'Johansson',
    picture: '',
    botType: 'matchFake',
    level: 5,
  },
  {
    id: 'cBPkhSs8bDSfd',
    name: 'Marco',
    lastName: 'Rossi',
    picture: '',
    botType: 'matchFake',
    level: 6,
  },
  {
    id: 'fsNdGdpTw00X7',
    name: 'Olena',
    lastName: 'Kovalenko',
    picture: '',
    botType: 'matchFake',
    level: 7,
  },
  {
    id: 'z1zD7JuTp7LbR',
    name: 'Dmitri',
    lastName: 'Volkov',
    picture: '',
    botType: 'matchFake',
    level: 8,
  },
  {
    id: '5BCNTngCHKiRt',
    name: 'Agnieszka',
    lastName: 'Kowalski',
    picture: '',
    botType: 'matchFake',
    level: 1,
  },
  {
    id: 'bJMXJZCR0rIR9',
    name: 'Bogdan',
    lastName: 'Ionescu',
    picture: '',
    botType: 'matchFake',
    level: 2,
  },
  {
    id: '5CbR6JvDUQeUU',
    name: 'Nikos',
    lastName: 'Papadopoulos',
    picture: '',
    botType: 'matchFake',
    level: 3,
  },
  {
    id: 'yctfJ0YdymR2r',
    name: 'Ana',
    lastName: 'Pereira',
    picture: '',
    botType: 'matchFake',
    level: 4,
  },
  {
    id: 'gDC3H0sbisXhx',
    name: 'Michael',
    lastName: 'Johnson',
    picture: '',
    botType: 'matchFake',
    level: 5,
  },
  {
    id: 'MfsWkvLqWP9Gc',
    name: 'Ashley',
    lastName: 'Williams',
    picture: '',
    botType: 'matchFake',
    level: 6,
  },
  {
    id: 'VvIkhmT3javRO',
    name: 'Tyler',
    lastName: 'Brown',
    picture: '',
    botType: 'matchFake',
    level: 7,
  },
  {
    id: 'RYcntqbRYQIaE',
    name: 'Mia',
    lastName: 'Davis',
    picture: '',
    botType: 'matchFake',
    level: 8,
  },
  {
    id: 'm9PHH2_v4p0__',
    name: 'Jorge',
    lastName: 'Ramirez',
    picture: '',
    botType: 'matchFake',
    level: 1,
  },
  {
    id: 'axhNc9rbizcWZ',
    name: 'Camila',
    lastName: 'Herrera',
    picture: '',
    botType: 'matchFake',
    level: 2,
  },
  {
    id: '8SIzzgmr2tIyN',
    name: 'Lucas',
    lastName: 'Oliveira',
    picture: '',
    botType: 'matchFake',
    level: 3,
  },
  {
    id: 'kvXf4jgY71kgG',
    name: 'Valentina',
    lastName: 'García',
    picture: '',
    botType: 'matchFake',
    level: 4,
  },
  {
    id: '4qIlM6r556ktf',
    name: 'Rodrigo',
    lastName: 'Silva',
    picture: '',
    botType: 'matchFake',
    level: 5,
  },
  {
    id: 'YipTDBjodBR_X',
    name: 'Liam',
    lastName: "O'Brien",
    picture: '',
    botType: 'matchFake',
    level: 6,
  },
  {
    id: 'GZCnLZvv507t_',
    name: 'Sophie',
    lastName: 'Nguyen',
    picture: '',
    botType: 'matchFake',
    level: 7,
  },
  {
    id: 'w8Mo6rK8cKpxB',
    name: 'James',
    lastName: 'Walker',
    picture: '',
    botType: 'matchFake',
    level: 8,
  },
  {
    id: 'PgMnNKvYKzH2N',
    name: 'Layla',
    lastName: 'Al-Rashid',
    picture: '',
    botType: 'matchFake',
    level: 1,
  },
  {
    id: '1KR7Hm_JxkPyM',
    name: 'Omar',
    lastName: 'Hassan',
    picture: '',
    botType: 'matchFake',
    level: 2,
  },
  {
    id: 't5fj0K212v4Vp',
    name: 'Yasmin',
    lastName: 'Khalil',
    picture: '',
    botType: 'matchFake',
    level: 3,
  },
  {
    id: 'd7vmk4w5EzOFS',
    name: 'Aigerim',
    lastName: 'Bekova',
    picture: '',
    botType: 'matchFake',
    level: 4,
  },
  {
    id: 'qZwz-J1zqevft',
    name: 'Temur',
    lastName: 'Rashidov',
    picture: '',
    botType: 'matchFake',
    level: 5,
  },
  {
    id: 'VRP7uLFmC7iHJ',
    name: 'Nguyen',
    lastName: 'Thanh',
    picture: '',
    botType: 'matchFake',
    level: 6,
  },
  {
    id: 'iud5uEh7Kmkds',
    name: 'Maria',
    lastName: 'Santos',
    picture: '',
    botType: 'matchFake',
    level: 7,
  },
  {
    id: 'WQ0D2BXPkh5IO',
    name: 'Daniela',
    lastName: 'Cruz',
    picture: '',
    botType: 'matchFake',
    level: 8,
  },
  {
    id: 'lM6jZXMCnE5nw',
    name: 'Martín',
    lastName: 'Vargas',
    picture: '',
    botType: 'matchFake',
    level: 1,
  },
  {
    id: 'hLyaWMRkXAU0p',
    name: 'Ingrid',
    lastName: 'Larsen',
    picture: '',
    botType: 'matchFake',
    level: 2,
  },
  {
    id: '4zS5kX_-_2alW',
    name: 'Mikael',
    lastName: 'Virtanen',
    picture: '',
    botType: 'matchFake',
    level: 3,
  },
  {
    id: 'TbN0mQQJy8s2-',
    name: 'Sajko',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 4,
  },
  // matchFake botovi sa nadimcima (novembar 2026)
  {
    id: 'tDZQZbXQWjpdc',
    name: 'Golu',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 1,
  },
  {
    id: 'kNvDoEDKsXEfT',
    name: 'Mei',
    lastName: 'Mei',
    picture: '',
    botType: 'matchFake',
    level: 1,
  },
  {
    id: 'iRiiDZ7VZ1or2',
    name: 'Jojo',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 1,
  },
  {
    id: 'CeHDcBLJ30w4U',
    name: 'Pipe',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 1,
  },
  {
    id: 'RIGRlam2bmjak',
    name: 'Bisi',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 1,
  },
  {
    id: '8Jv4VtbF0YvHB',
    name: 'Ucok',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 1,
  },
  {
    id: 'GiLtHGFhjWaMy',
    name: 'Toto',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 1,
  },
  {
    id: 'z4ppKYBDM-TH1',
    name: 'Gigi',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 1,
  },
  {
    id: 'UK1RqMFuWtOVG',
    name: 'Chintu',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 2,
  },
  {
    id: 'A_SQ-ZW0cGUM8',
    name: 'Bora',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 2,
  },
  {
    id: 'nyElJSbKfGK2E',
    name: 'Kuba',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 2,
  },
  {
    id: 'C16AN-JXVLb6J',
    name: 'Cami',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 2,
  },
  {
    id: 'BB-a0gjGm6Nw2',
    name: 'Kojo',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 2,
  },
  {
    id: 'KdCyRyM8FdyxL',
    name: 'Putu',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 2,
  },
  {
    id: 'cLF3lOaDVviwb',
    name: 'Jun',
    lastName: 'Jun',
    picture: '',
    botType: 'matchFake',
    level: 2,
  },
  {
    id: 'IVKAXHRpW3WCM',
    name: 'Zeca',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 2,
  },
  {
    id: 'iveYg-bxsGTyd',
    name: 'Abi',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 2,
  },
  {
    id: '6kMHE72pa5cyc',
    name: 'Pinky',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 3,
  },
  {
    id: 'MigN-KbqNgh-B',
    name: 'Ah',
    lastName: 'Ming',
    picture: '',
    botType: 'matchFake',
    level: 3,
  },
  {
    id: 'da5ukYipJqTEn',
    name: 'Bram',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 3,
  },
  {
    id: 'rXKlpPSG916vN',
    name: 'Chucho',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 3,
  },
  {
    id: 'UYl5qU2ljDLAa',
    name: 'Tunde',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 3,
  },
  {
    id: 'n1EvIqhrPQ6q6',
    name: 'Komang',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 3,
  },
  {
    id: 'TgavtLAHEQPey',
    name: 'Bong',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 3,
  },
  {
    id: '6HVvdA05ERg4G',
    name: 'Flo',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 3,
  },
  {
    id: '0NiQjGoD1VDBo',
    name: 'Lindi',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 3,
  },
  {
    id: 'rUH02uaGGtH0A',
    name: 'Bunty',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 4,
  },
  {
    id: 'T19j2BMQQbGO0',
    name: 'Hyuni',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 4,
  },
  {
    id: 'RJonuA2yAiA_Q',
    name: 'Paco',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 4,
  },
  {
    id: 'zPU2FyGQSZ99s',
    name: 'Juanfe',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 4,
  },
  {
    id: 'oZ5p9jHLOQKlM',
    name: 'Kip',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 4,
  },
  {
    id: 'thxYnlrKB4F3h',
    name: 'Ate',
    lastName: 'Joy',
    picture: '',
    botType: 'matchFake',
    level: 4,
  },
  {
    id: 'bgtohArQhaqpg',
    name: 'Lasse',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 4,
  },
  {
    id: 'yUU8LdQ02dHMH',
    name: 'Raju',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 5,
  },
  {
    id: 'SffuZCvpUtX9c',
    name: 'Xiao',
    lastName: 'Long',
    picture: '',
    botType: 'matchFake',
    level: 5,
  },
  {
    id: 'KAuF2ZLCXlU9g',
    name: 'Takis',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 5,
  },
  {
    id: 'wAxf7uWpgUToH',
    name: 'La',
    lastName: 'Mona',
    picture: '',
    botType: 'matchFake',
    level: 5,
  },
  {
    id: 'XnvvMmAtk-XtI',
    name: 'Chidi',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 5,
  },
  {
    id: 'NYQBEMcRlYzq5',
    name: 'Mas',
    lastName: 'Bayu',
    picture: '',
    botType: 'matchFake',
    level: 5,
  },
  {
    id: 'N7rsCwC1EjBma',
    name: 'Jae',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 6,
  },
  {
    id: 'zi4kjAca8R2Cq',
    name: 'Cile',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 6,
  },
  {
    id: 'Guks4e3r3kp25',
    name: 'Thabo',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 6,
  },
  {
    id: 'IW-1aBPSQ5chX',
    name: 'Kuya',
    lastName: 'Ben',
    picture: '',
    botType: 'matchFake',
    level: 6,
  },
  {
    id: 'QgaOJemeweaLJ',
    name: 'Minho',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 7,
  },
  {
    id: '8NLO53rhXqltU',
    name: 'Nacho',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 7,
  },
  {
    id: 'yF1VWlF2BM4ZJ',
    name: 'Ebuka',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 7,
  },
  {
    id: 'IESYiZ29M4K_A',
    name: 'Modou',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 7,
  },
  {
    id: 'G6FYYN5xMJ1DR',
    name: 'Lao',
    lastName: 'Wang',
    picture: '',
    botType: 'matchFake',
    level: 8,
  },
  {
    id: 'HQBwob4iw4iRH',
    name: 'Basti',
    lastName: '',
    picture: '',
    botType: 'matchFake',
    level: 8,
  },
  {
    id: 'lTT8wriV1uM22',
    name: 'Nana',
    lastName: 'K',
    picture: '',
    botType: 'matchFake',
    level: 8,
  },
];

// {
//     id: '30474046-2779-11f1-90f3-4eb0dee0fbb1',
//     name: 'Amara',
//     lastName: 'Diallo',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//    {
//     id: 'eabcc300-277a-11f1-9145-4eb0dee0fbb1',
//     name: 'Kwame',
//     lastName: 'Asante',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//   {
//     id: 'bce82810-277b-11f1-9dd5-4eb0dee0fbb1',
//     name: 'Fatima',
//     lastName: 'Okafor',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//   {
//     id: 'da24ffa2-277b-11f1-964c-4eb0dee0fbb1',
//     name: 'Seun',
//     lastName: 'Adeyemi',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//   {
//     id: '0d675982-277c-11f1-a308-4eb0dee0fbb1',
//     name: 'Nadia',
//     lastName: 'Mensah',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//   {
//     id: '340cdabc-277c-11f1-93c2-4eb0dee0fbb1',
//     name: 'Wei',
//     lastName: 'Zhang',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//   {
//     id: '6c23b01a-277c-11f1-9321-4eb0dee0fbb1',
//     name: 'Yuki',
//     lastName: 'Tanaka',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//   {
//     id: '8ba570c2-277c-11f1-8715-4eb0dee0fbb1',
//     name: 'Hana',
//     lastName: 'Kim',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//   {
//     id: 'a58c8cea-277d-11f1-a26c-4eb0dee0fbb1',
//     name: 'Jian',
//     lastName: 'Liu',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//   {
//     id: '7c5710aa-277f-11f1-8bd9-4eb0dee0fbb1',
//     name: 'Min-jun',
//     lastName: 'Park',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//   {
//     id: '3f337fb4-2780-11f1-96ca-4eb0dee0fbb1',
//     name: 'Priya',
//     lastName: 'Sharma',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//   {
//     id: '79c804ec-2780-11f1-b34b-4eb0dee0fbb1',
//     name: 'Arjun',
//     lastName: 'Patel',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//    {
//     id: 'ac7955b2-2780-11f1-8884-4eb0dee0fbb1',
//     name: 'Sneha',
//     lastName: 'Reddy',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//    {
//     id: 'd3e29884-2780-11f1-b34b-4eb0dee0fbb1',
//     name: 'Rajan',
//     lastName: 'Nair',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//    {
//     id: 'd47aea58-2780-11f1-b34b-4eb0dee0fbb1',
//     name: 'Siti',
//     lastName: 'Rahmat',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//   {
//     id: 'd513fb12-2780-11f1-923e-4eb0dee0fbb1',
//     name: 'Batu',
//     lastName: 'Erdene',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//   {
//     id: 'd5ac2bb2-2780-11f1-923e-4eb0dee0fbb1',
//     name: 'Sofia',
//     lastName: 'Andersen',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//   {
//     id: '8a9dc3f8-27d3-11f1-bb6c-4eb0dee0fbb1',
//     name: 'Lukas',
//     lastName: 'Müller',
//     picture:
//       '',
//     botType:'matchFake',
//   },

//   {
//     id: 'd6dd3904-2780-11f1-923e-4eb0dee0fbb1',
//     name: 'Isabelle',
//     lastName: 'Dupont',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//  {
//     id: '73328b30-27d4-11f1-92d8-4eb0dee0fbb1',
//     name: 'Carlos',
//     lastName: 'Fernández',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//   {
//     id: 'd810046e-2780-11f1-923e-4eb0dee0fbb1',
//     name: 'Emma',
//     lastName: 'Johansson',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//   {
//     id: 'd8a703c8-2780-11f1-b34b-4eb0dee0fbb1',
//     name: 'Marco',
//     lastName: 'Rossi',
//     picture:
//       '',
//     botType:'matchFake',
//   },
//   { id: "d940e75e-2780-11f1-b34b-4eb0dee0fbb1", name: "Olena", lastName: "Kovalenko", picture: "", botType: "matchFake" },
//   { id: "d9d83f78-2780-11f1-a999-4eb0dee0fbb1", name: "Dmitri", lastName: "Volkov", picture: "", botType: "matchFake" },
//   { id: "da712a12-2780-11f1-923e-4eb0dee0fbb1", name: "Agnieszka", lastName: "Kowalski", picture: "", botType: "matchFake" },
//   { id: "db0f8e1e-2780-11f1-989c-4eb0dee0fbb1", name: "Bogdan", lastName: "Ionescu", picture: "", botType: "matchFake" },
//   { id: "dba2a870-2780-11f1-b230-4eb0dee0fbb1", name: "Nikos", lastName: "Papadopoulos", picture: "", botType: "matchFake" },
//   { id: "dc3bbb28-2780-11f1-b230-4eb0dee0fbb1", name: "Ana", lastName: "Pereira", picture: "", botType: "matchFake" },
//   { id: "dcd3c922-2780-11f1-b230-4eb0dee0fbb1", name: "Michael", lastName: "Johnson", picture: "", botType: "matchFake" },
//   { id: "dd6ba3b4-2780-11f1-989c-4eb0dee0fbb1", name: "Ashley", lastName: "Williams", picture: "", botType: "matchFake" },
//   { id: "de05eb4a-2780-11f1-989c-4eb0dee0fbb1", name: "Tyler", lastName: "Brown", picture: "", botType: "matchFake" },
//   { id: "de9cfc06-2780-11f1-b230-4eb0dee0fbb1", name: "Mia", lastName: "Davis", picture: "", botType: "matchFake" },
//   { id: "df362322-2780-11f1-b230-4eb0dee0fbb1", name: "Jorge", lastName: "Ramirez", picture: "", botType: "matchFake" },
//   { id: "dfce93c8-2780-11f1-b34b-4eb0dee0fbb1", name: "Camila", lastName: "Herrera", picture: "", botType: "matchFake" },
//   { id: "e0675ca2-2780-11f1-b230-4eb0dee0fbb1", name: "Lucas", lastName: "Oliveira", picture: "", botType: "matchFake" },
//   { id: "fbef2748-27d5-11f1-8002-4eb0dee0fbb1", name: "Valentina", lastName: "García", picture: "", botType: "matchFake" },
//   { id: "e198a234-2780-11f1-b34b-4eb0dee0fbb1", name: "Rodrigo", lastName: "Silva", picture: "", botType: "matchFake" },
//   { id: "859e9a1e-27d6-11f1-9f98-4eb0dee0fbb1", name: "Liam", lastName: "O'Brien", picture: "", botType: "matchFake" },
//   { id: "e2c9c480-2780-11f1-b34b-4eb0dee0fbb1", name: "Sophie", lastName: "Nguyen", picture: "", botType: "matchFake" },
//   { id: "e3616ff6-2780-11f1-989c-4eb0dee0fbb1", name: "James", lastName: "Walker", picture: "", botType: "matchFake" },
//   { id: "e3faa25c-2780-11f1-989c-4eb0dee0fbb1", name: "Layla", lastName: "Al-Rashid", picture: "", botType: "matchFake" },
//   { id: "e4937e0a-2780-11f1-b34b-4eb0dee0fbb1", name: "Omar", lastName: "Hassan", picture: "", botType: "matchFake" },
//   { id: "e52bf428-2780-11f1-8dbd-4eb0dee0fbb1", name: "Yasmin", lastName: "Khalil", picture: "", botType: "matchFake" },
//   { id: "e5c3b100-2780-11f1-8dbd-4eb0dee0fbb1", name: "Aigerim", lastName: "Bekova", picture: "", botType: "matchFake" },
//   { id: "e65c840c-2780-11f1-8dbd-4eb0dee0fbb1", name: "Temur", lastName: "Rashidov", picture: "", botType: "matchFake" },
//   { id: "e6f5c676-2780-11f1-b230-4eb0dee0fbb1", name: "Nguyen", lastName: "Thanh", picture: "", botType: "matchFake" },
//   { id: "e78e4720-2780-11f1-b34b-4eb0dee0fbb1", name: "Maria", lastName: "Santos", picture: "", botType: "matchFake" },
//   { id: "e8272328-2780-11f1-9299-4eb0dee0fbb1", name: "Daniela", lastName: "Cruz", picture: "", botType: "matchFake" },
//   { id: "81888f5e-2815-11f1-905b-4eb0dee0fbb1", name: "Martín", lastName: "Vargas", picture: "", botType: "matchFake" },
//   { id: "e95d780a-2780-11f1-b34b-4eb0dee0fbb1", name: "Ingrid", lastName: "Larsen", picture: "", botType: "matchFake" },
//   { id: "e9f10160-2780-11f1-b34b-4eb0dee0fbb1", name: "Mikael", lastName: "Virtanen", picture: "", botType: "matchFake" },
