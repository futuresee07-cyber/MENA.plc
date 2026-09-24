/* =========================================================
   MENA — SCRIPT.JS
   Guest browsing + Supabase authentication
   ========================================================= */


/* =========================================================
   1. SUPABASE
   ========================================================= */

const SUPABASE_URL =
  "https://ryywkqyeoftuejczeqgg.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_E6S3EtoGbEqA_XkRpJhYpA_g8SvjMeH";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   2. GLOBAL STATE
   ========================================================= */

let currentUser = null;
let currentProfile = null;

let currentPage = "home";
let currentMarketTab = "shop";

let selectedCategory = null;
let selectedCoinPackage = null;

let pendingAction = null;


/* =========================================================
   3. BASIC HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

function escapeHTML(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatETB(value) {
  const number = Number(value || 0);

  return number.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }) + " ETB";
}

function formatCoins(value) {
  return Number(value || 0).toLocaleString("en-US") + " coins";
}

function show(element) {
  if (element) {
    element.classList.remove("hidden");
  }
}

function hide(element) {
  if (element) {
    element.classList.add("hidden");
  }
}

function setMessage(id, message, type = "") {
  const element = $(id);

  if (!element) return;

  element.textContent = message;
  element.className = type
    ? `${type}-message`
    : "";
}


/* =========================================================
   4. AUTHENTICATION STATE
   ========================================================= */

async function getCurrentSession() {

  const {
    data,
    error
  } = await supabaseClient.auth.getSession();

  if (error) {
    console.error("Session error:", error);
    return null;
  }

  return data.session;
}


async function loadCurrentUser() {

  const session = await getCurrentSession();

  currentUser = session?.user || null;

  if (currentUser) {
    await loadCurrentProfile();
  } else {
    currentProfile = null;
  }

  updateGuestUI();

  return currentUser;
}


/* =========================================================
   5. PROFILE
   ========================================================= */

async function loadCurrentProfile() {

  if (!currentUser) {
    currentProfile = null;
    return;
  }

  const {
    data,
    error
  } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error("Profile error:", error);
    return;
  }

  currentProfile = data;

  renderProfileHeader();
}


function renderProfileHeader() {

  const username =
    currentProfile?.username ||
    currentProfile?.full_name ||
    currentUser?.email?.split("@")[0] ||
    "User";

  const bio =
    currentProfile?.bio ||
    "";

  if ($("profileUsername")) {
    $("profileUsername").textContent = username;
  }

  if ($("profileBio")) {
    $("profileBio").textContent =
      bio || "Welcome to MENA";
  }

  if ($("profilePicture")) {

    if (currentProfile?.avatar_url) {

      $("profilePicture").src =
        currentProfile.avatar_url;

    } else {

      $("profilePicture").removeAttribute("src");

    }
  }
}


/* =========================================================
   6. GUEST / LOGGED-IN UI
   ========================================================= */

function updateGuestUI() {

  const loginSettingsBtn =
    $("loginSettingsBtn");

  const logoutBtn =
    $("logoutBtn");

  if (currentUser) {

    if (loginSettingsBtn) {
      loginSettingsBtn.textContent =
        "Account";
    }

    if (logoutBtn) {
      logoutBtn.style.display = "";
    }

  } else {

    if (loginSettingsBtn) {
      loginSettingsBtn.textContent =
        "Login / Sign Up";
    }

    if (logoutBtn) {
      logoutBtn.style.display = "none";
    }
  }

  renderProfileHeader();
}


/* =========================================================
   7. AUTH MODAL
   ========================================================= */

function openAuthModal(action = null) {

  pendingAction = action;

  const modal = $("authModal");

  if (!modal) return;

  show(modal);

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  show($("loginBox"));
  hide($("signupBox"));

  $("loginEmail")?.focus();
}


function closeAuthModal() {

  const modal = $("authModal");

  if (!modal) return;

  hide(modal);

  modal.setAttribute(
    "aria-hidden",
    "true"
  );
}


function requireAuth(action = null) {

  if (currentUser) {
    return true;
  }

  openAuthModal(action);

  return false;
}


/* =========================================================
   8. CONTINUE PENDING ACTION
   ========================================================= */

async function continuePendingAction() {

  const action = pendingAction;

  pendingAction = null;

  if (!action) return;

  if (typeof action === "function") {

    try {
      await action();
    } catch (error) {
      console.error(
        "Pending action error:",
        error
      );
    }

  }
}


/* =========================================================
   9. LOGIN
   ========================================================= */

async function loginUser(event) {

  event.preventDefault();

  const email =
    $("loginEmail")?.value.trim();

  const password =
    $("loginPassword")?.value;

  if (!email || !password) {

    setMessage(
      "loginMessage",
      "Enter your email and password."
    );

    return;
  }

  const button = $("loginBtn");

  if (button) {
    button.disabled = true;
    button.textContent = "Logging in...";
  }

  setMessage(
    "loginMessage",
    ""
  );

  const {
    data,
    error
  } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (button) {
    button.disabled = false;
    button.textContent = "Login";
  }

  if (error) {

    console.error(error);

    setMessage(
      "loginMessage",
      error.message,
      "error"
    );

    return;
  }

  currentUser = data.user;

  await loadCurrentProfile();

  closeAuthModal();

  updateGuestUI();

  await continuePendingAction();
}


/* =========================================================
   10. SIGN UP
   ========================================================= */

