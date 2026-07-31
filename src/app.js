import express from "express";
import routes from "./routes.js";

let app = express();
app.use(express.json());
app.use(routes);

app.use((req, res) => {
    res.status(404).json({ error: "not found" });
});

app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message || "internal server error" });
});

app.listen(3000, () => console.log("listening on http://localhost:3000"));
