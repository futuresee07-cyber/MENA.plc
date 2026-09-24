/* =========================================================
   MENA — MAIN APP
   Guest-first + Supabase
========================================================= */

const SUPABASE_URL =
  "https://ryywkqyeoftuejczeqgg.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_E6S3EtoGbEqA_XkRpJhYpA_g8SvjMeH";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

let currentUser = null;
let currentProfile = null;
let pendingAction = null;


/* =========================================================
   HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

function escapeHTML(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function showMessage(message) {
  alert(message);
}


/* =========================================================
   AUTH
========================================================= */

async function loadCurrentUser() {

  const {
    data: { user },
    error
  } = await supabaseClient.auth.getUser();

  if (error) {
    console.error(error);
    currentUser = null;
    currentProfile = null;
    return null;
  }

  currentUser = user || null;

  if (currentUser) {
    await loadCurrentProfile();
  } else {
    currentProfile = null;
  }

  return currentUser;
}


async function loadCurrentProfile() {

  if (!currentUser) {
    currentProfile = null;
    return null;
  }

  const { data, error } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

  if (error) {
    console.error("Profile error:", error);
    currentProfile = null;
    return null;
  }

  currentProfile = data;
  return data;
}


function isLoggedIn() {
  return !!currentUser;
}


function requireAuth(action = null) {

  if (currentUser) {
    return true;
  }

  pendingAction = action;

  openAuthModal("login");

  return false;
}


/* =========================================================
   AUTH MODAL
========================================================= */

function openAuthModal(type = "login") {

  const modal = $("authModal");

  if (!modal) return;

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");

  if (type === "signup") {
    $("loginBox")?.classList.add("hidden");
    $("signupBox")?.classList.remove("hidden");
  } else {
    $("signupBox")?.classList.add("hidden");
    $("loginBox")?.classList.remove("hidden");
  }
}


function closeAuthModal() {

  const modal = $("authModal");

  if (!modal) return;

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}


function continuePendingAction() {

  if (!pendingAction) return;

  const action = pendingAction;

  pendingAction = null;

  setTimeout(() => {

    if (typeof action === "function") {
      action();
    }

  }, 100);
}


/* =========================================================
   LOGIN
========================================================= */

async function loginUser(email, password) {

  const message = $("loginMessage");

  if (message) {
    message.textContent = "Logging in...";
  }

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email: email.trim(),
      password
    });

  if (error) {

    console.error(error);

    if (message) {
      message.textContent = error.message;
    }

    return false;
  }

  currentUser = data.user;

  await loadCurrentProfile();

  if (message) {
    message.textContent = "Login successful.";
  }

  closeAuthModal();

  await refreshApp();

  continuePendingAction();

  return true;
}


/* =========================================================
   SIGN UP
========================================================= */

async function signupUser(
  name,
  email,
  password
) {

  const message = $("signupMessage");

  if (message) {
    message.textContent =
      "Creating your account...";
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim();

  const username =
    cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 20)
    || `user${Date.now()}`;

  const { data, error } =
    await supabaseClient.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          username
        }
      }
    });

  if (error) {

    console.error(error);

    if (message) {
      message.textContent =
        error.message;
    }

    return false;
  }

  if (!data.session) {

    if (message) {
      message.textContent =
        "Account created. Check your email, confirm your account, then log in.";
    }

    return true;
  }

  currentUser = data.user;

  await loadCurrentProfile();

  closeAuthModal();

  await refreshApp();

  continuePendingAction();

  return true;
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

  const { error } =
    await supabaseClient.auth.signOut();

  if (error) {
    console.error(error);
    showMessage(error.message);
    return;
  }

  currentUser = null;
  currentProfile = null;

  navigate("home");
  renderProfile();
}


/* =========================================================
   NAVIGATION
========================================================= */

