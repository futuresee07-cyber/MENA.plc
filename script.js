/* =========================================================
   MENA - MAIN JAVASCRIPT
   Buttons + navigation + Supabase authentication
   ========================================================= */

"use strict";

/* =========================
   SUPABASE
   ========================= */

const SUPABASE_URL =
  "https://ryywkqyeoftuejczeqgg.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_E6S3EtoGbEqA_XkRpJhYpA_g8SvjMeH";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================
   GLOBAL STATE
   ========================= */

let currentUser = null;
let currentPage = "home";


/* =========================
   SHORT HELPERS
   ========================= */

const $ = (selector) =>
  document.querySelector(selector);

const app = () =>
  document.getElementById("app");

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function message(text) {
  alert(text);
}


/* =========================
   INITIALIZE
   ========================= */

async function init() {

  console.log("MENA starting...");

  /* Check current login */
  const {
    data,
    error
  } = await supabaseClient.auth.getSession();

  if (error) {
    console.error(error);
  }

  currentUser = data?.session?.user || null;

  /* Global buttons */
  setupGlobalButtons();

  /* Auth state listener */
  supabaseClient.auth.onAuthStateChange(
    async (_event, session) => {

      currentUser =
        session?.user || null;

      if (currentUser) {
        await showApp();
      } else {
        showAuth();
      }
    }
  );

  if (currentUser) {
    await showApp();
  } else {
    showAuth();
  }
}


/* =========================
   GLOBAL BUTTONS
   ========================= */

function setupGlobalButtons() {

  /* Home/Market/Work/Profile buttons */
  document.querySelectorAll(
    "[data-page]"
  ).forEach(button => {

    button.addEventListener(
      "click",
      function () {

        const page =
          this.getAttribute("data-page");

        if (page) {
          navigate(page);
        }

      }
    );

  });


  /* Create button */
  const createButton =
    document.getElementById("createBtn");

  if (createButton) {

    createButton.addEventListener(
      "click",
      function () {

        if (!currentUser) {
          message(
            "Please login first."
          );
          return;
        }

        openCreateMenu();

      }
    );

  }


  /* Search */
  const searchButton =
    document.getElementById("searchBtn");

  if (searchButton) {

    searchButton.addEventListener(
      "click",
      function () {

        if (!currentUser) {
          message(
            "Please login first."
          );
          return;
        }

        showSearch();

      }
    );

  }


  /* Settings */
  const settingsButton =
    document.getElementById("settingsBtn");

  if (settingsButton) {

    settingsButton.addEventListener(
      "click",
      function () {

        if (!currentUser) {
          message(
            "Please login first."
          );
          return;
        }

        showSettings();

      }
    );

  }

}


/* =========================
   AUTH PAGE
   ========================= */

function showAuth() {

  if (!app()) return;

  app().innerHTML = `

    <section class="auth-page">

      <div class="auth-card">

        <div class="auth-logo">
          M
        </div>

        <h1>MENA</h1>

        <p>
          Connect, Discover and Grow
        </p>


        <div class="auth-tabs">

          <button
            id="loginTab"
            type="button"
            class="active"
          >
            Login
          </button>

          <button
            id="signupTab"
            type="button"
          >
            Sign Up
          </button>

        </div>


        <form id="loginForm">

          <input
            id="loginEmail"
            type="email"
            placeholder="Email"
            autocomplete="email"
            required
          >

          <input
            id="loginPassword"
            type="password"
            placeholder="Password"
            autocomplete="current-password"
            required
          >

          <button
            type="submit"
            class="primary-button"
          >
            Login
          </button>

        </form>


        <form
          id="signupForm"
          style="display:none;"
        >

          <input
            id="signupName"
            type="text"
            placeholder="Your name"
            required
          >

          <input
            id="signupEmail"
            type="email"
            placeholder="Email"
            autocomplete="email"
            required
          >

          <input
            id="signupPassword"
            type="password"
            placeholder="Password"
            autocomplete="new-password"
            minlength="6"
            required
          >

          <button
            type="submit"
            class="primary-button"
          >
            Create Account
          </button>

        </form>


        <p
          id="authMessage"
          class="auth-message"
        ></p>

      </div>

    </section>

  `;


  const loginTab =
    document.getElementById(
      "loginTab"
    );

  const signupTab =
    document.getElementById(
      "signupTab"
    );

  const loginForm =
    document.getElementById(
      "loginForm"
    );

  const signupForm =
    document.getElementById(
      "signupForm"
    );


  loginTab.addEventListener(
    "click",
    () => {

      loginTab.classList.add(
        "active"
      );

      signupTab.classList.remove(
        "active"
      );

      loginForm.style.display =
        "block";

      signupForm.style.display =
        "none";

    }
  );


  signupTab.addEventListener(
    "click",
    () => {

      signupTab.classList.add(
        "active"
      );

      loginTab.classList.remove(
        "active"
      );

      loginForm.style.display =
        "none";

      signupForm.style.display =
        "block";

    }
  );


  loginForm.addEventListener(
    "submit",
    loginUser
  );


  signupForm.addEventListener(
    "submit",
    signupUser
  );

}


