require("dotenv").config();
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Подключено к MongoDB"))
  .catch((err) => console.log("❌ Ошибка подключения:", err));

const NewsSchema = new mongoose.Schema({
  title: String,
  content: String,
  section: { type: String, enum: ["Технологии", "Авто", "Спорт", "Кино"] },
  imageUrl: String,
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});
const News = mongoose.model("News", NewsSchema);

const testNews = [
  // Спорт (4 штуки)
  {
    title: "Сборная России выиграла чемпионат мира по хоккею",
    content:
      "В финале российские хоккеисты обыграли сборную Канады со счётом 5:3. Это третья победа России за последние 5 лет. Тренер отметил отличную игру вратаря.",
    section: "Спорт",
    imageUrl:
      "https://img.championat.com/svtM6XclPYeHq7Zbi8VW0NHFvbGxVJnuz5sQ8awEXGc/p(w:732/h:488)/news/big/k/v/pjat-samyh-jarkih-pobed-sbornoj-rossii-za-10-let_15777895521786289751.jpg",
    views: 210,
  },
  {
    title: "Теннис: Медведев вышел в финал US Open",
    content:
      "Российский теннисист Даниил Медведев в полуфинале обыграл соперника в трёх сетах. В финале встретится с первой ракеткой мира.",
    section: "Спорт",
    imageUrl:
      "https://ss.sport-express.net/userfiles/materials/222/2224453/1180x665.jpg",
    views: 89,
  },
  {
    title: "Футбол: Лига чемпионов – сенсационные результаты",
    content:
      'В матчах 1/8 финала Лиги чемпионов произошли неожиданные поражения фаворитов. "Реал" проиграл на выезде, а "Бавария" едва не вылетела.',
    section: "Спорт",
    imageUrl:
      "https://photobooth.cdn.sports.ru/preset/message/e/ea/f06c8f7a843acad4dd2a722bf7e59.png?f=webp&q=90&s=2x&w=730",
    views: 145,
  },
  {
    title: "Биатлон: российские спортсмены завоевали золото",
    content:
      "В эстафете на этапе Кубка мира сборная России финишировала первой, опередив команды Норвегии и Германии.",
    section: "Спорт",
    imageUrl:
      "https://s-cdn.sportbox.ru/images/styles/1920_1080/fp_fotos/12/51/b3f10854cdc2f1691ba2541f38fe1658600d7d65558e1830598761.jpg",
    views: 67,
  },

  // Кино (4 штуки)
  {
    title: "В прокат выходит «Аватар 3» — первые отзывы восторженные",
    content:
      "Джеймс Кэмерон снова удивляет зрителей. Фильм собрал уже 200 миллионов долларов в первый уикенд. Критики называют его «визуальным шедевром».",
    section: "Кино",
    imageUrl:
      "https://mixnews.lv/wp-content/uploads/2025/12/4/mycollages-2025-12-04t133337.692-768x432.jpg",
    views: 87,
  },
  {
    title: "Новый фильм Нолана получил 10 номинаций на Оскар",
    content:
      'Кристофер Нолан представил свой новый фильм "Оппенгеймер-2", который уже называют главным претендентом на премию. Картина получила высокие оценки критиков.',
    section: "Кино",
    imageUrl: "https://s14.stc.yc.kpcdn.net/share/i/12/15345015/wr-960.webp",
    views: 54,
  },
  {
    title:
      "Премьера семейного блокбастера „Чебурашка 2“ собрала рекордную кассу",
    content:
      "Продолжение популярной франшизы „Чебурашка 2“ в отечественном прокате заработало более 6 миллиардов рублей, став самым успешным российским фильмом.",
    section: "Кино",
    imageUrl:
      "https://static.okko.tv/images/v4/c981f708-3ec5-4913-b6fa-e54d2a708a26",
    views: 102,
  },
  {
    title: "Сериал «Игра престолов» получит приквел – съёмки стартуют в 2027",
    content:
      'HBO официально анонсировал новый сериал по вселенной "Игры престолов". Действие развернётся за 1000 лет до событий оригинала.',
    section: "Кино",
    imageUrl: "https://s14.stc.yc.kpcdn.net/share/i/4/3129523/wr-960.webp",
    views: 234,
  },

  // Технологии (2 штуки)
  {
    title: "Нейросеть научилась предсказывать погоду на месяц вперёд",
    content:
      "Исследователи из MIT представили алгоритм, который с точностью 92% прогнозирует погоду на 30 дней. Технология основана на анализе спутниковых снимков и исторических данных.",
    section: "Технологии",
    imageUrl:
      "https://habrastorage.org/r/w1560/getpro/habr/upload_files/8cd/4b6/d94/8cd4b6d94ebf9c89345c7ac2cb57f7c0.jpg",
    views: 45,
  },
  {
    title: "Квантовый компьютер Google решил задачу за 5 минут",
    content:
      "Квантовый процессор Sycamore справился с вычислением, которое заняло бы у суперкомпьютера 10 тысяч лет. Это важный шаг к практическому применению квантовых технологий.",
    section: "Технологии",
    imageUrl:
      "https://tech.news.am/resized/1200/static/news/b/2024/12/4825.jpg",
    views: 63,
  },

  // Авто (2 штуки)
  {
    title: "Tesla представила электрокар с запасом хода 1000 км",
    content:
      "Новая модель Tesla Model S Plaid+ получила аккумулятор нового поколения. Автомобиль способен проехать без подзарядки более 1000 километров. Старт продаж – в 2027 году.",
    section: "Авто",
    imageUrl:
      "https://s0.rbk.ru/v6_top_pics/media/img/1/94/755559267900941.jpg",
    views: 120,
  },
  {
    title: "Audi показала концепт беспилотного автомобиля",
    content:
      "Новая модель Audi Aicon полностью автономна, не имеет руля и педалей. Дизайн выполнен в футуристическом стиле. Ожидается, что серийная версия появится в 2028 году.",
    section: "Авто",
    imageUrl:
      "https://www.zakon.kz/pbi/WEBP/2023-12-25/file-8895d944-f0ec-4236-889c-d0bfa146fd68/800x452.webp",
    views: 34,
  },
];

async function seedNews() {
  try {
    await News.deleteMany({});
    console.log("🗑️ Старые новости удалены");
    await News.insertMany(testNews);
    console.log(`✅ Добавлено ${testNews.length} новостей`);
    await mongoose.connection.close();
    console.log("🔌 Соединение закрыто");
  } catch (error) {
    console.error("❌ Ошибка:", error);
    await mongoose.connection.close();
  }
}

seedNews();
