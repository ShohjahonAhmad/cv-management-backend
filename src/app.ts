import express from 'express';
import passport from 'passport';
import authRoute from "./routes/auth.js";
import "./config/passport.js";
import "dotenv/config"
import authenticated from './middleware/authenticated.js';

const app = express();

app.use(passport.initialize());
app.use(express.json());

app.use("/auth", authRoute);
app.use(authenticated)
const PORT = process.env.PORT || 9090;

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
})