/* =========================
   LOGIN
   ========================= */

async function loginUser(event) {

  event.preventDefault();

  const email =
    document.getElementById(
      "loginEmail"
    ).value.trim();

  const password =
    document.getElementById(
      "loginPassword"
    ).value;

  const msg =
    document.getElementById(
      "authMessage"
    );

  msg.textContent =
    "Logging in...";


  const {
    data,
    error
  } =
    await supabaseClient.auth
      .signInWithPassword({
        email,
        password
      });


  if (error) {

    console.error(error);

    msg.textContent =
      error.message;

    return;
  }


  currentUser =
    data.user;

  msg.textContent =
    "Login successful.";

}


/* =========================
   SIGN UP
   ========================= */

async function signupUser(event) {

  event.preventDefault();

  const name =
    document.getElementById(
      "signupName"
    ).value.trim();

  const email =
    document.getElementById(
      "signupEmail"
    ).value.trim();

  const password =
    document.getElementById(
      "signupPassword"
    ).value;

  const msg =
    document.getElementById(
      "authMessage"
    );

  msg.textContent =
    "Creating account...";


  const {
    data,
    error
  } =
    await supabaseClient.auth
      .signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });


  if (error) {

    console.error(error);

    msg.textContent =
      error.message;

    return;
  }


  if (!data.session) {

    msg.textContent =
      "Account created. Check your email to confirm your account.";

    return;
  }


  currentUser =
    data.user;

}


/* =========================
   SHOW APP
   ========================= */

async function showApp() {

  if (!currentUser) {
    showAuth();
    return;
  }

  await ensureProfile();

  navigate("home");

}


/* =========================
   PROFILE
   ========================= */

async function ensureProfile() {

  if (!currentUser) return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("id")
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Profile check:",
      error
    );

    return;
  }


  if (!data) {

    const name =
      currentUser.user_metadata
        ?.full_name ||
      currentUser.email
        ?.split("@")[0] ||
      "MENA User";


    const {
      error: insertError
    } =
      await supabaseClient
        .from("profiles")
        .insert({
          id: currentUser.id,
          username:
            "user_" +
            currentUser.id
              .slice(0, 8),
          full_name: name
        });


    if (insertError) {
      console.error(
        "Profile creation:",
        insertError
      );
    }

  }

}


/* =========================
   NAVIGATION
   ========================= */

async function navigate(page) {

  if (!currentUser) {

    showAuth();

    return;
  }


  currentPage = page;


  /* Update selected nav */
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


  if (page === "home") {

    await showHome();

  } else if (page === "market") {

    await showMarket();

  } else if (page === "work") {

    await showFreeWork();

  } else if (page === "profile") {

    await showProfile();

  }

}


/* =========================
   HOME
   ========================= */

async function showHome() {

  app().innerHTML = `

    <section class="page">

      <div class="page-header">

        <h2>For You</h2>

        <button
          id="refreshFeed"
          type="button"
        >
          ↻
        </button>

      </div>

      <div id="feed">
        <p>Loading posts...</p>
      </div>

    </section>

  `;


  document
    .getElementById("refreshFeed")
    ?.addEventListener(
      "click",
      showHome
    );


  const {
    data,
    error
  } =
    await supabaseClient
      .from("posts")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(30);


  const feed =
    document.getElementById(
      "feed"
    );


  if (error) {

    console.error(error);

    feed.innerHTML = `
      <div class="empty">
        Could not load posts.
      </div>
    `;

    return;
  }


  if (!data || data.length === 0) {

    feed.innerHTML = `
      <div class="empty">
        <h3>No posts yet</h3>
        <p>
          Be the first person to post on MENA.
        </p>

        <button
          id="firstPostButton"
          class="primary-button"
          type="button"
        >
          Create Post
        </button>

      </div>
    `;


    document
      .getElementById(
        "firstPostButton"
      )
      ?.addEventListener(
        "click",
        openCreateMenu
      );

    return;
  }


  feed.innerHTML =
    data.map(
      post => renderPost(post)
    ).join("");


  bindPostButtons();

}


