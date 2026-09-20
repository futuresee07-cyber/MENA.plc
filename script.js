/* =========================================
   MENA — Main App JavaScript
   ========================================= */

let balance = 0;
let coins = 0;
let likedPosts = new Set();

const posts = [
  {
    user: "MENA Team",
    avatar: "🌍",
    text: "Welcome to MENA — Connect. Discover. Grow. 💚",
    image: "MENA"
  },
  {
    user: "Hana Fashion",
    avatar: "👩",
    text: "New fashion products are now available in MENA Market 🛍️",
    image: "👗"
  }
];

const products = [
  {
    name: "Samsung Phone",
    price: "12,500 ETB",
    seller: "Dawit",
    phone: "0912345678",
    location: "Addis Ababa",
    description: "Good condition Samsung phone.",
    image: "📱"
  },
  {
    name: "Fashion Shoes",
    price: "1,800 ETB",
    seller: "Hana",
    phone: "0923456789",
    location: "Bole",
    description: "New fashion shoes.",
    image: "👟"
  },
  {
    name: "Laptop",
    price: "28,000 ETB",
    seller: "Abel",
    phone: "0922222222",
    location: "Addis Ababa",
    description: "Laptop suitable for work and study.",
    image: "💻"
  },
  {
    name: "Home Chair",
    price: "2,500 ETB",
    seller: "Selam",
    phone: "0911111111",
    location: "Piassa",
    description: "Comfortable home chair.",
    image: "🪑"
  }
];

/* =========================
   PAGE NAVIGATION
   ========================= */

