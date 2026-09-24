"use strict";

/* =========================
   MENA
   Button-safe JavaScript
   ========================= */

const MENA = {
  coinValue: 0.50,
  withdrawalMinimum: 10,
  marketplaceFee: 5,
  deliveryFee: 80,
  freeWorkFee: 50
};

const $ = id => document.getElementById(id);
const $$ = selector => [...document.querySelectorAll(selector)];

let state = loadState();
let currentPage = state.page || "home";
let selectedMedia = null;

/* =========================
   STORAGE
   ========================= */

function emptyState() {
  return {
    page: "home",
    user: null,
    posts: [],
    products: [],
    freeWork: [],
    likes: {},
    comments: {}
  };
}

function loadState() {
  try {
    return Object.assign(
      emptyState(),
      JSON.parse(localStorage.getItem("MENA_APP") || "{}")
    );
  } catch {
    return emptyState();
  }
}

function saveState() {
  localStorage.setItem("MENA_APP", JSON.stringify(state));
}

/* =========================
   HELPERS
   ========================= */

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function id(prefix) {
  return (
    prefix +
    "_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 8)
  );
}

function toast(message) {
  let box = $("toast");

  if (!box) {
    box = document.createElement("div");
    box.id = "toast";
    box.style.cssText = `
      position:fixed;
      left:50%;
      bottom:85px;
      transform:translateX(-50%);
      background:#111;
      color:#fff;
      padding:12px 18px;
      border-radius:12px;
      z-index:99999;
      max-width:90%;
      text-align:center;
      font-size:14px;
    `;
    document.body.appendChild(box);
  }

  box.textContent = message;
  box.style.display = "block";

  clearTimeout(box.timer);

  box.timer = setTimeout(() => {
    box.style.display = "none";
  }, 2500);
}

function user() {
  return state.user;
}

/* =========================
   NAVIGATION
   ========================= */

