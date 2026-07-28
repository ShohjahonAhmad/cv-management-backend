import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import prisma from "../prisma.js";
import { Provider } from "../../generated/prisma/enums.js";



passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
    },

    async (_, __, profile, done) => {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    provider_providerUserId: {
                        provider: Provider.GOOGLE,
                        providerUserId: profile.id
                    }
                }
            })
    
    
            if(!user) {
                const providerUserId  = profile.id;
                const email = profile.emails?.[0]?.value || "";

                if (!email) {
                    return done(new Error("Google account doesn't have an email."));
                }
                const firstName = profile.name?.givenName || "First Name";
                const lastName = profile.name?.familyName || "Last Name";
                const photoUrl = profile.photos?.[0]?.value || null;
    
                const newUser = await prisma.user.create( {
                    data: {
                        email,
                        firstName,
                        lastName,
                        photoUrl,
                        provider: Provider.GOOGLE,
                        providerUserId,
    
                    }
                })
    
                done(null, newUser)
                return;
            }
    
            done(null, user)
        } catch(err) {
            done(err)
        }

    })
)

passport.use(
    new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackURL: `${process.env.BASE_URL}/auth/github/callback`,
    scope: ["user:email"],
    userEmailURL: "https://api.github.com/user/emails",
    },
    async (_:string, __:string, profile:any, done: any) => {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    provider_providerUserId: {
                        provider: Provider.GITHUB,
                        providerUserId: profile.id,
                    }
                }
            })

            if(!user) {
                const providerUserId = profile.id;
                const email = profile.emails?.[0]?.value;
                if(!email) {
                    throw new Error("GitHub account has no public email.")
                }
                const photoUrl = profile.photos?.[0]?.value || null;
                const fullName = profile._json.name ?? profile.displayName ?? "";
                const names = fullName.trim().split(/\s+/) ?? [];
                const firstName = names[0] || "";
                const lastName = names.slice(1).join(" ");
                const newUser = await prisma.user.create({
                    data: {
                        email,
                        firstName,
                        lastName,
                        photoUrl,
                        provider: Provider.GITHUB,
                        providerUserId,
                    }
                })

                done(null, newUser);
                return;
            }

            done(null, user)
        } catch(err) {
            done(err)
        }
    }

    ))