function navigate(page) {

  document
    .querySelectorAll(".page")
    .forEach(section => {
      section.classList.remove("active");
    });

  const target =
    document.querySelector(
      `.page[data-page="${page}"]`
    );

  if (target) {
    target.classList.add("active");
  }

  document
    .querySelectorAll(
      ".bottom-nav button[data-page]"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === page
      );

    });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  if (page === "home") {
    loadFeed();
  }

  if (page === "market") {
    loadMarket();
  }

  if (page === "profile") {
    renderProfile();
  }

  if (page === "wallet") {
    loadWallet();
  }

  if (page === "buyCoins") {
    renderCoinPackages();
  }

  if (page === "inbox") {
    loadInbox("messages");
  }

  if (page === "search") {
    $("searchInput")?.focus();
  }
}


/* =========================================================
   FEED
========================================================= */

async function loadFeed() {

  const container =
    $("feedContainer");

  if (!container) return;

  container.innerHTML =
    `<div class="empty-state">Loading posts...</div>`;

  const { data, error } =
    await supabaseClient
      .from("posts")
      .select("*")
      .order("created_at", {
        ascending: false
      })
      .limit(50);

  if (error) {

    console.error(error);

    container.innerHTML =
      `<div class="empty-state">
        Unable to load posts.
      </div>`;

    return;
  }

  if (!data || data.length === 0) {

    container.innerHTML =
      `<div class="empty-state">
        No posts yet.
      </div>`;

    return;
  }

  container.innerHTML =
    data.map(renderPost).join("");
}


function renderPost(post) {

  const media =
    post.media_url
      ? (
          post.media_type === "video"
            ? `<video
                 class="post-media"
                 src="${escapeHTML(post.media_url)}"
                 controls
                 playsinline>
               </video>`
            : `<img
                 class="post-media"
                 src="${escapeHTML(post.media_url)}"
                 alt="MENA post"
                 loading="lazy">`
        )
      : "";

  return `
    <article
      class="post-card"
      data-post-id="${escapeHTML(post.id)}"
    >

      <div class="post-header">

        <div class="post-avatar"></div>

        <div class="post-user">
          <strong>
            ${escapeHTML(
              post.username || "MENA User"
            )}
          </strong>

          <small>
            ${formatDate(post.created_at)}
          </small>
        </div>

      </div>

      ${media}

      <div class="post-body">

        ${
          post.caption
            ? `<div class="post-caption">
                ${escapeHTML(post.caption)}
               </div>`
            : ""
        }

        <div class="post-actions">

          <button
            type="button"
            onclick="handleLike('${post.id}')"
          >
            ♡ Like
          </button>

          <button
            type="button"
            onclick="handleComment('${post.id}')"
          >
            💬 Comment
          </button>

          <button
            type="button"
            onclick="sharePost('${post.id}')"
          >
            ↗ Share
          </button>

        </div>

      </div>

    </article>
  `;
}


/* =========================================================
   LIKE
========================================================= */

async function handleLike(postId) {

  if (
    !requireAuth(
      () => handleLike(postId)
    )
  ) {
    return;
  }

  const { error } =
    await supabaseClient
      .from("post_likes")
      .insert({
        post_id: postId,
        user_id: currentUser.id
      });

  if (error) {

    if (
      error.code === "23505"
    ) {
      showMessage(
        "You already liked this post."
      );
    } else {
      console.error(error);
      showMessage(error.message);
    }

    return;
  }

  loadFeed();
}


/* =========================================================
   COMMENTS
========================================================= */

async function handleComment(postId) {

  if (
    !requireAuth(
      () => handleComment(postId)
    )
  ) {
    return;
  }

  const comment =
    prompt("Write your comment:");

  if (!comment || !comment.trim()) {
    return;
  }

  const { error } =
    await supabaseClient
      .from("comments")
      .insert({
        post_id: postId,
        user_id: currentUser.id,
        content: comment.trim()
      });

  if (error) {

    console.error(error);
    showMessage(error.message);
    return;
  }

  showMessage("Comment added.");
}


/* =========================================================
   SHARE
========================================================= */

async function sharePost(postId) {

  const url =
    `${window.location.origin}${window.location.pathname}?post=${postId}`;

  try {

    if (navigator.share) {

      await navigator.share({
        title: "MENA",
        text: "Check this post on MENA",
        url
      });

    } else {

      await navigator.clipboard.writeText(url);

      showMessage(
        "Post link copied."
      );
    }

  } catch (error) {

    console.log(error);

  }
}


