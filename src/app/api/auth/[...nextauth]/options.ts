import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      login?: string;
      bio?: string | null;
      company?: string | null;
      location?: string | null;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    login?: string;
    bio?: string | null;
    company?: string | null;
    location?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    login?: string;
    bio?: string | null;
    company?: string | null;
    location?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          login: profile.login,
          bio: profile.bio,
          company: profile.company,
          location: profile.location,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.login = user.login;
        session.user.bio = user.bio;
        session.user.company = user.company;
        session.user.location = user.location;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.login = user.login;
        token.bio = user.bio;
        token.company = user.company;
        token.location = user.location;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