/* =========================
   POST CARD
   ========================= */

function renderPost(post) {

  const media =
    post.media_url ||
    post.media ||
    post.image_url ||
    "";


  let mediaHTML = "";

  if (media) {

    if (
      post.media_type ===
      "video"
    ) {

      mediaHTML = `
        <video
          src="${escapeHTML(media)}"
          controls
          playsinline
          class="post-media"
        ></video>
      `;

    } else {

      mediaHTML = `
        <img
          src="${escapeHTML(media)}"
          class="post-media"
          alt="MENA post"
        >
      `;

    }

  }


  return `

    <article
      class="post-card"
      data-post-id="${escapeHTML(post.id)}"
    >

      ${mediaHTML}

      <div class="post-content">

        <p>
          ${escapeHTML(
            post.caption ||
            ""
          )}
        </p>

        <div class="post-actions">

          <button
            class="like-button"
            data-id="${escapeHTML(post.id)}"
            type="button"
          >
            ♡ Like
          </button>

          <button
            class="comment-button"
            data-id="${escapeHTML(post.id)}"
            type="button"
          >
            💬 Comment
          </button>

          <button
            class="share-button"
            data-id="${escapeHTML(post.id)}"
            type="button"
          >
            ↗ Share
          </button>

        </div>

      </div>

    </article>

  `;

}


/* =========================
   POST BUTTONS
   ========================= */

function bindPostButtons() {

  document
    .querySelectorAll(
      ".like-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async function () {

          await likePost(
            this.dataset.id,
            this
          );

        }
      );

    });


  document
    .querySelectorAll(
      ".comment-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        function () {

          commentPost(
            this.dataset.id
          );

        }
      );

    });


  document
    .querySelectorAll(
      ".share-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        function () {

          sharePost(
            this.dataset.id
          );

        }
      );

    });

}


/* =========================
   LIKE
   ========================= */

