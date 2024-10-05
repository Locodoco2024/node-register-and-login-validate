import express from "express";
import db from "../utils/connect-sql.js";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fn檢查db帳號是否存在
const checkEmail = async (email) => {
  const sql = "SELECT * FROM valid_users WHERE email = ?";
  const result = await db.query(sql, [email]);
  return result.length > 0;
};

// Fn檢查db密碼是否正確
const checkPassword = async (email, password) => {
  const sql = "SELECT password FROM valid_users WHERE email = ?";
  const [result] = await db.query(sql, [email]);
  if (result.length === 0) {
    return false;
  }
  const hashedPassword = result[0].password;
  return await bcrypt.compare(password, hashedPassword);
};

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

router.post("/", async (req, res) => {
  // 接收帳號密碼
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "帳號或密碼不能為空" });
  }

  // 檢查email格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "請輸入有效的電子郵件地址" });
  }

  // 檢查密碼格式
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&*(),.?":{}|<>]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: "請輸入有效的密碼格式" });
  }

  // 檢查db帳號是否存在
  const isEmailExist = await checkEmail(email);
  if (!isEmailExist) {
    return res.status(400).json({ message: "帳號錯誤" }); // debug用，正式環境用模糊提示
  }
  // 檢查db密碼是否正確
  const isPasswordCorrect = await checkPassword(email, password);
  if (!isPasswordCorrect) {
    return res.status(400).json({ message: "密碼錯誤" }); // debug用，正式環境用模糊提示
  }
  return res.status(200).json({ message: "登入成功" }); // 正式環境redirect
});

// 待辦事項
// 1. CAPTCHA
// 2. 雙重驗證2FA
// 3. 登入紀錄
export default router;