async function signupUser(event) {

  event.preventDefault();

  const name =
    $("signupName")?.value.trim();

  const email =
    $("signupEmail")?.value.trim();

  const password =
    $("signupPassword")?.value;

  const password2 =
    $("signupPassword2")?.value;

  if (!name || !email || !password) {

    setMessage(
      "signupMessage",
      "Please complete all fields."
    );

    return;
  }

  if (password !== password2) {

    setMessage(
      "signupMessage",
      "Passwords do not match."
    );

    return;
  }

  if (password.length < 6) {

    setMessage(
      "signupMessage",
      "Password must contain at least 6 characters."
    );

    return;
  }

  const button = $("signupBtn");

  if (button) {
    button.disabled = true;
    button.textContent = "Creating...";
  }

  const {
    data,
    error
  } = await supabaseClient.auth.signUp({

    email,
    password,

    options: {
      data: {
        full_name: name,
        username: name
      }
    }

  });

  if (button) {
    button.disabled = false;
    button.textContent = "Create Account";
  }

  if (error) {

    console.error(error);

    setMessage(
      "signupMessage",
      error.message,
      "error"
    );

    return;
  }

  /*
    Supabase may require email confirmation.
  */

  if (!data.session) {

    setMessage(
      "signupMessage",
      "Account created. Check your email to confirm your account.",
      "success"
    );

    return;
  }

  currentUser = data.user;

  await loadCurrentProfile();

  closeAuthModal();

  updateGuestUI();

  await continuePendingAction();
}


/* =========================================================
   11. LOGOUT
   ========================================================= */

async function logoutUser() {

  const {
    error
  } = await supabaseClient.auth.signOut();

  if (error) {

    console.error(error);

    return;
  }

  currentUser = null;
  currentProfile = null;

  updateGuestUI();

  navigate("home");
}


/* =========================================================
   12. AUTH LISTENER
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {

    currentUser =
      session?.user || null;

    if (currentUser) {
      await loadCurrentProfile();
    } else {
      currentProfile = null;
    }

    updateGuestUI();
  }
);


/* =========================================================
   13. NAVIGATION
   ========================================================= */

function navigate(page) {

  const pages =
    qsa("#pageContainer > .page");

  pages.forEach((element) => {

    element.classList.remove("active");

  });

  const target =
    document.querySelector(
      `#pageContainer > [data-page="${page}"]`
    );

  if (!target) {

    console.warn(
      "Page not found:",
      page
    );

    return;
  }

  target.classList.add("active");

  currentPage = page;

  updateBottomNavigation();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  /* Load page data */

  if (page === "home") {
    loadFeed();
  }

  if (page === "market") {
    loadMarketCategories();
    showMarketTab(currentMarketTab);
  }

  if (page === "profile") {
    loadProfileData();
  }

  if (page === "wallet") {
    loadWallet();
  }

  if (page === "inbox") {
    loadInbox();
  }

  if (page === "work") {
    loadFreeWork();
  }
}


function updateBottomNavigation() {

  qsa(".bottom-nav button[data-page]")
    .forEach((button) => {

      button.classList.toggle(
        "active",
        button.dataset.page === currentPage
      );

    });
}


/* =========================================================
   14. MARKET TABS
   ========================================================= */

function showMarketTab(tab) {

  currentMarketTab = tab;

  const shop =
    $("marketShopPage");

  const sell =
    $("marketSellPage");

  const work =
    $("marketWorkPage");

  if (shop) hide(shop);
  if (sell) hide(sell);
  if (work) hide(work);

  qsa(".market-tab")
    .forEach((button) => {
      button.classList.remove("active");
    });


  if (tab === "shop") {

    show(shop);

    $("marketShopTab")
      ?.classList.add("active");

    loadMarketProducts();
  }


  if (tab === "sell") {

    show(sell);

    $("marketSellTab")
      ?.classList.add("active");

    if (!requireAuth(() => {
      showMarketTab("sell");
    })) {
      showMarketTab("shop");
    }
  }


  if (tab === "work") {

    show(work);

    $("marketWorkTab")
      ?.classList.add("active");

    if (!requireAuth(() => {
      showMarketTab("work");
    })) {
      showMarketTab("shop");
    } else {
      loadFreeWork();
    }
  }
}


/* =========================================================
   15. MARKET CATEGORIES
   ========================================================= */

async function loadMarketCategories() {

  const container =
    $("marketCategories");

  if (!container) return;

  container.innerHTML =
    `<div class="loading">Loading categories...</div>`;


  /*
    Try the category table first.
  */

  const {
    data,
    error
  } = await supabaseClient
    .from("market_categories")
    .select("*")
    .order("name");


  if (error) {

    console.error(
      "Category error:",
      error
    );

    container.innerHTML = "";

    return;
  }


  container.innerHTML = "";


  const allButton =
    document.createElement("button");

  allButton.className =
    "market-category active";

  allButton.textContent =
    "All";

  allButton.type = "button";

  allButton.onclick = () => {

    selectedCategory = null;

    qsa(".market-category")
      .forEach((button) => {
        button.classList.remove("active");
      });

    allButton.classList.add("active");

    loadMarketProducts();
  };

  container.appendChild(allButton);


  (data || []).forEach((category) => {

    const button =
      document.createElement("button");

    button.type = "button";

    button.className =
      "market-category";

    button.textContent =
      category.name;

    button.onclick = () => {

      selectedCategory =
        category.id;

      qsa(".market-category")
        .forEach((item) => {
          item.classList.remove("active");
        });

      button.classList.add("active");

      loadMarketProducts();
    };

    container.appendChild(button);
  });
}