async function likePost(
  postId,
  button
) {

  if (!currentUser) return;


  const {
    data: existing,
    error: checkError
  } =
    await supabaseClient
      .from("post_likes")
      .select("id")
      .eq(
        "post_id",
        postId
      )
      .eq(
        "user_id",
        currentUser.id
      )
      .maybeSingle();


  if (checkError) {

    console.error(checkError);

    message(
      checkError.message
    );

    return;
  }


  if (existing) {

    message(
      "You already liked this post."
    );

    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("post_likes")
      .insert({
        post_id: postId,
        user_id:
          currentUser.id
      });


  if (error) {

    console.error(error);

    message(
      error.message
    );

    return;
  }


  button.textContent =
    "♥ Liked";

}


/* =========================
   COMMENT
   ========================= */

async function commentPost(postId) {

  if (!currentUser) return;


  const text =
    prompt(
      "Write your comment:"
    );


  if (
    !text ||
    !text.trim()
  ) return;


  /*
    Try common column names.
    If your database uses a different
    column name, Supabase will show
    the exact error.
  */

  const {
    error
  } =
    await supabaseClient
      .from("comments")
      .insert({
        post_id: postId,
        user_id:
          currentUser.id,
        comment_text:
          text.trim()
      });


  if (error) {

    console.error(error);

    message(
      error.message
    );

    return;
  }


  message(
    "Comment added."
  );

}


/* =========================
   SHARE
   ========================= */

async function sharePost(postId) {

  const url =
    window.location.origin +
    window.location.pathname +
    "?post=" +
    encodeURIComponent(
      postId
    );


  try {

    if (
      navigator.share
    ) {

      await navigator.share({
        title: "MENA",
        text: "Check this post on MENA",
        url
      });

    } else {

      await navigator.clipboard.writeText(
        url
      );

      message(
        "Post link copied."
      );

    }

  } catch (error) {

    console.log(
      "Share cancelled."
    );

  }

}


/* =========================
   MARKET
   ========================= */

async function showMarket() {

  app().innerHTML = `

    <section class="page">

      <div class="page-header">

        <h2>Market</h2>

        <button
          id="marketRefresh"
          type="button"
        >
          ↻
        </button>

      </div>


      <div class="market-menu">

        <button
          id="marketProducts"
          type="button"
          class="menu-card"
        >
          🛍️
          <strong>Products</strong>
          <small>Buy from sellers</small>
        </button>


        <button
          id="marketSell"
          type="button"
          class="menu-card"
        >
          🏪
          <strong>Sell</strong>
          <small>Sell your products</small>
        </button>


        <button
          id="marketOrders"
          type="button"
          class="menu-card"
        >
          📦
          <strong>My Orders</strong>
          <small>View your purchases</small>
        </button>

      </div>


      <div id="marketContent">
        <p>Loading products...</p>
      </div>

    </section>

  `;


  document
    .getElementById(
      "marketRefresh"
    )
    ?.addEventListener(
      "click",
      showMarket
    );


  document
    .getElementById(
      "marketProducts"
    )
    ?.addEventListener(
      "click",
      loadProducts
    );


  document
    .getElementById(
      "marketSell"
    )
    ?.addEventListener(
      "click",
      createMarketListing
    );


  document
    .getElementById(
      "marketOrders"
    )
    ?.addEventListener(
      "click",
      showOrders
    );


  await loadProducts();

}


/* =========================
   LOAD PRODUCTS
   ========================= */

async function loadProducts() {

  const box =
    document.getElementById(
      "marketContent"
    );

  if (!box) return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "marketplace_listings"
      )
      .select("*")
      .eq(
        "status",
        "active"
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(50);


  if (error) {

    console.error(error);

    box.innerHTML = `
      <div class="empty">
        <p>Products could not be loaded.</p>
        <small>
          ${escapeHTML(
            error.message
          )}
        </small>
      </div>
    `;

    return;
  }


  if (!data?.length) {

    box.innerHTML = `
      <div class="empty">
        <h3>No products yet</h3>
        <p>
          Real products from MENA sellers
          will appear here.
        </p>
      </div>
    `;

    return;
  }


  box.innerHTML =
    data.map(
      product => `

        <div
          class="product-card"
          data-product-id="${escapeHTML(product.id)}"
        >

          <h3>
            ${escapeHTML(
              product.title ||
              product.name ||
              "Product"
            )}
          </h3>

          <p>
            ${escapeHTML(
              product.description ||
              ""
            )}
          </p>

          <strong>
            ${escapeHTML(
              product.price ||
              product.seller_price ||
              ""
            )}
            ETB
          </strong>

          <button
            class="buy-product"
            data-id="${escapeHTML(product.id)}"
            type="button"
          >
            Buy
          </button>

        </div>

      `
    ).join("");


  document
    .querySelectorAll(
      ".buy-product"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        function () {

          buyProduct(
            this.dataset.id
          );

        }
      );

    });

}


/* =========================
   BUY
   ========================= */

async function buyProduct(
  productId
) {

  message(
    "Order checkout will use the secure MENA payment system. The browser will never directly change wallet balances."
  );

}


/* =========================
   SELL
   ========================= */

async function createMarketListing() {

  const title =
    prompt(
      "Product name:"
    );

  if (
    !title ||
    !title.trim()
  ) return;


  const desiredReceive =
    Number(
      prompt(
        "How much do you want to receive after MENA's 5% fee?"
      )
    );


  if (
    !Number.isFinite(
      desiredReceive
    ) ||
    desiredReceive <= 0
  ) {

    message(
      "Enter a valid amount."
    );

    return;
  }


  const buyerPrice =
    desiredReceive / 0.95;


  message(
    "Buyer price: " +
    buyerPrice.toFixed(2) +
    " ETB\n\n" +
    "Your receive amount: " +
    desiredReceive.toFixed(2) +
    " ETB\n\n" +
    "MENA fee: " +
    (
      buyerPrice -
      desiredReceive
    ).toFixed(2) +
    " ETB"
  );


  /*
    Actual listing creation should later
    use the secure backend function.
  */

}


/* =========================
   ORDERS
   ========================= */

