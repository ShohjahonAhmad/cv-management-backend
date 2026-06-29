import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
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
            console.log(profile)
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