/* =========================================================
   16. MARKET PRODUCTS
   ========================================================= */

async function loadMarketProducts() {

  const grid =
    $("productGrid");

  if (!grid) return;

  grid.innerHTML =
    `<div class="loading">Loading products...</div>`;


  let query =
    supabaseClient
      .from("marketplace_listings")
      .select("*")
      .eq("status", "active")
      .order("created_at", {
        ascending: false
      });


  if (selectedCategory) {

    query =
      query.eq(
        "category_id",
        selectedCategory
      );
  }


  const {
    data,
    error
  } = await query;


  if (error) {

    console.error(
      "Product loading error:",
      error
    );

    grid.innerHTML =
      `<div class="error-message">
        Unable to load products.
      </div>`;

    return;
  }


  grid.innerHTML = "";


  if (!data || data.length === 0) {

    grid.innerHTML =
      `<div class="empty-state">
        <div class="empty-icon">🛍</div>
        <h3>No products yet</h3>
        <p>
          Products from real MENA sellers will appear here.
        </p>
      </div>`;

    return;
  }


  data.forEach((product) => {

    const card =
      document.createElement("article");

    card.className =
      "product-card";

    const image =
      product.image_url ||
      product.media_url ||
      "";


    card.innerHTML = `

      ${
        image
        ? `<img
             class="product-image"
             src="${escapeHTML(image)}"
             alt="${escapeHTML(product.title)}"
           >`
        : `<div class="product-image"></div>`
      }

      <div class="product-info">

        <div class="product-title">
          ${escapeHTML(product.title)}
        </div>

        <div class="product-price">
          ${formatETB(product.price)}
        </div>

      </div>
    `;


    card.onclick = () => {

      openProductDetails(product);

    };


    grid.appendChild(card);

  });
}


/* =========================================================
   17. PRODUCT DETAILS
   ========================================================= */

function openProductDetails(product) {

  openModal(`

    <div class="product-details">

      ${
        product.image_url
        ? `<img
             class="product-details-image"
             src="${escapeHTML(product.image_url)}"
             alt="${escapeHTML(product.title)}"
           >`
        : ""
      }

      <h2>
        ${escapeHTML(product.title)}
      </h2>

      <div class="product-details-price">
        ${formatETB(product.price)}
      </div>

      <p>
        ${escapeHTML(product.description || "")}
      </p>

      <p style="margin-top:12px;color:#777;">
        Delivery: 80 ETB
      </p>

      <button
        class="buy-product-btn"
        id="buyProductButton"
        type="button"
      >
        Buy
      </button>

    </div>

  `);


  $("buyProductButton")?.addEventListener(
    "click",
    () => {

      if (!requireAuth(() => {
        openProductDetails(product);
      })) {
        return;
      }

      showNotice(
        "Buying will be connected to the secure MENA payment/order backend."
      );

    }
  );
}


/* =========================================================
   18. SELL PRICE CALCULATOR
   Seller receives exact amount.
   MENA fee = 5%.
   Buyer delivery = 80 ETB separately.
   ========================================================= */

function calculateSellerPrice() {

  const desired =
    Number(
      $("sellPrice")?.value || 0
    );

  const buyerPrice =
    desired > 0
      ? desired / 0.95
      : 0;


  if ($("sellerReceiveAmount")) {

    $("sellerReceiveAmount")
      .textContent =
      formatETB(desired);
  }


  if ($("buyerProductAmount")) {

    $("buyerProductAmount")
      .textContent =
      formatETB(buyerPrice);
  }
}


/* =========================================================
   19. SELL PRODUCT
   ========================================================= */

async function publishProduct(event) {

  event.preventDefault();

  if (!requireAuth(() => {
    $("sellProductForm")?.requestSubmit();
  })) {
    return;
  }


  const title =
    $("sellTitle")?.value.trim();

  const description =
    $("sellDescription")?.value.trim();

  const categoryId =
    $("sellCategory")?.value;

  const desiredReceive =
    Number(
      $("sellPrice")?.value || 0
    );

  const media =
    $("sellMediaInput")?.files?.[0];


  if (!title ||
      !description ||
      !categoryId ||
      desiredReceive <= 0) {

    showNotice(
      "Please complete all product information."
    );

    return;
  }


  /*
    Buyer price includes MENA's 5% fee.
  */

  const buyerPrice =
    desiredReceive / 0.95;


  /*
    Upload media if supplied.
  */

  let mediaUrl = null;


  if (media) {

    const fileExtension =
      media.name.split(".").pop();

    const fileName =
      `${crypto.randomUUID()}.${fileExtension}`;

    const path =
      `${currentUser.id}/products/${fileName}`;


    const {
      error: uploadError
    } = await supabaseClient
      .storage
      .from("media")
      .upload(
        path,
        media,
        {
          cacheControl: "3600",
          upsert: false
        }
      );


    if (uploadError) {

      console.error(uploadError);

      showNotice(
        "Product image upload failed."
      );

      return;
    }


    const {
      data
    } =
      supabaseClient
        .storage
        .from("media")
        .getPublicUrl(path);


    mediaUrl =
      data.publicUrl;
  }


  /*
    NOTE:
    For production, marketplace creation should
    eventually move to a secure Edge Function.
  */

  const {
    error
  } = await supabaseClient
    .from("marketplace_listings")
    .insert({

      seller_id: currentUser.id,

      title,

      description,

      category_id: categoryId,

      price: buyerPrice,

      platform_fee_percent: 5,

      status: "active",

      image_url: mediaUrl

    });


  if (error) {

    console.error(
      "Product publishing error:",
      error
    );

    showNotice(
      error.message
    );

    return;
  }


  $("sellProductForm")?.reset();

  calculateSellerPrice();

  showNotice(
    "Your product has been published."
  );

  showMarketTab("shop");

  loadMarketProducts();
}


