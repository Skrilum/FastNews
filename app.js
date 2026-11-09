const API_URL = "http://localhost:5000/api";

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Ошибка запроса");
  return data;
}

let currentUser = null;
let currentNewsId = null;

document.addEventListener("DOMContentLoaded", async function () {
  // ----- ПОДСВЕТКА АКТИВНОГО РАЗДЕЛА В МЕНЮ -----
  setActiveNavItem();

  // ----- СОЗДАНИЕ МОДАЛОК (если их нет) -----
  if (!document.getElementById("loginModal")) {
    const modalHTML = `
            <div id="loginModal" class="modal">
                <div class="modal-content">
                    <span class="close-btn" data-modal="loginModal">&times;</span>
                    <h2>Вход</h2>
                    <form id="loginForm">
                        <input type="email" id="loginEmail" placeholder="Email" required>
                        <input type="password" id="loginPassword" placeholder="Пароль" required>
                        <button type="submit">Войти</button>
                    </form>
                    <p>Нет аккаунта? <a href="#" id="switchToRegister">Зарегистрироваться</a></p>
                </div>
            </div>
            <div id="registerModal" class="modal">
                <div class="modal-content">
                    <span class="close-btn" data-modal="registerModal">&times;</span>
                    <h2>Регистрация</h2>
                    <form id="registerForm">
                        <input type="text" id="registerName" placeholder="Имя" required>
                        <input type="email" id="registerEmail" placeholder="Email" required>
                        <input type="password" id="registerPassword" placeholder="Пароль" required>
                        <button type="submit">Зарегистрироваться</button>
                    </form>
                    <p>Уже есть аккаунт? <a href="#" id="switchToLogin">Войти</a></p>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  // ----- СТИЛИ ДЛЯ МОДАЛОК (если нет) -----
  if (!document.getElementById("modalStyles")) {
    const styleTag = document.createElement("style");
    styleTag.id = "modalStyles";
    styleTag.textContent = `
            .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); justify-content: center; align-items: center; }
            .modal.active { display: flex; }
            .modal-content { background: #fff; padding: 30px; border-radius: 12px; width: 90%; max-width: 400px; position: relative; animation: slideDown 0.3s ease; }
            @keyframes slideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            .modal-content h2 { margin-bottom: 20px; color: #1a2639; }
            .modal-content input { width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 6px; font-size: 15px; }
            .modal-content button { width: 100%; padding: 12px; background: #0f5d65; color: #fff; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; }
            .modal-content button:hover { background: #13737e; }
            .modal-content p { margin-top: 15px; font-size: 14px; text-align: center; }
            .modal-content a { color: #008e96; text-decoration: none; cursor: pointer; }
            .close-btn { position: absolute; top: 15px; right: 20px; font-size: 28px; cursor: pointer; color: #888; }
            .close-btn:hover { color: #000; }
        `;
    document.head.appendChild(styleTag);
  }

  // ----- ЛОГИКА МОДАЛОК -----
  const loginModal = document.getElementById("loginModal");
  const registerModal = document.getElementById("registerModal");
  const loginBtn = document.querySelector(".login-btn");

  function openModal(modal) {
    modal.classList.add("active");
  }
  function closeModal(modal) {
    modal.classList.remove("active");
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openModal(loginModal);
    });
  }

  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const modalId = this.dataset.modal;
      const modal = document.getElementById(modalId);
      if (modal) closeModal(modal);
    });
  });

  window.addEventListener("click", function (e) {
    if (e.target.classList.contains("modal")) {
      closeModal(e.target);
    }
  });

  document
    .getElementById("switchToRegister")
    ?.addEventListener("click", function (e) {
      e.preventDefault();
      closeModal(loginModal);
      openModal(registerModal);
    });
  document
    .getElementById("switchToLogin")
    ?.addEventListener("click", function (e) {
      e.preventDefault();
      closeModal(registerModal);
      openModal(loginModal);
    });

  // ----- РЕГИСТРАЦИЯ -----
  document
    .getElementById("registerForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const name = document.getElementById("registerName").value;
      const email = document.getElementById("registerEmail").value;
      const password = document.getElementById("registerPassword").value;
      try {
        await fetchAPI("/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        alert("✅ Регистрация успешна! Теперь войдите.");
        closeModal(registerModal);
        openModal(loginModal);
      } catch (error) {
        alert("❌ Ошибка: " + error.message);
      }
    });

  // ----- ВХОД -----
  document
    .getElementById("loginForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;
      try {
        const data = await fetchAPI("/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        alert(`✅ Добро пожаловать, ${data.name}!`);
        closeModal(loginModal);
        currentUser = data.name;
        updateUIForUser(true);
        if (window.location.pathname.includes("article.html")) {
          await loadArticle();
        } else {
          await loadNews();
        }
      } catch (error) {
        alert("❌ Ошибка входа: " + error.message);
      }
    });

  // ----- ВЫХОД -----
  document.addEventListener("click", async function (e) {
    if (e.target && e.target.id === "logoutBtn") {
      e.preventDefault();
      try {
        await fetchAPI("/logout", { method: "POST" });
        currentUser = null;
        updateUIForUser(false);
        alert("Вы вышли");
        if (window.location.pathname.includes("article.html")) {
          await loadArticle();
        } else {
          await loadNews();
        }
      } catch (error) {
        alert("Ошибка выхода: " + error.message);
      }
    }
  });

  // ----- ПРОВЕРКА АВТОРИЗАЦИИ -----
  async function checkAuth() {
    try {
      const data = await fetchAPI("/me");
      currentUser = data.name;
      updateUIForUser(true);
      return true;
    } catch (error) {
      currentUser = null;
      updateUIForUser(false);
      return false;
    }
  }

  // ----- ОБНОВЛЕНИЕ ИНТЕРФЕЙСА -----
  function updateUIForUser(isLoggedIn) {
    const btn = document.querySelector(".login-btn");
    if (!btn) return;
    btn.style.display = "inline-block";
    const oldLogout = document.getElementById("logoutBtn");
    if (oldLogout) oldLogout.remove();

    if (isLoggedIn) {
      btn.textContent = `👤 ${currentUser}`;
      btn.style.background = "#0f5d65";
      btn.href = "#";
      const logoutLink = document.createElement("a");
      logoutLink.href = "#";
      logoutLink.textContent = "Выход";
      logoutLink.id = "logoutBtn";
      logoutLink.style.marginLeft = "15px";
      logoutLink.style.color = "#ffffff";
      logoutLink.style.fontWeight = "600";
      logoutLink.style.borderRadius = "30px";
      logoutLink.style.padding = "8px 20px";
      btn.parentNode.appendChild(logoutLink);
    } else {
      btn.textContent = "Войти";
      btn.style.background = "#0f5d65";
      btn.href = "#";
    }
    toggleCommentForm(isLoggedIn);
  }

  // ----- УПРАВЛЕНИЕ ФОРМОЙ КОММЕНТАРИЯ -----
  function toggleCommentForm(isLoggedIn) {
    const formWrapper = document.querySelector(".comment-form")?.closest("div");
    if (!formWrapper) return;
    const existingMsg = formWrapper.querySelector(".guest-message");
    if (existingMsg) existingMsg.remove();
    const form = formWrapper.querySelector(".comment-form");
    if (isLoggedIn) {
      if (form) form.style.display = "block";
    } else {
      if (form) form.style.display = "none";
      const msg = document.createElement("p");
      msg.className = "guest-message";
      msg.style.cssText =
        "background:#f8d7da;color:#721c24;padding:15px;border-radius:8px;margin-top:10px;font-weight:500;";
      msg.textContent =
        "🔒 Только авторизованные пользователи могут оставлять комментарии.";
      formWrapper.appendChild(msg);
    }
  }

  // ----- ЗАГРУЗКА НОВОСТЕЙ (главная) -----
  async function loadNews() {
    try {
      const params = new URLSearchParams(window.location.search);
      const section = params.get("section");
      const url = section
        ? `/news?section=${encodeURIComponent(section)}`
        : "/news";
      const news = await fetchAPI(url);

      if (!news || news.length === 0) {
        document.getElementById("bigNewsTitle").textContent =
          "Новостей пока нет";
        return;
      }

      const mainNews = news[0];
      document.getElementById("bigNewsImg").src =
        mainNews.imageUrl || "https://picsum.photos/seed/default/800/400";
      document.getElementById("bigNewsTitle").innerHTML =
        `<a href="article.html?id=${mainNews._id}" style="color:white; text-decoration:none;">${mainNews.title}</a>`;
      document.getElementById("bigNewsDesc").textContent =
        mainNews.content.slice(0, 120) + "...";
      document.getElementById("bigNewsMeta").textContent =
        `${mainNews.section} • ${new Date(mainNews.createdAt).toLocaleDateString("ru-RU")}`;

      const rest = news.slice(1);

      const sportNews = rest.filter((n) => n.section === "Спорт");
      const tennisNews = sportNews.slice(0, 4);
      const footballNews = sportNews.slice(4, 8);

      renderSubcategory("tennisMain", "tennisList", tennisNews);
      renderSubcategory("footballMain", "footballList", footballNews);

      const usedIds = new Set();
      usedIds.add(mainNews._id);
      sportNews.forEach((n) => usedIds.add(n._id));
      const remaining = rest.filter((n) => !usedIds.has(n._id));

      const featuredNews = remaining.slice(0, 3);
      const featuredGrid = document.getElementById("featuredGrid");
      if (featuredGrid) {
        featuredGrid.innerHTML = featuredNews
          .map(
            (n) => `
                    <div class="card">
                        <img src="${n.imageUrl || "https://picsum.photos/seed/default/200/150"}" alt="${n.title}">
                        <div class="content">
                            <h4><a href="article.html?id=${n._id}" style="color:inherit; text-decoration:none;">${n.title}</a></h4>
                            <div class="meta">${n.section} • ${new Date(n.createdAt).toLocaleDateString("ru-RU")}</div>
                        </div>
                    </div>
                `,
          )
          .join("");
      }

      const featuredIds = new Set(featuredNews.map((n) => n._id));
      const forFeed = remaining.filter((n) => !featuredIds.has(n._id));
      const groups = {};
      forFeed.forEach((n) => {
        if (!groups[n.section]) groups[n.section] = [];
        groups[n.section].push(n);
      });

      const feedContainer = document.getElementById("categoryFeed");
      if (feedContainer) {
        feedContainer.innerHTML = Object.keys(groups)
          .map((section) => {
            const items = groups[section];
            const first = items[0];
            const restItems = items.slice(1);
            return `
                        <div class="category-block">
                            <h3>${section}</h3>
                            <div class="card-main">
                                <img src="${first.imageUrl || "https://picsum.photos/seed/default/600/300"}" alt="${first.title}">
                                <div class="content">
                                    <h4><a href="article.html?id=${first._id}" style="color:inherit; text-decoration:none;">${first.title}</a></h4>
                                    <p>${first.content.slice(0, 120)}...</p>
                                    <div class="meta">${first.section} • ${new Date(first.createdAt).toLocaleDateString("ru-RU")}</div>
                                </div>
                            </div>
                            ${restItems
                              .map(
                                (n) => `
                                <div class="item">
                                    <img src="${n.imageUrl || "https://picsum.photos/seed/default/200/200"}" alt="${n.title}">
                                    <div class="text">
                                        <h4><a href="article.html?id=${n._id}" style="color:inherit; text-decoration:none;">${n.title}</a></h4>
                                        <p>${n.content.slice(0, 80)}...</p>
                                        <div class="date">${new Date(n.createdAt).toLocaleDateString("ru-RU")}</div>
                                    </div>
                                </div>
                            `,
                              )
                              .join("")}
                        </div>
                    `;
          })
          .join("");
      }

      const videoContainer = document.getElementById("videoList");
      if (videoContainer) {
        const videoNews = remaining.slice(3, 9);
        videoContainer.innerHTML = videoNews
          .map(
            (n) => `
                    <div class="video-item">
                        <div class="video-placeholder">Видео-плеер (заглушка)</div>
                        <div class="video-news">
                            <h5><a href="article.html?id=${n._id}" style="color:inherit; text-decoration:none;">${n.title}</a></h5>
                            <div class="date">${new Date(n.createdAt).toLocaleDateString("ru-RU")}</div>
                        </div>
                    </div>
                `,
          )
          .join("");
      }
    } catch (error) {
      alert("Ошибка загрузки новостей: " + error.message);
    }
  }

  function renderSubcategory(mainId, listId, items) {
    const mainContainer = document.getElementById(mainId);
    const listContainer = document.getElementById(listId);
    if (!mainContainer || !listContainer) return;

    if (!items || items.length === 0) {
      mainContainer.innerHTML = "<p style='color:#999;'>Новостей нет</p>";
      listContainer.innerHTML = "";
      return;
    }

    const first = items[0];
    mainContainer.innerHTML = `
            <div class="card">
                <img src="${first.imageUrl || "https://picsum.photos/seed/default/400/300"}" alt="${first.title}">
                <div class="content">
                    <h4><a href="article.html?id=${first._id}" style="color:inherit; text-decoration:none;">${first.title}</a></h4>
                    <p>${first.content.slice(0, 80)}...</p>
                    <div class="meta">${new Date(first.createdAt).toLocaleDateString("ru-RU")}</div>
                </div>
            </div>
        `;

    const restItems = items.slice(1);
    if (restItems.length === 0) {
      listContainer.innerHTML =
        "<p style='color:#999;'>Больше новостей нет</p>";
    } else {
      listContainer.innerHTML = restItems
        .map(
          (n) => `
                <div class="item ${!n.imageUrl ? "no-image" : ""}">
                    ${n.imageUrl ? `<img src="${n.imageUrl}" alt="${n.title}">` : ""}
                    <div class="text">
                        <h4><a href="article.html?id=${n._id}" style="color:inherit; text-decoration:none;">${n.title}</a></h4>
                        <div class="date">${new Date(n.createdAt).toLocaleDateString("ru-RU")}</div>
                    </div>
                </div>
            `,
        )
        .join("");
    }
  }

  // ----- ЗАГРУЗКА СТАТЬИ И КОММЕНТАРИЕВ -----
  async function loadArticle() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
      document.querySelector(".article-header h1").textContent =
        "Новость не найдена";
      return;
    }
    currentNewsId = id;
    try {
      const news = await fetchAPI(`/news/${id}`);
      const authorEl = document.getElementById("articleAuthor");
      if (authorEl)
        authorEl.textContent = `Автор: ${news.author || "Редакция"}`;

      const dateEl = document.getElementById("articleDate");
      if (dateEl)
        dateEl.textContent = `Дата: ${new Date(news.createdAt).toLocaleDateString("ru-RU")}`;

      const sectionEl = document.getElementById("articleSection");
      if (sectionEl) sectionEl.textContent = `Рубрика: ${news.section}`;

      const titleEl = document.querySelector(".article-header h1");
      if (titleEl) titleEl.textContent = news.title;
      const viewsEl = document.querySelector(".article-meta .views");
      if (viewsEl) viewsEl.textContent = `👁️ Просмотров: ${news.views}`;
      const body = document.querySelector(".article-body");
      if (body) {
        const img = body.querySelector("img");
        if (img)
          img.src =
            news.imageUrl || "https://picsum.photos/seed/default/800/400";
        const paragraphs = body.querySelectorAll("p");
        if (paragraphs.length > 0) {
          paragraphs[0].textContent = news.content;
        } else {
          const p = document.createElement("p");
          p.textContent = news.content;
          body.appendChild(p);
        }
      }
      await loadComments();
    } catch (error) {
      alert("Ошибка загрузки новости: " + error.message);
    }
  }

  async function loadComments() {
    if (!currentNewsId) return;
    const container = document.querySelector(".comment-list");
    if (!container) return;
    try {
      const comments = await fetchAPI(`/news/${currentNewsId}/comments`);
      const titleEl = document.querySelector(".comments-section h3");
      if (titleEl) titleEl.textContent = `💬 Комментарии (${comments.length})`;

      if (comments.length === 0) {
        container.innerHTML = `<p style="color:#999; padding:15px 0;">Пока нет комментариев. Будьте первым!</p>`;
      } else {
        container.innerHTML = comments
          .map(
            (c) => `
                    <div class="comment-item">
                        <span class="author">${c.userId?.name || "Аноним"}</span>
                        <span class="date">${new Date(c.createdAt).toLocaleString("ru-RU")}</span>
                        <div class="text">${c.text}</div>
                    </div>
                `,
          )
          .join("");
      }
    } catch (error) {
      console.error("Ошибка загрузки комментариев:", error);
    }
  }

  // ----- ОТПРАВКА КОММЕНТАРИЯ -----
  document.addEventListener("submit", async function (e) {
    const form = e.target.closest(".comment-form");
    if (!form) return;
    e.preventDefault();
    if (!currentUser) {
      alert("Пожалуйста, войдите, чтобы комментировать.");
      return;
    }
    const textarea = form.querySelector("textarea");
    const text = textarea.value.trim();
    if (!text) return;
    try {
      await fetchAPI(`/news/${currentNewsId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      textarea.value = "";
      await loadComments();
    } catch (error) {
      alert("Ошибка при отправке комментария: " + error.message);
    }
  });

  // ----- ГЛАВНЫЙ ЗАПУСК -----
  await checkAuth();
  if (window.location.pathname.includes("article.html")) {
    await loadArticle();
  } else {
    await loadNews();
  }
  console.log("✅ FastNews загружен");
});

// ----- ПОДСВЕТКА АКТИВНОГО РАЗДЕЛА В МЕНЮ -----
// Читает параметр ?section= из URL и ставит class="active"
// на нужный пункт меню. Если параметра нет — активна "Главная".
function setActiveNavItem() {
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section");
  const navItems = document.querySelectorAll(".main-nav ul li");

  navItems.forEach((item) => item.classList.remove("active"));

  if (section) {
    navItems.forEach((item) => {
      const link = item.querySelector("a");
      if (
        link &&
        decodeURIComponent(link.getAttribute("href") || "").includes(
          `section=${section}`,
        )
      ) {
        item.classList.add("active");
      }
    });
  } else {
    navItems.forEach((item) => {
      const link = item.querySelector("a");
      if (link && link.getAttribute("href") === "index.html") {
        item.classList.add("active");
      }
    });
  }
}