/* =========================================================
   MARKET
========================================================= */

async function loadMarket() {

  await loadMarketCategories();
  await loadProducts();
}


async function loadMarketCategories() {

  const container =
    $("marketCategories");

  const select =
    $("sellCategory");

  if (!container) return;

  const { data, error } =
    await supabaseClient
      .from("market_categories")
      .select("*")
      .order("name");

  if (error) {

    console.error(error);

    container.innerHTML = "";

    return;
  }

  container.innerHTML =
    `<button
      class="category-chip active"
      data-category-id=""
      type="button">
      All
     </button>`
    +
    (data || [])
      .map(category => `
        <button
          class="category-chip"
          data-category-id="${escapeHTML(category.id)}"
          type="button">
          ${escapeHTML(category.name)}
        </button>
      `)
      .join("");

  if (select) {

    select.innerHTML =
      `<option value="">
        Select category
       </option>`
      +
      (data || [])
        .map(category => `
          <option value="${escapeHTML(category.id)}">
            ${escapeHTML(category.name)}
          </option>
        `)
        .join("");
  }

  document
    .querySelectorAll(
      ".category-chip"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".category-chip"
            )
            .forEach(item =>
              item.classList.remove(
                "active"
              )
            );

          button.classList.add(
            "active"
          );

          loadProducts(
            button.dataset.categoryId
          );
        }
      );

    });
}


async function loadProducts(categoryId = "") {

  const container =
    $("marketProducts");

  if (!container) return;

  container.innerHTML =
    `<div class="empty-state">
      Loading products...
    </div>`;

  let query =
    supabaseClient
      .from("marketplace_listings")
      .select("*")
      .eq("status", "active")
      .order("created_at", {
        ascending: false
      })
      .limit(50);

  if (categoryId) {
    query =
      query.eq(
        "category_id",
        categoryId
      );
  }

  const { data, error } =
    await query;

  if (error) {

    console.error(error);

    container.innerHTML =
      `<div class="empty-state">
        Unable to load products.
      </div>`;

    return;
  }

  if (!data || data.length === 0) {

    container.innerHTML =
      `<div class="empty-state">
        No products available.
      </div>`;

    return;
  }

  container.innerHTML =
    data.map(product => `

      <article
        class="product-card"
        onclick="showProduct('${product.id}')"
      >

        ${
          product.image_url
            ? `<img
                class="product-image"
                src="${escapeHTML(product.image_url)}"
                alt="${escapeHTML(product.title)}">`
            : `<div class="product-image"></div>`
        }

        <div class="product-info">

          <h3>
            ${escapeHTML(product.title)}
          </h3>

          <div class="product-price">
            ${money(product.price)} ETB
          </div>

        </div>

      </article>

    `).join("");
}


/* =========================================================
   MARKET TABS
========================================================= */

function showMarketTab(tab) {

  document
    .querySelectorAll(
      ".market-tab"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.marketTab === tab
      );

    });

  document
    .querySelectorAll(
      ".market-section"
    )
    .forEach(section => {
      section.classList.remove(
        "active"
      );
    });

  if (tab === "shop") {

    $("marketShopPage")
      ?.classList.add("active");

    loadMarket();

  }

  if (tab === "sell") {

    if (
      !requireAuth(
        () => showMarketTab("sell")
      )
    ) {
      return;
    }

    $("marketSellPage")
      ?.classList.add("active");

  }

  if (tab === "work") {

    if (
      !requireAuth(
        () => showMarketTab("work")
      )
    ) {
      return;
    }

    $("marketWorkPage")
      ?.classList.add("active");

    loadFreeWork();
  }
}


/* =========================================================
   SELL PRICE
========================================================= */

function calculateSellerPrice() {

  const input =
    $("sellDesiredAmount");

  const preview =
    $("sellerPricePreview");

  if (!input || !preview) return;

  const desired =
    Number(input.value || 0);

  if (desired <= 0) {

    preview.innerHTML =
      `Buyer product price:
       <strong>0 ETB</strong>`;

    return;
  }

  const buyerPrice =
    desired / 0.95;

  preview.innerHTML =
    `Buyer product price:
     <strong>${money(buyerPrice)} ETB</strong>`;
}