function openPage(pageId, button) {

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const page = document.getElementById(pageId);

  if (page) {
    page.classList.add("active");
  }

  document.querySelectorAll(".nav").forEach(nav => {
    nav.classList.remove("active");
  });

  if (button) {
    button.classList.add("active");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   FEED
   ========================= */

function loadFeed() {

  const feed = document.getElementById("feed");

  if (!feed) return;

  feed.innerHTML = "";

  posts.forEach((post, index) => {

    const liked = likedPosts.has(index);

    feed.innerHTML += `
      <article class="post">

        <div class="post-header">
          <div class="avatar">${post.avatar}</div>

          <div>
            <b>${post.user}</b>
            <div style="font-size:11px;color:#77827e;">
              Just now · 🌍 MENA
            </div>
          </div>
        </div>

        <div class="post-content">
          ${escapeHTML(post.text)}
        </div>

        <div class="post-image">
          ${post.image}
        </div>

        <div class="post-actions">

          <button onclick="likePost(${index})">
            ${liked ? "❤️" : "🤍"}
            ${liked ? "Liked" : "Like"}
          </button>

          <button onclick="commentPost(${index})">
            💬 Comment
          </button>

          <button onclick="sharePost()">
            ↗ Share
          </button>

        </div>

      </article>
    `;
  });
}


function likePost(index) {

  if (likedPosts.has(index)) {
    likedPosts.delete(index);
  } else {
    likedPosts.add(index);
  }

  loadFeed();
}


function commentPost(index) {

  const comment = prompt("Write your comment:");

  if (!comment) return;

  alert("💬 Comment added!");
}


function sharePost() {

  if (navigator.share) {

    navigator.share({
      title: "MENA",
      text: "Check this post on MENA!"
    }).catch(() => {});

  } else {

    alert("🔗 Post link copied!");
  }
}


/* =========================
   CREATE POST
   ========================= */

function createPost() {

  const text = prompt("What do you want to share?");

  if (!text) return;

  posts.unshift({
    user: "You",
    avatar: "👤",
    text: text,
    image: "MENA"
  });

  loadFeed();

  alert("✅ Your post was published!");
}


/* =========================
   MARKET
   ========================= */

function loadProducts() {

  const grid = document.getElementById("productGrid");

  if (!grid) return;

  grid.innerHTML = "";

  products.forEach((product, index) => {

    grid.innerHTML += `
      <div class="product">

        <div class="product-image">
          ${product.image}
        </div>

        <div class="product-info">

          <h3>${escapeHTML(product.name)}</h3>

          <div class="price">
            ${product.price}
          </div>

          <div class="location">
            📍 ${escapeHTML(product.location)}
          </div>

          <button class="view"
                  onclick="viewProduct(${index})">
            View Details
          </button>

        </div>

      </div>
    `;
  });
}


/* =========================
   MARKET TABS
   ========================= */

function showMarketTab(type, button) {

  document
    .querySelectorAll(".market-tabs button")
    .forEach(btn => btn.classList.remove("active"));

  if (button) {
    button.classList.add("active");
  }

  const productsTab =
    document.getElementById("productsTab");

  const jobsTab =
    document.getElementById("jobsTab");

  if (!productsTab || !jobsTab) return;

  if (type === "products") {

    productsTab.classList.remove("hidden");
    jobsTab.classList.add("hidden");

  } else {

    productsTab.classList.add("hidden");
    jobsTab.classList.remove("hidden");
  }
}


/* =========================
   PRODUCT DETAILS
   ========================= */

function viewProduct(index) {

  const product = products[index];

  if (!product) return;

  const image =
    document.getElementById("productImage");

  const name =
    document.getElementById("productName");

  const price =
    document.getElementById("productPrice");

  const seller =
    document.getElementById("productSeller");

  const phone =
    document.getElementById("productPhone");

  const location =
    document.getElementById("productLocation");

  const description =
    document.getElementById("productDescription");

  const modal =
    document.getElementById("productModal");

  if (image) image.textContent = product.image;
  if (name) name.textContent = product.name;
  if (price) price.textContent = product.price;
  if (seller) seller.textContent = product.seller;
  if (phone) phone.textContent = product.phone;
  if (location) location.textContent = product.location;
  if (description) description.textContent = product.description;

  if (modal) {
    modal.classList.add("show");
  }
}


function closeModal(id) {

  const modal = document.getElementById(id);

  if (modal) {
    modal.classList.remove("show");
  }
}


function contactSeller() {

  const phone =
    document.getElementById("productPhone");

  if (!phone) return;

  const number = phone.textContent;

  if (confirm("Call seller: " + number + "?")) {

    window.location.href = "tel:" + number;
  }
}


/* =========================
   MARKETPLACE POST
   100 ETB DEMO FEE
   ========================= */

function postMarketItem() {

  const name =
    prompt("Material / product name:");

  if (!name) return;

  const price =
    prompt("Selling price in ETB:");

  if (!price) return;

  const location =
    prompt("Location:");

  if (!location) return;

  const phone =
    prompt("Your phone number:");

  if (!phone) return;

  /*
     DEMO:
     Marketplace posting fee = 100 ETB.
     
     Real Telebirr payment cannot be processed
     from frontend-only GitHub Pages.
  */

  const confirmed =
    confirm(
      "Marketplace posting fee: 100 ETB\n\n" +
      "Continue to payment?"
    );

  if (!confirmed) return;

  alert(
    "Payment page will be connected here.\n\n" +
    "Required fee: 100 ETB\n\n" +
    "This is currently DEMO mode."
  );
}


/* =========================
   FREE WORK
   ========================= */

function postJob() {

  const title =
    prompt("Work title:");

  if (!title) return;

  const description =
    prompt("Describe the work:");

  if (!description) return;

  const location =
    prompt("Work location:");

  if (!location) return;

  const payment =
    prompt("Payment / salary:");

  if (!payment) return;

  alert(
    "✅ Work opportunity created!\n\n" +
    title
  );
}


/* =========================
   LIVE STREAM
   ========================= */

function startLive() {

  alert(
    "🔴 MENA Live\n\n" +
    "Live streaming interface will open here.\n\n" +
    "Camera and real-time streaming require a backend/live service."
  );
}


/* =========================
   TELEBIRR
   ========================= */

function connectTelebirr() {

  const phone =
    prompt("Enter your Telebirr phone number:");

  if (!phone) return;

  const element =
    document.getElementById("telebirrPhone");

  if (element) {
    element.textContent =
      "Telebirr: " + phone;
  }

  alert(
    "✅ Telebirr number saved in DEMO mode."
  );
}


/* =========================
   BALANCE
   ========================= */

function depositMoney() {

  const amount =
    Number(prompt("Deposit amount in ETB:"));

  if (!amount || amount <= 0) {
    alert("Enter a valid amount.");
    return;
  }

  balance += amount;

  alert(
    "Demo balance updated.\n\n" +
    "Balance: " +
    balance.toFixed(2) +
    " ETB"
  );
}


function withdrawMoney() {

  const amount =
    Number(prompt("Withdrawal amount in ETB:"));

  if (!amount || amount < 10) {

    alert(
      "Minimum withdrawal is 10 ETB."
    );

    return;
  }

  if (amount > balance) {

    alert(
      "Insufficient demo balance."
    );

    return;
  }

  balance -= amount;

  alert(
    "✅ Demo withdrawal request created.\n\n" +
    amount +
    " ETB"
  );
}


/* =========================
   GIFTS
   ========================= */

function sendGift(name, cost) {

  if (coins <
