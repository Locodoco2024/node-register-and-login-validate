import express from "express";
import register from "./routes/register.js";

const app = express();
const port = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/register", register);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
