import NextAuth from 'next-auth';
import { authOptions } from 'apps/xmatter-auth/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
// export const { GET, POST } = handlers;