/* =========================================================
   SELL PRODUCT
========================================================= */

async function publishProduct(event) {

  event.preventDefault();

  if (
    !requireAuth(
      () => {
        $("sellForm")?.requestSubmit();
      }
    )
  ) {
    return;
  }

  const title =
    $("sellTitle")?.value.trim();

  const description =
    $("sellDescription")?.value.trim();

  const desired =
    Number(
      $("sellDesiredAmount")?.value
    );

  const categoryId =
    $("sellCategory")?.value;

  if (
    !title ||
    !description ||
    !desired ||
    !categoryId
  ) {
    showMessage(
      "Please complete all required fields."
    );
    return;
  }

  /*
    IMPORTANT:
    This calculates the buyer-facing
    price from the seller's desired
    receive amount.

    Seller receives desired amount.
    MENA fee = 5%.
  */

  const buyerPrice =
    desired / 0.95;

  const imageFile =
    $("sellImage")?.files?.[0];

  let imageUrl = null;

  if (imageFile) {

    const path =
      `${currentUser.id}/products/${crypto.randomUUID()}-${imageFile.name}`;

    const { error: uploadError } =
      await supabaseClient.storage
        .from("media")
        .upload(path, imageFile);

    if (uploadError) {

      console.error(uploadError);

      showMessage(
        uploadError.message
      );

      return;
    }

    const { data } =
      supabaseClient.storage
        .from("media")
        .getPublicUrl(path);

    imageUrl =
      data.publicUrl;
  }

  /*
    NOTE:
    Final production marketplace creation
    should be moved to a secure backend
    Edge Function before accepting money.
  */

  const { error } =
    await supabaseClient
      .from("marketplace_listings")
      .insert({
        seller_id: currentUser.id,
        title,
        description,
        category_id: categoryId,
        price: buyerPrice,
        platform_fee_percent: 5,
        status: "active",
        image_url: imageUrl
      });

  if (error) {

    console.error(error);

    showMessage(error.message);

    return;
  }

  $("sellForm")?.reset();

  calculateSellerPrice();

  showMessage(
    "Product published."
  );

  showMarketTab("shop");
}


/* =========================================================
   PRODUCT DETAILS
========================================================= */

async function showProduct(productId) {

  const { data, error } =
    await supabaseClient
      .from("marketplace_listings")
      .select("*")
      .eq("id", productId)
      .single();

  if (error) {

    console.error(error);

    showMessage(error.message);

    return;
  }

  openGlobalModal(`

    <h2>
      ${escapeHTML(data.title)}
    </h2>

    ${
      data.image_url
        ? `<img
            src="${escapeHTML(data.image_url)}"
            style="width:100%;border-radius:12px;margin:15px 0;"
            alt="${escapeHTML(data.title)}">`
        : ""
    }

    <p>
      ${escapeHTML(data.description || "")}
    </p>

    <h3 style="margin:12px 0;">
      ${money(data.price)} ETB
    </h3>

    <p class="muted">
      Delivery: 80 ETB
    </p>

    <button
      class="primary-btn"
      onclick="buyProduct('${data.id}')"
    >
      Buy Now
    </button>

  `);
}


/* =========================================================
   BUY PRODUCT
========================================================= */

async function buyProduct(productId) {

  if (
    !requireAuth(
      () => buyProduct(productId)
    )
  ) {
    return;
  }

  showMessage(
    "Secure marketplace checkout will be connected through the backend before real payments are accepted."
  );
}


/* =========================================================
   FREE WORK
========================================================= */