/* =========================================================
   20. FREE WORK
   ========================================================= */

async function loadFreeWork() {

  const container =
    $("freeWorkList");

  const mainContainer =
    $("freeWorkMainList");

  const target =
    container || mainContainer;

  if (!target) return;


  target.innerHTML =
    `<div class="loading">
      Loading Free Work...
    </div>`;


  const {
    data,
    error
  } = await supabaseClient
    .from("free_work_posts")
    .select("*")
    .eq("status", "active")
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(
      "Free Work error:",
      error
    );

    target.innerHTML = "";

    return;
  }


  target.innerHTML = "";


  if (!data || data.length === 0) {

    target.innerHTML =
      `<div class="empty-state">
        <div class="empty-icon">💼</div>
        <h3>No Free Work posts yet</h3>
        <p>
          Real users' services will appear here.
        </p>
      </div>`;

    return;
  }


  data.forEach((item) => {

    const card =
      document.createElement("article");

    card.className =
      "work-card";

    card.innerHTML = `

      <h3>
        ${escapeHTML(item.title)}
      </h3>

      <p>
        ${escapeHTML(item.description || "")}
      </p>

      ${
        item.location
        ? `<div class="location">
             📍 ${escapeHTML(item.location)}
           </div>`
        : ""
      }

    `;

    target.appendChild(card);

  });
}


/* =========================================================
   21. CREATE FREE WORK
   ========================================================= */

async function publishFreeWork(event) {

  event.preventDefault();

  if (!requireAuth(() => {
    $("freeWorkForm")?.requestSubmit();
  })) {
    return;
  }


  const title =
    $("workTitle")?.value.trim();

  const description =
    $("workDescription")?.value.trim();

  const location =
    $("workLocation")?.value.trim();


  if (!title || !description) {

    showNotice(
      "Enter your work title and description."
    );

    return;
  }


  /*
    The 50 ETB posting fee must eventually
    be charged through a secure backend function.
  */

  const {
    error
  } = await supabaseClient
    .from("free_work_posts")
    .insert({

      user_id: currentUser.id,

      title,

      description,

      location,

      posting_fee_etb: 50,

      status: "active"

    });


  if (error) {

    console.error(error);

    showNotice(
      error.message
    );

    return;
  }


  $("freeWorkForm")?.reset();

  showNotice(
    "Free Work post created."
  );

  loadFreeWork();
}


/* =========================================================
   22. HOME FEED
   ========================================================= */

async function loadFeed() {

  const container =
    $("feedContainer");

  if (!container) return;


  container.innerHTML =
    `<div class="loading">
      Loading MENA...
    </div>`;


  const {
    data,
    error
  } = await supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", {
      ascending: false
    })
    .limit(30);


  if (error) {

    console.error(
      "Feed error:",
      error
    );

    container.innerHTML =
      `<div class="error-message">
        Unable to load posts.
      </div>`;

    return;
  }


  container.innerHTML = "";


  if (!data || data.length === 0) {

    container.innerHTML =
      `<div class="empty-state">
        <div class="empty-icon">◉</div>
        <h3>Welcome to MENA</h3>
        <p>
          There are no public posts yet.
        </p>
      </div>`;

    return;
  }


  data.forEach((post) => {

    renderPost(post, container);

  });
}


/* =========================================================
   23. RENDER POST
   ========================================================= */

function renderPost(post, container) {

  const article =
    document.createElement("article");

  article.className =
    "post-card";


  const mediaUrl =
    post.media_url ||
    post.media ||
    post.url ||
    "";


  const mediaHTML =
    mediaUrl
    ? (
        post.media_type === "video"
        ? `<video
             class="post-media"
             src="${escapeHTML(mediaUrl)}"
             controls
             playsinline
           ></video>`
        : `<img
             class="post-media"
             src="${escapeHTML(mediaUrl)}"
             alt="MENA post"
           >`
      )
    : "";


  article.innerHTML = `

    ${mediaHTML}

    <div class="post-content">

      <div class="post-user">

        <div class="post-avatar"></div>

        <strong class="post-username">
          MENA User
        </strong>

      </div>

      ${
        post.caption
        ? `<div class="post-caption">
             ${escapeHTML(post.caption)}
           </div>`
        : ""
      }

      <div class="post-actions">

        <button
          class="like-post-btn"
          type="button"
        >
          ♡ Like
        </button>

        <button
          class="comment-post-btn"
          type="button"
        >
          💬 Comment
        </button>

        <button
          class="share-post-btn"
          type="button"
        >
          ↗ Share
        </button>

      </div>

    </div>

  `;


  article
    .querySelector(".like-post-btn")
    ?.addEventListener(
      "click",
      () => likePost(post.id)
    );


  article
    .querySelector(".comment-post-btn")
    ?.addEventListener(
      "click",
      () => openComments(post.id)
    );


  article
    .querySelector(".share-post-btn")
    ?.addEventListener(
      "click",
      () => sharePost(post)
    );


  container.appendChild(article);
}


