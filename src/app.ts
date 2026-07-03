import express from 'express';
import passport from 'passport';
import authRoute from "./routes/auth.js";
import userRoute from "./routes/user.js";
import attributeRoute from "./routes/attributes.js"
import "./config/passport.js";
import "dotenv/config"
import authenticated from './middleware/authenticated.js';
import cors from "cors";

const app = express();

app.use(passport.initialize());
app.use(express.json());
app.use(cors())

app.use("/auth", authRoute);
app.use(authenticated)
app.use("/users", userRoute);
app.use("/attributes", attributeRoute);
const PORT = process.env.PORT || 9090;

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
})