async function showOrders() {

  const box =
    document.getElementById(
      "marketContent"
    );

  if (!box) return;


  box.innerHTML =
    "<p>Loading orders...</p>";


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "marketplace_orders"
      )
      .select("*")
      .eq(
        "buyer_id",
        currentUser.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    box.innerHTML = `
      <p>
        ${escapeHTML(
          error.message
        )}
      </p>
    `;

    return;
  }


  if (!data?.length) {

    box.innerHTML = `
      <div class="empty">
        <h3>No orders</h3>
        <p>
          Your purchases will appear here.
        </p>
      </div>
    `;

    return;
  }


  box.innerHTML =
    data.map(
      order => `

        <div class="product-card">

          <strong>
            Order
          </strong>

          <p>
            ${escapeHTML(
              order.status ||
              "pending"
            )}
          </p>

        </div>

      `
    ).join("");

}


/* =========================
   FREE WORK
   ========================= */

async function showFreeWork() {

  app().innerHTML = `

    <section class="page">

      <div class="page-header">

        <h2>Free Work</h2>

        <button
          id="freeWorkPost"
          type="button"
        >
          ＋ Post Work
        </button>

      </div>

      <div id="workList">
        Loading...
      </div>

    </section>

  `;


  document
    .getElementById(
      "freeWorkPost"
    )
    ?.addEventListener(
      "click",
      createFreeWork
    );


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "free_work_posts"
      )
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(50);


  const list =
    document.getElementById(
      "workList"
    );


  if (error) {

    list.innerHTML = `
      <p>
        ${escapeHTML(
          error.message
        )}
      </p>
    `;

    return;
  }


  if (!data?.length) {

    list.innerHTML = `
      <div class="empty">
        <h3>No Free Work posts</h3>
        <p>
          Real work opportunities will appear here.
        </p>
      </div>
    `;

    return;
  }


  list.innerHTML =
    data.map(
      work => `

        <div class="product-card">

          <h3>
            ${escapeHTML(
              work.title ||
              work.description ||
              "Free Work"
            )}
          </h3>

          <p>
            ${escapeHTML(
              work.description ||
              ""
            )}
          </p>

        </div>

      `
    ).join("");

}


/* =========================
   CREATE FREE WORK
   ========================= */

async function createFreeWork() {

  const title =
    prompt(
      "Work title:"
    );

  if (
    !title ||
    !title.trim()
  ) return;


  const description =
    prompt(
      "Describe the work:"
    );


  if (
    !description ||
    !description.trim()
  ) return;


  message(
    "Free Work posting costs 50 ETB and is processed through the secure MENA payment system."
  );

}


/* =========================
   PROFILE
   ========================= */