async function loadFreeWork() {

  const container =
    $("freeWorkList");

  if (!container) return;

  container.innerHTML =
    `<div class="empty-state">
      Loading work...
    </div>`;

  const { data, error } =
    await supabaseClient
      .from("free_work_posts")
      .select("*")
      .order("created_at", {
        ascending: false
      })
      .limit(50);

  if (error) {

    console.error(error);

    container.innerHTML =
      `<div class="empty-state">
        Unable to load work.
      </div>`;

    return;
  }

  if (!data || data.length === 0) {

    container.innerHTML =
      `<div class="empty-state">
        No work posts yet.
      </div>`;

    return;
  }

  container.innerHTML =
    data.map(work => `

      <article class="work-card">

        <h3>
          ${escapeHTML(work.title)}
        </h3>

        <p>
          ${escapeHTML(
            work.description || ""
          )}
        </p>

        ${
          work.location
            ? `<small>
                📍 ${escapeHTML(work.location)}
               </small>`
            : ""
        }

      </article>

    `).join("");
}


async function publishFreeWork(event) {

  event.preventDefault();

  if (
    !requireAuth(
      () => $("freeWorkForm")?.requestSubmit()
    )
  ) {
    return;
  }

  const title =
    $("freeWorkTitle")?.value.trim();

  const description =
    $("freeWorkDescription")?.value.trim();

  const location =
    $("freeWorkLocation")?.value.trim();

  if (!title || !description) {

    showMessage(
      "Please complete the required fields."
    );

    return;
  }

  /*
    Final production version:
    50 ETB posting fee should be
    verified and charged by secure
    backend before publishing.
  */

  const { error } =
    await supabaseClient
      .from("free_work_posts")
      .insert({
        user_id: currentUser.id,
        title,
        description,
        location,
        posting_fee_etb: 50
      });

  if (error) {

    console.error(error);

    showMessage(error.message);

    return;
  }

  $("freeWorkForm")?.reset();

  showMessage(
    "Free Work post published."
  );

  loadFreeWork();
}


/* =========================================================
   PROFILE
========================================================= */

async function renderProfile() {

  if (!currentUser) {

    $("profileUsername").textContent =
      "Guest";

    $("profileBio").textContent =
      "Join MENA to create your profile.";

    $("profilePosts").textContent = "0";
    $("profileFollowers").textContent = "0";
    $("profileFollowing").textContent = "0";
    $("profileLikes").textContent = "0";

    $("profileContent").innerHTML =
      `<div class="empty-state">
        Login to see your personal profile.
       </div>`;

    return;
  }

  await loadCurrentProfile();

  const profile =
    currentProfile || {};

  $("profileUsername").textContent =
    profile.username ||
    profile.full_name ||
    currentUser.email ||
    "MENA User";

  $("profileBio").textContent =
    profile.bio ||
    "Welcome to MENA.";

  if (profile.avatar_url) {

    $("profilePicture").src =
      profile.avatar_url;
  }

  await loadProfileStats();

  await loadProfilePosts();
}


async function loadProfileStats() {

  if (!currentUser) return;

  const { count: posts } =
    await supabaseClient
      .from("posts")
      .select("*", {
        count: "exact",
        head: true
      })
      .eq(
        "user_id",
        currentUser.id
      );

  const { count: followers } =
    await supabaseClient
      .from("follows")
      .select("*", {
        count: "exact",
        head: true
      })
      .eq(
        "following_id",
        currentUser.id
      );

  const { count: following } =
    await supabaseClient
      .from("follows")
      .select("*", {
        count: "exact",
        head: true
      })
      .eq(
        "follower_id",
        currentUser.id
      );

  $("profilePosts").textContent =
    posts || 0;

  $("profileFollowers").textContent =
    followers || 0;

  $("profileFollowing").textContent =
    following || 0;
}


async function loadProfilePosts() {

  const container =
    $("profileContent");

  if (!container || !currentUser) return;

  const { data, error } =
    await supabaseClient
      .from("posts")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      )
      .order("created_at", {
        ascending: false
      });

  if (error) {

    console.error(error);

    container.innerHTML =
      `<div class="empty-state">
        Unable to load posts.
       </div>`;

    return;
  }

  if (!data || data.length === 0) {

    container.innerHTML =
      `<div class="empty-state">
        You have not posted anything yet.
       </div>`;

    return;
  }

  container.innerHTML =
    data.map(renderPost).join("");
}


/* =========================================================
   WALLET
========================================================= */