/* =========================================================
   24. LIKE
   ========================================================= */

async function likePost(postId) {

  if (!requireAuth(() => {
    likePost(postId);
  })) {
    return;
  }


  const {
    error
  } = await supabaseClient
    .from("post_likes")
    .insert({

      post_id: postId,

      user_id: currentUser.id

    });


  if (error) {

    /*
      If the user already liked it,
      the database may reject the duplicate.
    */

    console.log(
      "Like result:",
      error.message
    );

    return;
  }


  loadFeed();
}


/* =========================================================
   25. COMMENTS
   ========================================================= */

function openComments(postId) {

  if (!requireAuth(() => {
    openComments(postId);
  })) {
    return;
  }


  openModal(`

    <h2>Comments</h2>

    <div id="commentsList">
      Loading comments...
    </div>

    <form id="commentForm">

      <textarea
        id="commentText"
        placeholder="Write a comment..."
        required
      ></textarea>

      <button type="submit">
        Comment
      </button>

    </form>

  `);


  loadComments(postId);


  $("commentForm")
    ?.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        const text =
          $("commentText")
            ?.value.trim();

        if (!text) return;


        const {
          error
        } = await supabaseClient
          .from("comments")
          .insert({

            post_id: postId,

            user_id: currentUser.id,

            content: text

          });


        if (error) {

          showNotice(
            error.message
          );

          return;
        }


        $("commentText").value = "";

        loadComments(postId);

      }
    );
}


async function loadComments(postId) {

  const container =
    $("commentsList");

  if (!container) return;


  const {
    data,
    error
  } = await supabaseClient
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", {
      ascending: true
    });


  if (error) {

    container.textContent =
      "Unable to load comments.";

    return;
  }


  if (!data || data.length === 0) {

    container.innerHTML =
      `<p style="color:#888;">
        No comments yet.
      </p>`;

    return;
  }


  container.innerHTML =
    data.map(
      (comment) => `

        <div class="message-card">

          <div>
            ${escapeHTML(comment.content || "")}
          </div>

        </div>

      `
    ).join("");
}


/* =========================================================
   26. SHARE
   ========================================================= */

async function sharePost(post) {

  const url =
    window.location.href;


  if (navigator.share) {

    try {

      await navigator.share({

        title: "MENA",

        text:
          post.caption ||
          "Check this post on MENA.",

        url

      });

      return;

    } catch (error) {

      console.log(
        "Share cancelled."
      );
    }
  }


  try {

    await navigator.clipboard.writeText(url);

    showNotice(
      "Link copied."
    );

  } catch {

    showNotice(
      url
    );
  }
}


/* =========================================================
   27. CREATE POST
   ========================================================= */

function openCreatePost() {

  if (!requireAuth(() => {
    openCreatePost();
  })) {
    return;
  }


  const input =
    $("mediaInput");

  if (!input) return;

  input.value = "";

  input.click();
}


async function uploadPost(file) {

  if (!currentUser || !file) {
    return;
  }


  const extension =
    file.name.split(".").pop();

  const fileName =
    `${crypto.randomUUID()}.${extension}`;

  const path =
    `${currentUser.id}/posts/${fileName}`;


  showNotice(
    "Uploading..."
  );


  const {
    error: uploadError
  } = await supabaseClient
    .storage
    .from("media")
    .upload(
      path,
      file,
      {
        cacheControl: "3600",
        upsert: false
      }
    );


  if (uploadError) {

    console.error(
      uploadError
    );

    showNotice(
      "Upload failed."
    );

    return;
  }


  const {
    data
  } =
    supabaseClient
      .storage
      .from("media")
      .getPublicUrl(path);


  const mediaUrl =
    data.publicUrl;


  const mediaType =
    file.type.startsWith("video/")
      ? "video"
      : "image";


  /*
    Caption can be added later through
    the full post composer.
  */

  const {
    error
  } = await supabaseClient
    .from("posts")
    .insert({

      user_id: currentUser.id,

      media_url: mediaUrl,

      media_type: mediaType

    });


  if (error) {

    console.error(error);

    showNotice(
      error.message
    );

    return;
  }


  showNotice(
    "Post published."
  );

  navigate("home");
}


/* =========================================================
   28. PROFILE
   ========================================================= */

async function loadProfileData() {

  if (!currentUser) {

    /*
      Guests can see the Profile page,
      but private account information is protected.
    */

    if ($("profileUsername")) {
      $("profileUsername").textContent =
        "Guest";
    }

    if ($("profileBio")) {
      $("profileBio").textContent =
        "Login to use your profile.";
    }

    return;
  }


  await loadCurrentProfile();

  loadProfilePosts();

  loadProfileStats();
}


async function loadProfilePosts() {

  const container =
    $("profileContent");

  if (!container) return;


  const {
    data,
    error
  } = await supabaseClient
    .from("posts")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(error);

    return;
  }


  container.innerHTML = "";


  (data || []).forEach((post) => {

    const item =
      document.createElement("div");

    item.className =
      "profile-post-item";


    if (post.media_type === "video") {

      item.innerHTML = `
        <video
          src="${escapeHTML(post.media_url || "")}"
          muted
        ></video>
      `;

    } else {

      item.innerHTML = `
        <img
          src="${escapeHTML(post.media_url || "")}"
          alt="Post"
        >
      `;

    }


    container.appendChild(item);

  });
}


