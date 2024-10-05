import express from "express";
import registerRouter from "./routes/register.js";
import loginRouter from "./routes/login.js";

const app = express();
const port = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.use("/register", registerRouter);
app.use("/login", loginRouter);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