async function loadWallet() {

  if (
    !requireAuth(
      () => loadWallet()
    )
  ) {
    return;
  }

  const { data, error } =
    await supabaseClient
      .from("wallets")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      )
      .single();

  if (error) {

    console.error(error);

    showMessage(
      "Unable to load wallet."
    );

    return;
  }

  $("walletCoins").textContent =
    data.coin_balance || 0;

  $("walletEtb").textContent =
    money(data.etb_balance);

  $("withdrawBalance").textContent =
    `${money(data.etb_balance)} ETB`;

  loadWalletTransactions();
}


async function loadWalletTransactions() {

  const container =
    $("walletTransactions");

  if (!container) return;

  const { data, error } =
    await supabaseClient
      .from("coin_transactions")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      )
      .order("created_at", {
        ascending: false
      })
      .limit(30);

  if (error) {

    console.error(error);

    container.innerHTML = "";

    return;
  }

  container.innerHTML =
    (data || [])
      .map(transaction => `

        <div class="transaction">

          <span>
            ${escapeHTML(
              transaction.type || "Transaction"
            )}
          </span>

          <strong>
            ${transaction.amount || 0}
          </strong>

        </div>

      `)
      .join("");
}


/* =========================================================
   COINS
========================================================= */

function renderCoinPackages() {

  const container =
    $("coinPackages");

  if (!container) return;

  const packages = [
    10,
    50,
    100,
    500,
    1000,
    5000,
    10000,
    27000
  ];

  container.innerHTML =
    packages.map(coins => `

      <div class="coin-package">

        <strong>
          🪙 ${coins}
        </strong>

        <span>
          ${money(coins * 0.5)} ETB
        </span>

        <button
          type="button"
          onclick="startCoinPurchase(${coins})"
        >
          Buy
        </button>

      </div>

    `).join("");
}


function startCoinPurchase(coins) {

  if (
    !requireAuth(
      () => startCoinPurchase(coins)
    )
  ) {
    return;
  }

  showMessage(
    `Coin purchase selected: ${coins} coins. Secure Telebirr/M-PESA payment will be connected through the backend.`
  );
}


/* =========================================================
   INBOX
========================================================= */

function loadInbox(type = "messages") {

  const container =
    $("inboxContent");

  if (!container) return;

  if (
    !requireAuth(
      () => loadInbox(type)
    )
  ) {
    return;
  }

  if (type === "messages") {

    container.innerHTML = `
      <div class="empty-state">
        Your messages will appear here.
      </div>
    `;

    return;
  }

  if (type === "notifications") {

    container.innerHTML = `
      <div class="empty-state">
        Your notifications will appear here.
      </div>
    `;

    return;
  }

  if (type === "gifts") {

    loadReceivedGifts();

  }
}


async function loadReceivedGifts() {

  const container =
    $("inboxContent");

  const { data, error } =
    await supabaseClient
      .from("gift_transactions")
      .select("*")
      .eq(
        "receiver_id",
        currentUser.id
      )
      .order("created_at", {
        ascending: false
      })
      .limit(50);

  if (error) {

    console.error(error);

    container.innerHTML =
      `<div class="empty-state">
        Unable to load gifts.
       </div>`;

    return;
  }

  if (!data || data.length === 0) {

    container.innerHTML =
      `<div class="empty-state">
        No gifts received yet.
       </div>`;

    return;
  }

  container.innerHTML =
    data.map(gift => `

      <div class="gift-row">

        🎁 Gift received

        <strong>
          ${gift.coin_amount || 0} coins
        </strong>

      </div>

    `).join("");
}


/* =========================================================
   SEARCH
========================================================= */