async function loadProfileStats() {

  if (!currentUser) return;


  const [
    postsResult,
    followersResult,
    followingResult,
    likesResult
  ] = await Promise.all([

    supabaseClient
      .from("posts")
      .select("id", {
        count: "exact",
        head: true
      })
      .eq(
        "user_id",
        currentUser.id
      ),

    supabaseClient
      .from("follows")
      .select("id", {
        count: "exact",
        head: true
      })
      .eq(
        "following_id",
        currentUser.id
      ),

    supabaseClient
      .from("follows")
      .select("id", {
        count: "exact",
        head: true
      })
      .eq(
        "follower_id",
        currentUser.id
      ),

    supabaseClient
      .from("post_likes")
      .select("id", {
        count: "exact",
        head: true
      })
      .eq(
        "user_id",
        currentUser.id
      )

  ]);


  if ($("profilePostsCount")) {

    $("profilePostsCount")
      .textContent =
      postsResult.count || 0;

  }

  if ($("profileFollowersCount")) {

    $("profileFollowersCount")
      .textContent =
      followersResult.count || 0;

  }

  if ($("profileFollowingCount")) {

    $("profileFollowingCount")
      .textContent =
      followingResult.count || 0;

  }

  if ($("profileLikesCount")) {

    $("profileLikesCount")
      .textContent =
      likesResult.count || 0;

  }
}


/* =========================================================
   29. WALLET
   ========================================================= */

async function loadWallet() {

  if (!requireAuth(() => {
    navigate("wallet");
  })) {
    return;
  }


  const {
    data,
    error
  } = await supabaseClient
    .from("wallets")
    .select("*")
    .eq("user_id", currentUser.id)
    .maybeSingle();


  if (error) {

    console.error(
      "Wallet error:",
      error
    );

    return;
  }


  if ($("walletEtbBalance")) {

    $("walletEtbBalance")
      .textContent =
      formatETB(
        data?.etb_balance || 0
      );

  }


  if ($("walletCoinBalance")) {

    $("walletCoinBalance")
      .textContent =
      formatCoins(
        data?.coin_balance || 0
      );

  }
}


/* =========================================================
   30. WITHDRAW
   ========================================================= */

async function requestWithdrawal(event) {

  event.preventDefault();


  if (!requireAuth(() => {
    $("withdrawForm")?.requestSubmit();
  })) {
    return;
  }


  const method =
    $("withdrawMethod")?.value;

  const account =
    $("withdrawAccount")?.value.trim();

  const amount =
    Number(
      $("withdrawAmount")?.value || 0
    );


  if (!method ||
      !account ||
      amount < 10) {

    setMessage(
      "withdrawMessage",
      "Minimum withdrawal is 10 ETB."
    );

    return;
  }


  /*
    IMPORTANT:
    Real withdrawals must be processed by
    a secure backend/Edge Function.

    Never put payment secrets in this file.
  */

  setMessage(
    "withdrawMessage",
    "Withdrawal request needs to be connected to the secure MENA payment backend.",
    "success"
  );
}


/* =========================================================
   31. BUY COINS
   ========================================================= */

function selectCoinPackage(button) {

  qsa(".coin-package")
    .forEach((item) => {
      item.classList.remove("selected");
    });

  button.classList.add("selected");

  selectedCoinPackage =
    Number(
      button.dataset.coins
    );

  setMessage(
    "coinPurchaseMessage",
    `${selectedCoinPackage.toLocaleString()} coins selected.`
  );
}


function startCoinPurchase(method) {

  if (!requireAuth(() => {
    startCoinPurchase(method);
  })) {
    return;
  }


  if (!selectedCoinPackage) {

    setMessage(
      "coinPurchaseMessage",
      "Select a coin package first."
    );

    return;
  }


  /*
    Real Telebirr/M-PESA payment must be
    handled by a secure backend/payment
    integration.

    Do not put payment credentials here.
  */

  setMessage(
    "coinPurchaseMessage",
    `Selected ${selectedCoinPackage.toLocaleString()} coins. ${method} payment requires the secure payment backend.`,
    "success"
  );
}


/* =========================================================
   32. INBOX
   ========================================================= */

async function loadInbox() {

  if (!requireAuth(() => {
    navigate("inbox");
  })) {
    return;
  }


  const messages =
    $("messagesContainer");

  if (messages) {

    messages.innerHTML =
      `<div class="empty-state">
        <div class="empty-icon">✉</div>
        <h3>Inbox</h3>
        <p>
          Your real messages will appear here.
        </p>
      </div>`;

  }


  loadReceivedGifts();
}


async function loadReceivedGifts() {

  const container =
    $("receivedGiftsList");

  if (!container || !currentUser) {
    return;
  }


  const {
    data,
    error
  } = await supabaseClient
    .from("gift_transactions")
    .select("*")
    .eq(
      "receiver_id",
      currentUser.id
    )
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(
      "Gift error:",
      error
    );

    container.innerHTML = "";

    return;
  }


  if (!data || data.length === 0) {

    container.innerHTML =
      `<div class="empty-state">
        <div class="empty-icon">🎁</div>
        <h3>No gifts yet</h3>
        <p>
          Gifts you receive will appear here.
        </p>
      </div>`;

    return;
  }


  container.innerHTML =
    data.map(
      (gift) => `

        <div class="gift-card">

          <div>
            🎁
          </div>

          <div>
            <strong>
              Gift received
            </strong>

            <div>
              ${formatCoins(gift.coin_amount || 0)}
            </div>
          </div>

        </div>

      `
    ).join("");
}