async function showProfile() {

  const {
    data: profile,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();


  if (error) {
    console.error(error);
  }


  const name =
    profile?.full_name ||
    currentUser.email;


  const username =
    profile?.username ||
    "MENA User";


  app().innerHTML = `

    <section class="page profile-page">

      <div class="profile-header">

        <div class="profile-avatar">
          ${escapeHTML(
            name
              .charAt(0)
              .toUpperCase()
          )}
        </div>

        <h2>
          ${escapeHTML(name)}
        </h2>

        <p>
          @${escapeHTML(username)}
        </p>

      </div>


      <div class="profile-menu">

        <button
          id="editProfile"
          type="button"
        >
          ✏️ Edit Profile
        </button>

        <button
          id="myMarket"
          type="button"
        >
          🛍️ My Market
        </button>

        <button
          id="walletButton"
          type="button"
        >
          💰 Wallet
        </button>

        <button
          id="coinButton"
          type="button"
        >
          🪙 Buy Coins
        </button>

        <button
          id="withdrawButton"
          type="button"
        >
          💸 Withdraw
        </button>

        <button
          id="liveButton"
          type="button"
        >
          🔴 Go Live
        </button>

        <button
          id="logoutButton"
          type="button"
          class="danger"
        >
          Log Out
        </button>

      </div>

    </section>

  `;


  document
    .getElementById(
      "editProfile"
    )
    ?.addEventListener(
      "click",
      editProfile
    );


  document
    .getElementById(
      "myMarket"
    )
    ?.addEventListener(
      "click",
      showMyMarket
    );


  document
    .getElementById(
      "walletButton"
    )
    ?.addEventListener(
      "click",
      showWallet
    );


  document
    .getElementById(
      "coinButton"
    )
    ?.addEventListener(
      "click",
      buyCoins
    );


  document
    .getElementById(
      "withdrawButton"
    )
    ?.addEventListener(
      "click",
      withdraw
    );


  document
    .getElementById(
      "liveButton"
    )
    ?.addEventListener(
      "click",
      startLive
    );


  document
    .getElementById(
      "logoutButton"
    )
    ?.addEventListener(
      "click",
      logout
    );

}


/* =========================
   EDIT PROFILE
   ========================= */

async function editProfile() {

  const name =
    prompt(
      "Enter your name:"
    );

  if (
    !name ||
    !name.trim()
  ) return;


  const {
    error
  } =
    await supabaseClient
      .from("profiles")
      .update({
        full_name:
          name.trim()
      })
      .eq(
        "id",
        currentUser.id
      );


  if (error) {

    message(
      error.message
    );

    return;
  }


  await showProfile();

}


/* =========================
   MY MARKET
   ========================= */

function showMyMarket() {

  app().innerHTML = `

    <section class="page">

      <div class="page-header">

        <button
          id="backProfile"
          type="button"
        >
          ←
        </button>

        <h2>My Market</h2>

      </div>


      <div class="profile-menu">

        <button
          id="mySelling"
          type="button"
        >
          🏪 Selling
        </button>

        <button
          id="mySold"
          type="button"
        >
          📦 Sold
        </button>

        <button
          id="myBought"
          type="button"
        >
          🛒 Bought
        </button>

        <button
          id="myWork"
          type="button"
        >
          💼 My Free Work
        </button>

      </div>

    </section>

  `;


  document
    .getElementById(
      "backProfile"
    )
    ?.addEventListener(
      "click",
      showProfile
    );


  document
    .getElementById(
      "mySelling"
    )
    ?.addEventListener(
      "click",
      loadMySelling
    );


  document
    .getElementById(
      "mySold"
    )
    ?.addEventListener(
      "click",
      loadMySold
    );


  document
    .getElementById(
      "myBought"
    )
    ?.addEventListener(
      "click",
      showOrders
    );


  document
    .getElementById(
      "myWork"
    )
    ?.addEventListener(
      "click",
      showFreeWork
    );

}


/* =========================
   MY SELLING
   ========================= */

async function loadMySelling() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "marketplace_listings"
      )
      .select("*")
      .eq(
        "seller_id",
        currentUser.id
      );


  if (error) {

    message(
      error.message
    );

    return;
  }


  if (!data?.length) {

    message(
      "You have no active listings."
    );

    return;
  }


  app().innerHTML = `

    <section class="page">

      <div class="page-header">

        <button
          id="backMyMarket"
          type="button"
        >
          ←
        </button>

        <h2>My Selling</h2>

      </div>

      <div id="mySellingList"></div>

    </section>

  `;


  document
    .getElementById(
      "backMyMarket"
    )
    ?.addEventListener(
      "click",
      showMyMarket
    );


  document
    .getElementById(
      "mySellingList"
    )
    .innerHTML =
      data.map(
        item => `

          <div class="product-card">

            <h3>
              ${escapeHTML(
                item.title ||
                item.name ||
                "Product"
              )}
            </h3>

            <p>
              ${escapeHTML(
                item.status ||
                "active"
              )}
            </p>

          </div>

        `
      ).join("");

}


/* =========================
   MY SOLD
   ========================= */

async function loadMySold() {

  message(
    "Sold orders will appear here when real marketplace orders are created."
  );

}


/* =========================
   WALLET
   ========================= */

async function showWallet() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("wallets")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      )
      .maybeSingle();


  if (error) {

    message(
      error.message
    );

    return;
  }


  const coins =
    data?.coin_balance ??
    0;

  const etb =
    data?.etb_balance ??
    0;


  app().innerHTML = `

    <section class="page">

      <div class="page-header">

        <button
          id="walletBack"
          type="button"
        >
          ←
        </button>

        <h2>Wallet</h2>

      </div>


      <div class="wallet-card">

        <h3>Coin Balance</h3>

        <strong>
          ${escapeHTML(coins)}
        </strong>

        <p>Coins</p>

      </div>


      <div class="wallet-card">

        <h3>ETB Balance</h3>

        <strong>
          ${escapeHTML(etb)}
        </strong>

        <p>ETB</p>

      </div>


      <button
        id="walletCoins"
        class="primary-button"
        type="button"
      >
        Buy Coins
      </button>


      <button
        id="walletWithdraw"
        class="primary-button"
        type="button"
      >
        Withdraw
      </button>

    </section>

  `;


  document
    .getElementById(
      "walletBack"
    )
    ?.addEventListener(
      "click",
      showProfile
    );


  document
    .getElementById(
      "walletCoins"
    )
    ?.addEventListener(
      "click",
      buyCoins
    );


  document
    .getElementById(
      "walletWithdraw"
    )
    ?.addEventListener(
      "click",
      withdraw
    );

}


