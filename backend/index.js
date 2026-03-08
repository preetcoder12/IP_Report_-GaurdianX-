import "dotenv/config";
import Express from "express";
import cors from "cors";
import { ratelimitermiddleware } from "./middleware.js";
import { checkip } from "./checkip.js";
const app = Express();

app.use(cors());

app.get("/", (req, res) => {
    res.send("healthy");
})

app.use(ratelimitermiddleware);
app.get("/api", (req, res) => {
    res.send("api");
})

app.get("/checkip", checkip);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`server started on port ${port}`);
})