/* =========================================================
   33. SEARCH
   ========================================================= */

async function performSearch() {

  const input =
    $("globalSearchInput");

  const results =
    $("searchResults");

  if (!input || !results) return;


  const query =
    input.value.trim();


  if (!query) {

    results.innerHTML = "";

    return;
  }


  results.innerHTML =
    `<div class="loading">
      Searching...
    </div>`;


  /*
    Search public products.
  */

  const {
    data,
    error
  } = await supabaseClient
    .from("marketplace_listings")
    .select("*")
    .eq("status", "active")
    .ilike(
      "title",
      `%${query}%`
    )
    .limit(30);


  if (error) {

    console.error(error);

    results.innerHTML =
      `<div class="error-message">
        Search failed.
      </div>`;

    return;
  }


  results.innerHTML = "";


  if (!data || data.length === 0) {

    results.innerHTML =
      `<div class="empty-state">
        <h3>No results</h3>
        <p>
          Nothing matching your search was found.
        </p>
      </div>`;

    return;
  }


  data.forEach((product) => {

    const result =
      document.createElement("div");

    result.className =
      "search-result";

    result.innerHTML = `

      <div>
        🛍
      </div>

      <div>

        <strong>
          ${escapeHTML(product.title)}
        </strong>

        <div>
          ${formatETB(product.price)}
        </div>

      </div>

    `;


    result.onclick = () => {

      openProductDetails(product);

    };


    results.appendChild(result);

  });
}


/* =========================================================
   34. MODAL
   ========================================================= */

function openModal(content) {

  const modal =
    $("globalModal");

  const container =
    $("modalContent");

  if (!modal || !container) return;

  container.innerHTML =
    content;

  show(modal);

  modal.setAttribute(
    "aria-hidden",
    "false"
  );
}


function closeModal() {

  const modal =
    $("globalModal");

  if (!modal) return;

  hide(modal);

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  if ($("modalContent")) {
    $("modalContent").innerHTML = "";
  }
}


function showNotice(message) {

  openModal(`

    <div style="padding:20px 5px;">

      <p style="
        line-height:1.5;
        color:#333;
      ">
        ${escapeHTML(message)}
      </p>

      <button
        id="noticeClose"
        type="button"
        style="
          width:100%;
          margin-top:18px;
          min-height:46px;
          border-radius:10px;
          background:#087f5b;
          color:white;
          font-weight:700;
        "
      >
        OK
      </button>

    </div>

  `);


  $("noticeClose")
    ?.addEventListener(
      "click",
      closeModal
    );
}


