require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // хеш паролей
const jwt = require("jsonwebtoken"); // токены авторизации
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 5000;

// Подключение к MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// Схема пользователя
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model("User", UserSchema);

// Схема новости
const NewsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  section: {
    type: String,
    enum: ["Технологии", "Авто", "Спорт", "Кино"],
    required: true,
  },
  imageUrl: { type: String, default: "" },
  author: { type: String, default: "Редакция FastNews" },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});
const News = mongoose.model("News", NewsSchema);

// Схема комментария (ссылки на News и User)
const CommentSchema = new mongoose.Schema({
  newsId: { type: mongoose.Schema.Types.ObjectId, ref: "News", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Comment = mongoose.model("Comment", CommentSchema);

app.use(express.json());
app.use(cookieParser());

const allowedOrigins = ["http://localhost:5500", "http://127.0.0.1:5500"];

// CORS: разрешаем фронт с localhost:5500 и передаём куки
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

// Проверка JWT из куки, кладёт userId в req
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Не авторизован" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Неверный токен" });
  }
};

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Пользователь с таким email уже существует" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "Регистрация успешна" });
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
      path: "/",
    });
    res.json({ message: "Вход выполнен", name: user.name });
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Выход выполнен" });
});

// Текущий пользователь: GET /api/me
app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// Все новости, можно фильтровать ?section=Спорт
app.get("/api/news", async (req, res) => {
  try {
    const section = req.query.section;
    const filter = section ? { section } : {};
    const news = await News.find(filter).sort({ createdAt: -1 });
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

app.get("/api/news/:id", async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: "Новость не найдена" });
    }
    news.views += 1;
    await news.save();
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// Комментарии к новости (с именем автора)
app.get("/api/news/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ newsId: req.params.id })
      .populate("userId", "name")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// Добавить комментарий (только для авторизованных)
app.post("/api/news/:id/comments", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Текст комментария обязателен" });
    }
    const comment = new Comment({
      newsId: req.params.id,
      userId: req.userId,
      text,
    });
    await comment.save();
    const populatedComment = await comment.populate("userId", "name");
    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});