/* =========================
   BUY COINS
   ========================= */

function buyCoins() {

  message(
    "Coin purchases will use Telebirr or M-PESA through the secure MENA payment system."
  );

}


/* =========================
   WITHDRAW
   ========================= */

function withdraw() {

  message(
    "Minimum withdrawal is 10 ETB. Secure withdrawal processing will be connected to the MENA backend."
  );

}


/* =========================
   LIVE
   ========================= */

async function startLive() {

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {

    message(
      "Camera and microphone are not available on this device/browser."
    );

    return;
  }


  try {

    const stream =
      await navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true
        });


    stream
      .getTracks()
      .forEach(
        track =>
          track.stop()
      );


    message(
      "Camera and microphone permission works. The real multi-user MENA Live server still needs to be connected."
    );


  } catch (error) {

    console.error(error);

    message(
      "Camera/microphone permission was denied or unavailable."
    );

  }

}


/* =========================
   CREATE MENU
   ========================= */

function openCreateMenu() {

  app().innerHTML = `

    <section class="page">

      <div class="page-header">

        <button
          id="createBack"
          type="button"
        >
          ←
        </button>

        <h2>Create</h2>

      </div>


      <div class="profile-menu">

        <button
          id="createPost"
          type="button"
        >
          🎥 Create Post
        </button>

        <button
          id="createWork"
          type="button"
        >
          💼 Free Work
        </button>

        <button
          id="createProduct"
          type="button"
        >
          🛍️ Sell Product
        </button>

        <button
          id="createLive"
          type="button"
        >
          🔴 Go Live
        </button>

      </div>

    </section>

  `;


  document
    .getElementById(
      "createBack"
    )
    ?.addEventListener(
      "click",
      () => navigate(currentPage)
    );


  document
    .getElementById(
      "createPost"
    )
    ?.addEventListener(
      "click",
      createPost
    );


  document
    .getElementById(
      "createWork"
    )
    ?.addEventListener(
      "click",
      createFreeWork
    );


  document
    .getElementById(
      "createProduct"
    )
    ?.addEventListener(
      "click",
      createMarketListing
    );


  document
    .getElementById(
      "createLive"
    )
    ?.addEventListener(
      "click",
      startLive
    );

}


/* =========================
   CREATE POST
   ========================= */

function createPost() {

  const input =
    document.getElementById(
      "mediaInput"
    );


  if (!input) {

    message(
      "Media upload input not found."
    );

    return;
  }


  input.value = "";


  input.onchange =
    uploadPost;


  input.click();

}


/* =========================
   UPLOAD POST
   ========================= */

async function uploadPost(event) {

  const file =
    event.target.files?.[0];


  if (!file) return;


  if (!currentUser) {

    message(
      "Please login first."
    );

    return;
  }


  try {

    message(
      "Uploading..."
    );


    const extension =
      file.name
        .split(".")
        .pop()
        .toLowerCase();


    const filePath =
      currentUser.id +
      "/" +
      crypto.randomUUID() +
      "." +
      extension;


    const {
      error: uploadError
    } =
      await supabaseClient
        .storage
        .from("media")
        .upload(
          filePath,
          file,
          {
            upsert: false,
            contentType:
              file.type
          }
        );


    if (uploadError) {

      throw uploadError;

    }


    const {
      data: publicData
    } =
      supabaseClient
        .storage
        .from("media")
        .getPublicUrl(
          filePath
        );


    const mediaURL =
      publicData.publicUrl;


    const mediaType =
      file.type.startsWith(
        "video/"
      )
        ? "video"
        : "image";


    const caption =
      prompt(
        "Write a caption:"
      ) || "";


    const {
      error: postError
    } =
      await supabaseClient
        .from("posts")
        .insert({
          user_id:
            currentUser.id,
          media_url:
            mediaURL,
          media_type:
            mediaType,
          caption:
            caption
        });


    if (postError) {

      throw postError;

    }


    message(
      "Post created successfully."
    );


    navigate("home");


  } catch (error) {

    console.error(error);

    message(
      "Upload failed:\n\n" +
      error.message
    );

  }

}