/* =========================================================
   35. EVENT LISTENERS
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {


    /* -----------------------------------------
       Navigation
    ----------------------------------------- */

    qsa("[data-page]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            const page =
              button.dataset.page;

            if (!page) return;


            /*
              Profile is visible to guests,
              but account functions inside it
              require authentication.
            */

            navigate(page);

          }
        );

      });


    /* -----------------------------------------
       Back buttons
    ----------------------------------------- */

    qsa("[data-back]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            navigate(
              button.dataset.back
            );

          }
        );

      });


    /* -----------------------------------------
       Authentication
    ----------------------------------------- */

    $("loginForm")
      ?.addEventListener(
        "submit",
        loginUser
      );


    $("signupForm")
      ?.addEventListener(
        "submit",
        signupUser
      );


    $("authModalClose")
      ?.addEventListener(
        "click",
        closeAuthModal
      );


    $("showSignupBtn")
      ?.addEventListener(
        "click",
        () => {

          hide($("loginBox"));
          show($("signupBox"));

          $("signupName")?.focus();

        }
      );


    $("showLoginBtn")
      ?.addEventListener(
        "click",
        () => {

          hide($("signupBox"));
          show($("loginBox"));

          $("loginEmail")?.focus();

        }
      );


    /* -----------------------------------------
       Settings
    ----------------------------------------- */

    $("loginSettingsBtn")
      ?.addEventListener(
        "click",
        () => {

          if (currentUser) {

            showNotice(
              "You are already logged in."
            );

          } else {

            openAuthModal();

          }

        }
      );


    $("logoutBtn")
      ?.addEventListener(
        "click",
        logoutUser
      );


    /* -----------------------------------------
       Search
    ----------------------------------------- */

    $("searchBtn")
      ?.addEventListener(
        "click",
        () => {

          navigate("search");

          $("globalSearchInput")
            ?.focus();

        }
      );


    $("globalSearchInput")
      ?.addEventListener(
        "input",
        performSearch
      );


    /* -----------------------------------------
       Settings button
    ----------------------------------------- */

    $("settingsBtn")
      ?.addEventListener(
        "click",
        () => {

          navigate("settings");

        }
      );


    /* -----------------------------------------
       Create
    ----------------------------------------- */

    $("createBtn")
      ?.addEventListener(
        "click",
        () => {

          if (!requireAuth(() => {
            openCreatePost();
          })) {
            return;
          }

          navigate("create");

        }
      );


    $("createPostBtn")
      ?.addEventListener(
        "click",
        openCreatePost
      );


    $("createLiveBtn")
      ?.addEventListener(
        "click",
        () => {

          if (!requireAuth()) {
            return;
          }

          showNotice(
            "Live streaming will be connected to the MENA live backend."
          );

        }
      );


    $("mediaInput")
      ?.addEventListener(
        "change",
        async (event) => {

          const file =
            event.target.files?.[0];

          if (file) {
            await uploadPost(file);
          }

        }
      );


    /* -----------------------------------------
       Market tabs
    ----------------------------------------- */

    $("marketShopTab")
      ?.addEventListener(
        "click",
        () => {

          showMarketTab("shop");

        }
      );


    $("marketSellTab")
      ?.addEventListener(
        "click",
        () => {

          if (!requireAuth(() => {
            showMarketTab("sell");
          })) {
            return;
          }

          showMarketTab("sell");

        }
      );


    $("marketWorkTab")
      ?.addEventListener(
        "click",
        () => {

          if (!requireAuth(() => {
            showMarketTab("work");
          })) {
            return;
          }

          showMarketTab("work");

        }
      );


    /* -----------------------------------------
       Seller price
    ----------------------------------------- */

    $("sellPrice")
      ?.addEventListener(
        "input",
        calculateSellerPrice
      );


    $("sellProductForm")
      ?.addEventListener(
        "submit",
        publishProduct
      );


    /* -----------------------------------------
       Free Work
    ----------------------------------------- */

    $("freeWorkForm")
      ?.addEventListener(
        "submit",
        publishFreeWork
      );


    /* -----------------------------------------
       Profile
    ----------------------------------------- */

    $("openWalletBtn")
      ?.addEventListener(
        "click",
        () => {

          if (!requireAuth(() => {
            navigate("wallet");
          })) {
            return;
          }

          navigate("wallet");

        }
      );


    $("openWithdrawBtn")
      ?.addEventListener(
        "click",
        () => {

          if (!requireAuth(() => {
            navigate("withdraw");
          })) {
            return;
          }

          navigate("withdraw");

        }
      );


    $("openBuyCoinsBtn")
      ?.addEventListener(
        "click",
        () => {

          if (!requireAuth(() => {
            navigate("buyCoins");
          })) {
            return;
          }

          navigate("buyCoins");

        }
      );


    $("openMarketProfileBtn")
      ?.addEventListener(
        "click",
        () => {

          if (!requireAuth()) {
            return;
          }

          navigate("market");

        }
      );


    /* -----------------------------------------
       Wallet
    ----------------------------------------- */

    $("walletBuyCoinsBtn")
      ?.addEventListener(
        "click",
        () => {

          navigate("buyCoins");

        }
      );


    $("walletWithdrawBtn")
      ?.addEventListener(
        "click",
        () => {

          navigate("withdraw");

        }
      );


    /* -----------------------------------------
       Withdraw
    ----------------------------------------- */

    $("withdrawForm")
      ?.addEventListener(
        "submit",
        requestWithdrawal
      );


    /* -----------------------------------------
       Buy coins
    ----------------------------------------- */

    qsa(".coin-package")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            if (!requireAuth()) {
              return;
            }

            selectCoinPackage(button);

          }
        );

      });


    $("coinTelebirrBtn")
      ?.addEventListener(
        "click",
        () => {

          startCoinPurchase(
            "Telebirr"
          );

        }
      );


    $("coinMpesaBtn")
      ?.addEventListener(
        "click",
        () => {

          startCoinPurchase(
            "M-PESA"
          );

        }
      );


    /* -----------------------------------------
       Inbox tabs
    ----------------------------------------- */

    $("messagesTab")
      ?.addEventListener(
        "click",
        () => {

          if (!requireAuth()) {
            return;
          }

          $("messagesTab")
            ?.classList.add("active");

          $("notificationsTab")
            ?.classList.remove("active");

          $("giftInboxTab")
            ?.classList.remove("active");

          show($("messagesContainer"));
          hide($("notificationsContainer"));
          hide($("giftInboxContainer"));

        }
      );


    $("notificationsTab")
      ?.addEventListener(
        "click",
        () => {

          if (!requireAuth()) {
            return;
          }

          $("messagesTab")
            ?.classList.remove("active");

          $("notificationsTab")
            ?.classList.add("active");

          $("giftInboxTab")
            ?.classList.remove("active");

          hide($("messagesContainer"));
          show($("notificationsContainer"));
          hide($("giftInboxContainer"));

        }
      );


    $("giftInboxTab")
      ?.addEventListener(
        "click",
        () => {

          if (!requireAuth()) {
            return;
          }

          $("messagesTab")
            ?.classList.remove("active");

          $("notificationsTab")
            ?.classList.remove("active");

          $("giftInboxTab")
            ?.classList.add("active");

          hide($("messagesContainer"));
          hide($("notificationsContainer"));
          show($("giftInboxContainer"));

          loadReceivedGifts();

        }
      );


    /* -----------------------------------------
       General modal
    ----------------------------------------- */

    $("modalCloseBtn")
      ?.addEventListener(
        "click",
        closeModal
      );


    $("globalModal")
      ?.addEventListener(
        "click",
        (event) => {

          if (
            event.target ===
            $("globalModal")
          ) {

            closeModal();

          }

        }
      );


    $("authModal")
      ?.addEventListener(
        "click",
        (event) => {

          if (
            event.target ===
            $("authModal")
          ) {

            closeAuthModal();

          }

        }
      );


    /* -----------------------------------------
       Initial app
    ----------------------------------------- */

    await loadCurrentUser();

    /*
      IMPORTANT:

      The app ALWAYS starts at Home.

      Login/signup is NOT displayed automatically.
    */

    navigate("home");

  }
);