async function searchMena() {

  const input =
    $("searchInput");

  const results =
    $("searchResults");

  if (!input || !results) return;

  const term =
    input.value.trim();

  if (!term) {

    results.innerHTML =
      `<div class="empty-state">
        Enter something to search.
       </div>`;

    return;
  }

  results.innerHTML =
    `<div class="empty-state">
      Searching...
     </div>`;

  const { data, error } =
    await supabaseClient
      .from("marketplace_listings")
      .select("*")
      .ilike(
        "title",
        `%${term}%`
      )
      .eq("status", "active")
      .limit(30);

  if (error) {

    console.error(error);

    results.innerHTML =
      `<div class="empty-state">
        Search failed.
       </div>`;

    return;
  }

  if (!data || data.length === 0) {

    results.innerHTML =
      `<div class="empty-state">
        No results found.
       </div>`;

    return;
  }

  results.innerHTML =
    data.map(item => `

      <div
        class="work-card"
        onclick="showProduct('${item.id}')"
      >

        <h3>
          ${escapeHTML(item.title)}
        </h3>

        <strong class="product-price">
          ${money(item.price)} ETB
        </strong>

      </div>

    `).join("");
}


/* =========================================================
   GLOBAL MODAL
========================================================= */

function openGlobalModal(content) {

  const modal =
    $("globalModal");

  const contentBox =
    $("modalContent");

  if (!modal || !contentBox) return;

  contentBox.innerHTML =
    content;

  modal.classList.remove(
    "hidden"
  );

  modal.setAttribute(
    "aria-hidden",
    "false"
  );
}


function closeGlobalModal() {

  const modal =
    $("globalModal");

  if (!modal) return;

  modal.classList.add(
    "hidden"
  );

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  $("modalContent").innerHTML = "";
}


/* =========================================================
   MEDIA UPLOAD
========================================================= */

async function createPostFromFile(file) {

  if (
    !requireAuth(
      () => createPostFromFile(file)
    )
  ) {
    return;
  }

  if (!file) return;

  const mediaType =
    file.type.startsWith("video/")
      ? "video"
      : "image";

  const extension =
    file.name.split(".").pop();

  const path =
    `${currentUser.id}/posts/${crypto.randomUUID()}.${extension}`;

  showMessage(
    "Uploading your post..."
  );

  const { error: uploadError } =
    await supabaseClient.storage
      .from("media")
      .upload(
        path,
        file
      );

  if (uploadError) {

    console.error(uploadError);

    showMessage(
      uploadError.message
    );

    return;
  }

  const { data } =
    supabaseClient.storage
      .from("media")
      .getPublicUrl(path);

  const mediaUrl =
    data.publicUrl;

  const caption =
    prompt(
      "Write a caption:"
    ) || "";

  /*
    Final production version should
    validate and insert through a secure
    backend where necessary.
  */

  const { error } =
    await supabaseClient
      .from("posts")
      .insert({
        user_id: currentUser.id,
        media_url: mediaUrl,
        media_type: mediaType,
        caption
      });

  if (error) {

    console.error(error);

    showMessage(
      error.message
    );

    return;
  }

  showMessage(
    "Post published."
  );

  navigate("home");
}


/* =========================================================
   DATE
========================================================= */

function formatDate(date) {

  if (!date) return "";

  const value =
    new Date(date);

  return value.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric"
    }
  );
}


/* =========================================================
   REFRESH
========================================================= */

