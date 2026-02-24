import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";
import { slugify } from "@/lib/utils";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  trustHost: true,

  // Use JWT strategy so we can access user data in Server Components without DB round-trips
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const isValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    // For OAuth sign-ins: auto-create a default agency if this user doesn't have one yet
    async signIn({ user, account }) {
      if (account?.provider !== "credentials" && user.id) {
        try {
          const existing = await db.agencyMember.findFirst({
            where: { userId: user.id },
          });
          if (!existing) {
            const baseName = user.name ?? user.email?.split("@")[0] ?? "My Agency";
            const baseSlug = slugify(baseName);
            let slug = baseSlug;
            let attempt = 0;
            while (await db.agency.findUnique({ where: { slug } })) {
              attempt++;
              slug = `${baseSlug}-${attempt}`;
            }
            await db.agency.create({
              data: {
                name: `${baseName}'s Agency`,
                slug,
                members: { create: { userId: user.id, role: "OWNER" } },
              },
            });
          }
        } catch (err) {
          // Log but don't block sign-in — agency can be created on first dashboard load
          console.error("[SIGNIN_AGENCY_CREATE]", err);
        }
      }
      return true;
    },

    // Attach user id and agency context to the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
      }
      return token;
    },

    // Expose token data to client-side session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
