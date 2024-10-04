import express from "express";
import db from "../utils/connect-sql.js";
import { z } from "zod";

const router = express.Router();

// 接收註冊資料

// 註冊資料驗證物件
const userSchema = z.object({
  name: z
    .string()
    .min(2, { message: "名字至少需要 2 個字" })
    .max(50, { message: "名字不能超過 50 個字" }),
  email: z.string().email({ message: "請輸入有效的電子郵件地址" }),
  mobile: z
    .string()
    .min(10, { message: "手機號碼至少需要 10 個字" })
    .max(10, { message: "手機號碼不能超過 10 個字" }),
  password: z
    .string()
    .min(8, { message: "密碼至少需要 8 個字" })
    .regex(/[A-Z]/, { message: "至少需要一個大寫字母" })
    .regex(/[a-z]/, { message: "至少需要一個小寫字母" })
    .regex(/[0-9]/, { message: "至少需要一個數字" })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "至少需要一個特殊字符" }),
});

router.post("/", async (req, res) => {
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
    const existingUser = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (existingUser.length > 0) {
      return res.status(400).json({
        message: "註冊失敗",
        error: "此電子郵件已被註冊",
      });
    }

    // 檢查手機號碼是否已經被註冊
    const existingMobile = await db.query(
      "SELECT * FROM users WHERE mobile = ?",
      [mobile]
    );
    if (existingMobile.length > 0) {
      return res.status(400).json({
        message: "註冊失敗",
        error: "此手機號碼已被註冊",
      });
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 10);

    // 將註冊資料插入資料庫 (考慮使用uuid，目前用auto_increment)
    const newUser = await db.query(
      "INSERT INTO users (name, email, mobile, password) VALUES (?, ?, ?, ?)",
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
