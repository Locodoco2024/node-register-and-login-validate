import express from "express";
import db from "../utils/connect-sql.js";
import bcrypt from "bcrypt";
import { z } from "zod";

const router = express.Router();

const userSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "名字至少需要 2 個字" })
    .max(50, { message: "名字不能超過 50 個字" }),
  email: z
    .string()
    .email({ message: "請輸入有效的電子郵件地址" })
    .toLowerCase(),
  mobile: z
    .string()
    .trim()
    .regex(/^09\d{8}$/, { message: "請輸入有效的台灣手機號碼" }),
  password: z
    .string()
    .min(8, { message: "密碼至少需要 8 個字" })
    .regex(/[A-Z]/, { message: "至少需要一個大寫字母" })
    .regex(/[a-z]/, { message: "至少需要一個小寫字母" })
    .regex(/[0-9]/, { message: "至少需要一個數字" })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "至少需要一個特殊字符" }),
});

router.post("/", async (req, res) => {
  // 接收註冊資料
  const { name, email, mobile, password } = req.body;

  const validateResult = userSchema.safeParse({
    // safeParse無論驗證成功與否都會return object，所以不需要try catch，用object的success或error屬性來判斷是否成功
    name,
    email,
    mobile,
    password,
  });

  if (validateResult.success) {
    // 將驗證過的資料解構賦值
    const { name, email, mobile, password } = validateResult.data;

    // 檢查email是否已經被註冊
    // email欄位設定唯一值，
    const [emailRows] = await db.query(
      "SELECT * FROM valid_users WHERE email = ?",
      [email]
    );
    if (emailRows.length > 0) {
      return res.status(400).json({
        message: "註冊失敗",
        error: "此電子郵件已被註冊",
      });
    }

    // 檢查手機號碼是否已經被註冊;
    const [mobileRows] = await db.query(
      "SELECT * FROM valid_users WHERE mobile = ?",
      [mobile]
    );
    if (mobileRows.length > 0) {
      return res.status(400).json({
        message: "註冊失敗",
        error: "此手機號碼已被註冊",
      });
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 10);

    // 將註冊資料插入資料庫 (考慮使用uuid，目前用auto_increment)
    const newUser = await db.query(
      "INSERT INTO valid_users (name, email, mobile, password) VALUES (?, ?, ?, ?)",
      [name, email, mobile, hashedPassword]
    );

    return res.status(200).json({
      message: "註冊成功",
    });
  } else {
    return res.status(400).json({
      message: "註冊失敗",
      error: validateResult.error.errors[0].message,
      // 回傳第一個錯誤訊息，也可用map跟join來回傳所有錯誤訊息
    });
  }
});

export default router;