function go(page) {
  currentPage = page;
  state.page = page;
  saveState();

  render();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function bindNavigation() {
  $$("[data-page]").forEach(button => {
    button.onclick = () => {
      go(button.dataset.page);
    };
  });

  const brand = document.querySelector(".brand");

  if (brand) {
    brand.onclick = () => go("home");
  }

  const searchButton = $("searchBtn");

  if (searchButton) {
    searchButton.onclick = openSearch;
  }

  const settingsButton = $("settingsBtn");

  if (settingsButton) {
    settingsButton.onclick = openSettings;
  }

  const createButton = $("createBtn");

  if (createButton) {
    createButton.onclick = openCreate;
  }
}

/* =========================
   MAIN RENDER
   ========================= */

function render() {
  const app = $("app");

  if (!app) return;

  if (currentPage === "home") {
    renderHome();
    return;
  }

  if (currentPage === "market") {
    renderMarket();
    return;
  }

  if (currentPage === "work") {
    renderWork();
    return;
  }

  if (currentPage === "profile") {
    renderProfile();
    return;
  }

  renderHome();
}

/* =========================
   HOME
   ========================= */

function renderHome() {
  const app = $("app");

  app.innerHTML = `
    <section class="page-content">

      <div class="hero">
        <h1>For You</h1>
        <p>MENA social feed</p>
      </div>

      <div class="card">
        <button id="homeCreatePost" class="action primary block">
          ＋ Create Post
        </button>
      </div>

      ${
        state.posts.length
          ? state.posts.map(postHTML).join("")
          : `
            <div class="card empty">
              <h3>No posts yet</h3>
              <p>Create the first MENA post.</p>
            </div>
          `
      }

    </section>
  `;

  const button = $("homeCreatePost");

  if (button) {
    button.onclick = openCreate;
  }
}

/* =========================
   POSTS
   ========================= */

function postHTML(post) {
  const liked = !!state.likes[post.id];

  return `
    <article class="card post-card">

      ${
        post.media
          ? `
            ${
              post.mediaType === "video"
                ? `<video
                     src="${post.media}"
                     controls
                     playsinline
                     style="width:100%;border-radius:14px">
                   </video>`
                : `<img
                     src="${post.media}"
                     style="width:100%;border-radius:14px;display:block"
                     alt="MENA post">`
            }
          `
          : ""
      }

      <div style="padding-top:12px">
        <strong>${esc(post.username || "MENA user")}</strong>
      </div>

      ${
        post.caption
          ? `<p>${esc(post.caption)}</p>`
          : ""
      }

      <div class="actions-row">

        <button
          class="small"
          data-like="${post.id}">
          ${liked ? "♥" : "♡"} ${post.likes || 0}
        </button>

        <button
          class="small"
          data-comment="${post.id}">
          💬 ${post.comments || 0}
        </button>

        <button
          class="small"
          data-share="${post.id}">
          ↗ Share
        </button>

      </div>

    </article>
  `;
}

function bindPostButtons() {
  $$("[data-like]").forEach(button => {
    button.onclick = () => {
      const postId = button.dataset.like;

      if (state.likes[postId]) {
        delete state.likes[postId];

        const post = state.posts.find(x => x.id === postId);

        if (post && post.likes > 0) {
          post.likes--;
        }
      } else {
        state.likes[postId] = true;

        const post = state.posts.find(x => x.id === postId);

        if (post) {
          post.likes = (post.likes || 0) + 1;
        }
      }

      saveState();
      renderHome();
    };
  });

  $$("[data-comment]").forEach(button => {
    button.onclick = () => {
      const postId = button.dataset.comment;

      const comment = prompt("Write your comment:");

      if (!comment || !comment.trim()) return;

      const post = state.posts.find(x => x.id === postId);

      if (!post) return;

      post.comments = (post.comments || 0) + 1;

      saveState();

      toast("Comment added.");
      renderHome();
    };
  });

  $$("[data-share]").forEach(button => {
    button.onclick = async () => {
      try {
        if (navigator.share) {
          await navigator.share({
            title: "MENA",
            text: "Check this post on MENA"
          });
        } else {
          await navigator.clipboard.writeText(location.href);
          toast("Link copied.");
        }
      } catch {}
    };
  });
}

/* =========================
   MARKET
   ========================= */

function calculatePrice(sellerReceive) {
  const receive = Number(sellerReceive || 0);

  const buyerPrice = receive / 0.95;
  const fee = buyerPrice * 0.05;

  return {
    sellerReceive: receive,
    productPrice: buyerPrice,
    fee: fee,
    delivery: MENA.deliveryFee,
    buyerTotal: buyerPrice + MENA.deliveryFee
  };
}

function renderMarket() {
  const app = $("app");

  app.innerHTML = `
    <section class="page-content">

      <div class="hero">
        <h1>Marketplace</h1>
        <p>Buy and sell products on MENA.</p>
      </div>

      <div class="card">
        <button id="sellProductButton" class="action primary block">
          ＋ Sell a Product
        </button>
      </div>

      ${
        state.products.length
          ? state.products.map(productHTML).join("")
          : `
            <div class="card empty">
              <h3>No products yet</h3>
              <p>Products posted by real MENA users will appear here.</p>
            </div>
          `
      }

    </section>
  `;

  $("sellProductButton").onclick = openSellProduct;

  $$("[data-buy]").forEach(button => {
    button.onclick = () => {
      const product = state.products.find(
        x => x.id === button.dataset.buy
      );

      if (!product) return;

      const price = calculatePrice(product.sellerReceive);

      alert(
        "Product: " +
        money(price.productPrice) +
        " ETB\n" +
        "Delivery: " +
        money(price.delivery) +
        " ETB\n" +
        "Total: " +
        money(price.buyerTotal) +
        " ETB"
      );
    };
  });
}

function productHTML(product) {
  const price = calculatePrice(product.sellerReceive);

  return `
    <article class="card">

      ${
        product.image
          ? `
            <img
              src="${product.image}"
              style="width:100%;border-radius:14px"
              alt="Product">
          `
          : ""
      }

      <h3>${esc(product.title)}</h3>

      <div class="price">
        ${money(price.productPrice)} ETB
      </div>

      <p>${esc(product.description)}</p>

      <small>
        Delivery ${money(MENA.deliveryFee)} ETB
      </small>

      <br><br>

      <button
        class="action primary"
        data-buy="${product.id}">
        Buy
      </button>

    </article>
  `;
}

/* =========================
   SELL PRODUCT
   ========================= */

function openSellProduct() {
  openModal(`
    <h2>Sell Product</h2>

    <input
      id="productTitle"
      class="input"
      placeholder="Product name">

    <textarea
      id="productDescription"
      class="textarea"
      placeholder="Product description"></textarea>

    <input
      id="sellerReceive"
      class="input"
      type="number"
      min="1"
      placeholder="How much do you want to receive?">

    <input
      id="productImage"
      class="input"
      type="file"
      accept="image/*">

    <div id="pricePreview" class="notice">
      Enter your desired amount.
    </div>

    <button id="publishProduct" class="action primary block">
      Publish Product
    </button>

    <button id="cancelProduct" class="action block">
      Cancel
    </button>
  `);

  $("sellerReceive").oninput = () => {
    const price = calculatePrice(
      $("sellerReceive").value
    );

    $("pricePreview").innerHTML = `
      You receive:
      <b>${money(price.sellerReceive)} ETB</b><br>
      Buyer product price:
      <b>${money(price.productPrice)} ETB</b><br>
      Delivery:
      <b>${money(price.delivery)} ETB</b><br>
      Buyer total:
      <b>${money(price.buyerTotal)} ETB</b>
    `;
  };

  $("publishProduct").onclick = publishProduct;
  $("cancelProduct").onclick = closeModal;
}

async function publishProduct() {
  const title = $("productTitle").value.trim();
  const description = $("productDescription").value.trim();
  const sellerReceive = Number($("sellerReceive").value);
  const file = $("productImage").files[0];

  if (!title) {
    toast("Enter the product name.");
    return;
  }

  if (!sellerReceive || sellerReceive <= 0) {
    toast("Enter the amount you want to receive.");
    return;
  }

  let image = "";

  if (file) {
    image = await readFile(file);
  }

  state.products.unshift({
    id: id("product"),
    title,
    description,
    sellerReceive,
    image,
    createdAt: Date.now()
  });

  saveState();

  closeModal();
  toast("Product published.");
  renderMarket();
}

/* =========================
   FREE WORK
   ========================= */

function renderWork() {
  const app = $("app");

  app.innerHTML = `
    <section class="page-content">

      <div class="hero">
        <h1>Free Work</h1>
        <p>Find or post work opportunities.</p>
      </div>

      <div class="card">
        <button id="postWorkButton" class="action primary block">
          ＋ Post Free Work
        </button>

        <p class="notice">
          Posting fee: ${MENA.freeWorkFee} ETB
          <br>
          Active for 30 days.
        </p>
      </div>

      ${
        state.freeWork.length
          ? state.freeWork.map(workHTML).join("")
          : `
            <div class="card empty">
              <h3>No Free Work yet</h3>
              <p>Work posted by users will appear here.</p>
            </div>
          `
      }

    </section>
  `;

  $("postWorkButton").onclick = openFreeWork;
}

function workHTML(work) {
  return `
    <article class="card">

      <h3>${esc(work.title)}</h3>

      <p>${esc(work.description)}</p>

      ${
        work.category
          ? `<small>🏷 ${esc(work.category)}</small><br>`
          : ""
      }

      ${
        work.location
          ? `<small>📍 ${esc(work.location)}</small><br>`
          : ""
      }

      ${
        work.contact
          ? `
            <br>
            <a
              class="action small"
              href="tel:${esc(work.contact)}">
              📞 Contact
            </a>
          `
          : ""
      }

    </article>
  `;
}

function openFreeWork() {
  openModal(`
    <h2>Post Free Work</h2>

    <input
      id="workTitle"
      class="input"
      placeholder="Work title">

    <textarea
      id="workDescription"
      class="textarea"
      placeholder="Describe the work"></textarea>

    <input
      id="workCategory"
      class="input"
      placeholder="Category">

    <input
      id="workLocation"
      class="input"
      placeholder="Location">

    <input
      id="workContact"
      class="input"
      placeholder="Contact phone">

    <div class="notice">
      Posting fee: <b>${MENA.freeWorkFee} ETB</b>
      <br>
      Active for 30 days.
    </div>

    <button id="publishWork" class="action primary block">
      Publish
    </button>

    <button id="cancelWork" class="action block">
      Cancel
    </button>
  `);

  $("publishWork").onclick = publishWork;
  $("cancelWork").onclick = closeModal;
}

function publishWork() {
  const title = $("workTitle").value.trim();
  const description = $("workDescription").value.trim();

  if (!title) {
    toast("Enter a work title.");
    return;
  }

  if (!description) {
    toast("Describe the work.");
    return;
  }

  state.freeWork.unshift({
    id: id("work"),
    title,
    description,
    category: $("workCategory").value.trim(),
    location: $("workLocation").value.trim(),
    contact: $("workContact").value.trim(),
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
  });

  saveState();

  closeModal();
  toast("Free Work published.");
  renderWork();
}

/* =========================
   PROFILE
   ========================= */

function renderProfile() {
  const app = $("app");

  if (!state.user) {
    app.innerHTML = `
      <section class="page-content">

        <div class="card">
          <h2>Create your MENA profile</h2>

          <input
            id="profileName"
            class="input"
            placeholder="Your name">

          <input
            id="profileUsername"
            class="input"
            placeholder="@username">

          <button id="createProfile" class="action primary block">
            Create Profile
          </button>
        </div>

      </section>
    `;

    $("createProfile").onclick = createProfile;
    return;
  }

  const posts = state.posts.filter(
    x => x.username === state.user.username
  );

  app.innerHTML = `
    <section class="page-content">

      <div class="card">

        <div style="display:flex;gap:14px;align-items:center">

          <div
            style="
              width:70px;
              height:70px;
              border-radius:50%;
              background:#087f5b;
              color:white;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:28px;
              font-weight:bold">
            ${esc(state.user.name.charAt(0).toUpperCase())}
          </div>

          <div>
            <h2>${esc(state.user.name)}</h2>
            <p>@${esc(state.user.username)}</p>
          </div>

        </div>

        <div class="stats">

          <div class="stat">
            <b>${posts.length}</b>
            <small>Posts</small>
          </div>

          <div class="stat">
            <b>0</b>
            <small>Followers</small>
          </div>

          <div class="stat">
            <b>0</b>
            <small>Following</small>
          </div>

        </div>

        <button id="editProfile" class="action block">
          Edit Profile
        </button>

      </div>

      <div class="card">

        <h3>Wallet</h3>

        <p>
          ETB Balance:
          <b>${money(state.user.balance || 0)} ETB</b>
        </p>

        <p>
          Coins:
          <b>${state.user.coins || 0}</b>
        </p>

        <button id="walletButton" class="action primary block">
          Wallet
        </button>

      </div>

      <div class="card">

        <h3>My Market</h3>

        <button id="myMarketButton" class="action block">
          My Products
        </button>

      </div>

      <div class="card">

        <button id="logoutButton" class="action danger block">
          Log out
        </button>

      </div>

    </section>
  `;

  $("editProfile").onclick = editProfile;
  $("walletButton").onclick = openWallet;
  $("myMarketButton").onclick = () => {
    go("market");
  };

  $("logoutButton").onclick = logout;
}

function createProfile() {
  const name = $("profileName").value.trim();
  let username = $("profileUsername").value
    .trim()
    .replace(/^@/, "")
    .toLowerCase();

  if (!name) {
    toast("Enter your name.");
    return;
  }

  if (!username) {
    toast("Enter a username.");
    return;
  }

  state.user = {
    id: id("user"),
    name,
    username,
    balance: 0,
    coins: 0,
    createdAt: Date.now()
  };

  saveState();

  toast("Profile created.");
  renderProfile();
}

function editProfile() {
  openModal(`
    <h2>Edit Profile</h2>

    <input
      id="editName"
      class="input"
      value="${esc(state.user.name)}"
      placeholder="Name">

    <input
      id="editUsername"
      class="input"
      value="${esc(state.user.username)}"
      placeholder="Username">

    <button id="saveProfile" class="action primary block">
      Save
    </button>

    <button id="closeEdit" class="action block">
      Cancel
    </button>
  `);

  $("saveProfile").onclick = () => {
    state.user.name = $("editName").value.trim();

    state.user.username = $("editUsername")
      .value
      .trim()
      .replace(/^@/, "")
      .toLowerCase();

    saveState();

    closeModal();
    toast("Profile updated.");
    renderProfile();
  };

  $("closeEdit").onclick = closeModal;
}

/* =========================
   WALLET
   ========================= */

function openWallet() {
  if (!state.user) {
    go("profile");
    return;
  }

  openModal(`
    <h2>Wallet</h2>

    <div class="card">
      <h3>${money(state.user.balance || 0)} ETB</h3>
      <p>ETB Balance</p>
    </div>

    <div class="card">
      <h3>${state.user.coins || 0}</h3>
      <p>Coins</p>
    </div>

    <button id="coinShop" class="action primary block">
      🪙 Coin Shop
    </button>

    <button id="withdrawMoney" class="action block">
      Withdraw
    </button>

    <button id="closeWallet" class="action block">
      Close
    </button>
  `);

  $("coinShop").onclick = openCoinShop;
  $("withdrawMoney").onclick = openWithdraw;
  $("closeWallet").onclick = closeModal;
}

function openCoinShop() {
  openModal(`
    <h2>Coin Shop</h2>

    <p>1 coin = ${MENA.coinValue.toFixed(2)} ETB</p>

    <div class="actions">

      ${[10, 50, 100, 500, 1000]
        .map(
          coins => `
            <button
              class="action block"
              data-coins="${coins}">
              🪙 ${coins} coins —
              ${money(coins * MENA.coinValue)} ETB
            </button>
          `
        )
        .join("")}

    </div>

    <button id="closeCoins" class="action block">
      Close
    </button>
  `);

  $$("[data-coins]").forEach(button => {
    button.onclick = () => {
      const coins = Number(button.dataset.coins);
      const cost = coins * MENA.coinValue;

      if ((state.user.balance || 0) < cost) {
        toast("Insufficient ETB balance.");
        return;
      }

      state.user.balance -= cost;
      state.user.coins += coins;

      saveState();

      toast(`${coins} coins purchased.`);
      openCoinShop();
    };
  });

  $("closeCoins").onclick = closeModal;
}

function openWithdraw() {
  openModal(`
    <h2>Withdraw</h2>

    <p>
      Minimum withdrawal:
      <b>${MENA.withdrawalMinimum} ETB</b>
    </p>

    <select id="withdrawMethod" class="input">
      <option>Telebirr</option>
      <option>M-Pesa</option>
    </select>

    <input
      id="withdrawAmount"
      class="input"
      type="number"
      min="10"
      placeholder="Amount ETB">

    <input
      id="withdrawNumber"
      class="input"
      placeholder="Wallet number">

    <button id="requestWithdraw" class="action primary block">
      Request Withdrawal
    </button>

    <button id="closeWithdraw" class="action block">
      Close
    </button>
  `);

  $("requestWithdraw").onclick = () => {
    const amount = Number($("withdrawAmount").value);

    if (amount < MENA.withdrawalMinimum) {
      toast("Minimum withdrawal is 10 ETB.");
      return;
    }

    if (amount > (state.user.balance || 0)) {
      toast("Insufficient balance.");
      return;
    }

    if (!$("withdrawNumber").value.trim()) {
      toast("Enter your wallet number.");
      return;
    }

    /*
      IMPORTANT:
      Real Telebirr/M-Pesa money transfer must be
      handled by a secure backend/payment provider.
    */

    toast("Withdrawal request created.");
    closeModal();
  };

  $("closeWithdraw").onclick = closeModal;
}

/* =========================
   CREATE MENU
   ========================= */

function openCreate() {
  openModal(`
    <h2>Create</h2>

    <button id="createPost" class="action primary block">
      🎥 Post Video / Photo
    </button>

    <button id="createMarket" class="action block">
      🛍 Sell Product
    </button>

    <button id="createWork" class="action block">
      💼 Free Work
    </button>

    <button id="createLive" class="action block">
      🔴 Go Live
    </button>

    <button id="closeCreate" class="action block">
      Close
    </button>
  `);

  $("createPost").onclick = openPostCreator;
  $("createMarket").onclick = openSellProduct;
  $("createWork").onclick = openFreeWork;
  $("createLive").onclick = openLive;
  $("closeCreate").onclick = closeModal;
}

/* =========================
   POST CREATOR
   ========================= */

function openPostCreator() {
  openModal(`
    <h2>Create Post</h2>

    <input
      id="postFile"
      class="input"
      type="file"
      accept="image/*,video/*">

    <textarea
      id="postCaption"
      class="textarea"
      placeholder="Write something..."></textarea>

    <button id="publishPost" class="action primary block">
      Publish
    </button>

    <button id="cancelPost" class="action block">
      Cancel
    </button>
  `);

  $("publishPost").onclick = publishPost;
  $("cancelPost").onclick = closeModal;
}

async function publishPost() {
  const file = $("postFile").files[0];
  const caption = $("postCaption").value.trim();

  if (!file) {
    toast("Choose a photo or video.");
    return;
  }

  if (!state.user) {
    toast("Create a profile first.");
    return;
  }

  const media = await readFile(file);

  state.posts.unshift({
    id: id("post"),
    username: state.user.username,
    caption,
    media,
    mediaType: file.type.startsWith("video/")
      ? "video"
      : "image",
    likes: 0,
    comments: 0,
    createdAt: Date.now()
  });

  saveState();

  closeModal();
  toast("Post published.");
  go("home");
}

/* =========================
   LIVE
   ========================= */

async function openLive() {
  closeModal();

  openModal(`
    <h2>Go Live</h2>

    <input
      id="liveTitle"
      class="input"
      placeholder="Live title">

    <video
      id="livePreview"
      autoplay
      muted
      playsinline
      style="width:100%;border-radius:14px">
    </video>

    <button id="startCamera" class="action primary block">
      Start Camera
    </button>

    <button id="closeLive" class="action block">
      Close
    </button>
  `);

  $("startCamera").onclick = startCamera;
  $("closeLive").onclick = stopCamera;
}

let liveStream = null;

async function startCamera() {
  try {
    liveStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    $("livePreview").srcObject = liveStream;

    toast("Camera started.");
  } catch {
    toast("Camera permission was denied.");
  }
}

function stopCamera() {
  if (liveStream) {
    liveStream.getTracks().forEach(track => track.stop());
    liveStream = null;
  }

  closeModal();
}

/* =========================
   SEARCH
   ========================= */

function openSearch() {
  openModal(`
    <h2>Search MENA</h2>

    <input
      id="searchInput"
      class="input"
      placeholder="Search products, work, posts...">

    <button id="searchButton" class="action primary block">
      Search
    </button>

    <div id="searchResults"></div>

    <button id="closeSearch" class="action block">
      Close
    </button>
  `);

  $("searchButton").onclick = performSearch;

  $("searchInput").onkeydown = event => {
    if (event.key === "Enter") {
      performSearch();
    }
  };

  $("closeSearch").onclick = closeModal;
}

function performSearch() {
  const q = $("searchInput").value.trim().toLowerCase();

  if (!q) {
    $("searchResults").innerHTML = "";
    return;
  }

  const products = state.products.filter(x =>
    x.title.toLowerCase().includes(q)
  );

  const work = state.freeWork.filter(x =>
    x.title.toLowerCase().includes(q) ||
    x.description.toLowerCase().includes(q)
  );

  const posts = state.posts.filter(x =>
    (x.caption || "").toLowerCase().includes(q)
  );

  $("searchResults").innerHTML = `
    <h3>Products</h3>

    ${
      products.length
        ? products
            .map(
              x => `
                <div class="card">
                  <b>${esc(x.title)}</b>
                </div>
              `
            )
            .join("")
        : "<p>No products found.</p>"
    }

    <h3>Free Work</h3>

    ${
      work.length
        ? work
            .map(
              x => `
                <div class="card">
                  <b>${esc(x.title)}</b>
                  <p>${esc(x.description)}</p>
                </div>
              `
            )
            .join("")
        : "<p>No work found.</p>"
    }

    <h3>Posts</h3>

    ${
      posts.length
        ? posts
            .map(
              x => `
                <div class="card">
                  <p>${esc(x.caption)}</p>
                </div>
              `
            )
            .join("")
        : "<p>No posts found.</p>"
    }
  `;
}

/* =========================
   SETTINGS
   ========================= */

function openSettings() {
  openModal(`
    <h2>Settings</h2>

    <button id="settingsProfile" class="action block">
      👤 Profile
    </button>

    <button id="settingsWallet" class="action block">
      💰 Wallet
    </button>

    <button id="settingsMarket" class="action block">
      🛍 Marketplace
    </button>

    <button id="settingsWork" class="action block">
      💼 Free Work
    </button>

    <button id="settingsClose" class="action block">
      Close
    </button>
  `);

  $("settingsProfile").onclick = () => {
    closeModal();
    go("profile");
  };

  $("settingsWallet").onclick = openWallet;

  $("settingsMarket").onclick = () => {
    closeModal();
    go("market");
  };

  $("settingsWork").onclick = () => {
    closeModal();
    go("work");
  };

  $("settingsClose").onclick = closeModal;
}

/* =========================
   MODAL
   ========================= */

function openModal(content) {
  const modal = $("modal");

  if (!modal) return;

  modal.innerHTML = `
    <div class="modal-box">
      ${content}
    </div>
  `;

  modal.classList.remove("hidden");

  modal.onclick = event => {
    if (event.target === modal) {
      closeModal();
    }
  };
}

function closeModal() {
  const modal = $("modal");

  if (!modal) return;

  modal.classList.add("hidden");
  modal.innerHTML = "";
}

/* =========================
   FILE READER
   ========================= */

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

/* =========================
   LOGOUT
   ========================= */

function logout() {
  state.user = null;
  saveState();

  closeModal();
  toast("Logged out.");

  go("home");
}

/* =========================
   START
   ========================= */

document.addEventListener("DOMContentLoaded", () => {
  bindNavigation();
  render();
});