/* =========================
   SEARCH
   ========================= */

function showSearch() {

  app().innerHTML = `

    <section class="page">

      <div class="page-header">

        <button
          id="searchBack"
          type="button"
        >
          ←
        </button>

        <h2>Search</h2>

      </div>


      <div class="search-box">

        <input
          id="searchInput"
          type="search"
          placeholder="Search MENA..."
        >

        <button
          id="searchSubmit"
          type="button"
        >
          Search
        </button>

      </div>


      <div id="searchResults"></div>

    </section>

  `;


  document
    .getElementById(
      "searchBack"
    )
    ?.addEventListener(
      "click",
      () => navigate(currentPage)
    );


  document
    .getElementById(
      "searchSubmit"
    )
    ?.addEventListener(
      "click",
      runSearch
    );


  document
    .getElementById(
      "searchInput"
    )
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
        ) {

          runSearch();

        }

      }
    );

}


/* =========================
   RUN SEARCH
   ========================= */

async function runSearch() {

  const input =
    document.getElementById(
      "searchInput"
    );

  const results =
    document.getElementById(
      "searchResults"
    );


  const term =
    input.value.trim();


  if (!term) {

    results.innerHTML =
      "<p>Enter something to search.</p>";

    return;
  }


  results.innerHTML =
    "<p>Searching...</p>";


  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id,username,full_name"
      )
      .or(
        "username.ilike.%" +
        term +
        "%,full_name.ilike.%" +
        term +
        "%"
      )
      .limit(30);


  if (error) {

    results.innerHTML =
      `<p>${escapeHTML(
        error.message
      )}</p>`;

    return;
  }


  if (!data?.length) {

    results.innerHTML =
      "<p>No users found.</p>";

    return;
  }


  results.innerHTML =
    data.map(
      user => `

        <div class="product-card">

          <h3>
            ${escapeHTML(
              user.full_name ||
              user.username
            )}
          </h3>

          <p>
            @${escapeHTML(
              user.username ||
              ""
            )}
          </p>

          <button
            class="follow-search-user"
            data-id="${escapeHTML(user.id)}"
            type="button"
          >
            Follow
          </button>

        </div>

      `
    ).join("");


  document
    .querySelectorAll(
      ".follow-search-user"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async function () {

          await followUser(
            this.dataset.id,
            this
          );

        }
      );

    });

}


/* =========================
   FOLLOW
   ========================= */

async function followUser(
  userId,
  button
) {

  if (
    userId ===
    currentUser.id
  ) {

    message(
      "You cannot follow yourself."
    );

    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("follows")
      .insert({
        follower_id:
          currentUser.id,
        following_id:
          userId
      });


  if (error) {

    if (
      error.code ===
      "23505"
    ) {

      message(
        "You already follow this user."
      );

    } else {

      message(
        error.message
      );

    }

    return;
  }


  button.textContent =
    "Following";

}


/* =========================
   SETTINGS
   ========================= */

function showSettings() {

  app().innerHTML = `

    <section class="page">

      <div class="page-header">

        <button
          id="settingsBack"
          type="button"
        >
          ←
        </button>

        <h2>Settings</h2>

      </div>


      <div class="profile-menu">

        <button
          id="settingsProfile"
          type="button"
        >
          👤 Profile
        </button>

        <button
          id="settingsLogout"
          type="button"
          class="danger"
        >
          Log Out
        </button>

      </div>

    </section>

  `;


  document
    .getElementById(
      "settingsBack"
    )
    ?.addEventListener(
      "click",
      () => navigate(currentPage)
    );


  document
    .getElementById(
      "settingsProfile"
    )
    ?.addEventListener(
      "click",
      showProfile
    );


  document
    .getElementById(
      "settingsLogout"
    )
    ?.addEventListener(
      "click",
      logout
    );

}


/* =========================
   LOGOUT
   ========================= */

async function logout() {

  const confirmed =
    confirm(
      "Log out of MENA?"
    );


  if (!confirmed) return;


  const {
    error
  } =
    await supabaseClient
      .auth
      .signOut();


  if (error) {

    message(
      error.message
    );

    return;
  }


  currentUser = null;

  showAuth();

}


/* =========================
   START
   ========================= */

document.addEventListener(
  "DOMContentLoaded",
  init
);