async function refreshApp() {

  await loadCurrentUser();

  await loadFeed();

  await renderProfile();
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    /* Navigation */

    document
      .querySelectorAll(
        "[data-page]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const page =
              button.dataset.page;

            if (page) {
              navigate(page);
            }

          }
        );

      });


    /* Search */

    $("searchBtn")
      ?.addEventListener(
        "click",
        () => navigate("search")
      );

    $("searchSubmit")
      ?.addEventListener(
        "click",
        searchMena
      );

    $("searchInput")
      ?.addEventListener(
        "keydown",
        event => {

          if (
            event.key === "Enter"
          ) {
            searchMena();
          }

        }
      );


    /* Settings */

    $("settingsBtn")
      ?.addEventListener(
        "click",
        () => navigate("settings")
      );


    /* Create */

    $("createBtn")
      ?.addEventListener(
        "click",
        () => navigate("create")
      );


    $("createPostBtn")
      ?.addEventListener(
        "click",
        () => {

          if (
            !requireAuth(
              () =>
                $("mediaInput")?.click()
            )
          ) {
            return;
          }

          $("mediaInput")?.click();

        }
      );


    $("mediaInput")
      ?.addEventListener(
        "change",
        event => {

          const file =
            event.target.files?.[0];

          if (file) {
            createPostFromFile(file);
          }

          event.target.value = "";

        }
      );


    $("createLiveBtn")
      ?.addEventListener(
        "click",
        () => {

          if (
            !requireAuth(
              () => $("createLiveBtn")?.click()
            )
          ) {
            return;
          }

          showMessage(
            "Live streaming will be connected to the real streaming backend in a later step."
          );

        }
      );


    /* Market */

    document
      .querySelectorAll(
        ".market-tab"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () =>
            showMarketTab(
              button.dataset.marketTab
            )
        );

      });


    $("sellDesiredAmount")
      ?.addEventListener(
        "input",
        calculateSellerPrice
      );


    $("sellForm")
      ?.addEventListener(
        "submit",
        publishProduct
      );


    $("freeWorkForm")
      ?.addEventListener(
        "submit",
        publishFreeWork
      );


    /* Profile */

    $("walletBtn")
      ?.addEventListener(
        "click",
        () => navigate("wallet")
      );

    $("withdrawBtn")
      ?.addEventListener(
        "click",
        () => {

          if (
            requireAuth(
              () => navigate("withdraw")
            )
          ) {
            navigate("withdraw");
          }

        }
      );

    $("buyCoinsBtn")
      ?.addEventListener(
        "click",
        () => {

          if (
            requireAuth(
              () => navigate("buyCoins")
            )
          ) {
            navigate("buyCoins");
          }

        }
      );


    $("logoutBtn")
      ?.addEventListener(
        "click",
        logoutUser
      );


    $("editProfileBtn")
      ?.addEventListener(
        "click",
        () => {

          if (
            !requireAuth(
              () =>
                $("editProfileBtn")?.click()
            )
          ) {
            return;
          }

          showMessage(
            "Profile editing will be connected to the real profile editor."
          );

        }
      );


    /* Withdraw */

    $("withdrawForm")
      ?.addEventListener(
        "submit",
        event => {

          event.preventDefault();

          if (
            !requireAuth(
              () =>
                $("withdrawForm")?.requestSubmit()
            )
          ) {
            return;
          }

          showMessage(
            "Secure withdrawal backend is required before real money can be withdrawn."
          );

        }
      );


    /* Auth */

    $("authModalClose")
      ?.addEventListener(
        "click",
        closeAuthModal
      );


    $("showSignupBtn")
      ?.addEventListener(
        "click",
        () => openAuthModal("signup")
      );


    $("showLoginBtn")
      ?.addEventListener(
        "click",
        () => openAuthModal("login")
      );


    $("loginForm")
      ?.addEventListener(
        "submit",
        async event => {

          event.preventDefault();

          await loginUser(
            $("loginEmail").value,
            $("loginPassword").value
          );

        }
      );


    $("signupForm")
      ?.addEventListener(
        "submit",
        async event => {

          event.preventDefault();

          const password =
            $("signupPassword").value;

          const password2 =
            $("signupPassword2").value;

          if (
            password !== password2
          ) {

            $("signupMessage").textContent =
              "Passwords do not match.";

            return;
          }

          await signupUser(
            $("signupName").value,
            $("signupEmail").value,
            password
          );

        }
      );


    /* Global modal */

    $("modalCloseBtn")
      ?.addEventListener(
        "click",
        closeGlobalModal
      );


    /* Inbox */

    document
      .querySelectorAll(
        ".inbox-tab"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                ".inbox-tab"
              )
              .forEach(item =>
                item.classList.remove(
                  "active"
                )
              );

            button.classList.add(
              "active"
            );

            loadInbox(
              button.dataset.inboxTab
            );

          }
        );

      });


    /* Auth state */

    supabaseClient.auth.onAuthStateChange(
      async (event, session) => {

        currentUser =
          session?.user || null;

        if (currentUser) {
          await loadCurrentProfile();
        } else {
          currentProfile = null;
        }

        console.log(
          "MENA:",
          event,
          currentUser
            ? currentUser.email
            : "Guest"
        );

      }
    );


    /* Initial startup */

    await refreshApp();

    navigate("home");

  }
);
