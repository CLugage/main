// src/pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export default NextAuth({
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            authorization: {
                url: 'https://discord.com/oauth2/authorize',
                params: { grant_type: 'authorization_code' },
            },
            // Optional: Specify the redirect URI
            redirectUri: process.env.NEXTAUTH_URL + "/api/auth/callback/discord",
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id; // Add user ID to the token
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id; // Get user ID from the token
            return session;
        },
    },
    
    pages: {
        signIn: '/login', // Custom sign-in page
    },
});