/* =========================================================
   MENA — SCRIPT.JS
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
let currentWallet = null;

let selectedCoinAmount = 0;
let selectedPaymentMethod = null;

let selectedSellFiles = [];
let selectedPostFile = null;

let currentPage = "homePage";


/* =========================================================
   3. SHORT HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);

function show(id) {
  const el = $(id);
  if (el) el.classList.remove("hidden");
}

function hide(id) {
  const el = $(id);
  if (el) el.classList.add("hidden");
}

function text(id, value) {
  const el = $(id);
  if (el) el.textContent = value ?? "";
}

function money(value) {
  const number = Number(value || 0);

  return number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " ETB";
}

function coins(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function message(elementId, value, success = false) {
  const el = $(elementId);

  if (!el) return;

  el.textContent = value;

  el.style.color = success
    ? "#087f5b"
    : "#d93025";
}


/* =========================================================
   4. AUTH PAGE
   ========================================================= */

function showAuth() {
  hide("appShell");
  show("authPage");
  show("loginBox");
  hide("signupBox");
}

function showSignup() {
  hide("loginBox");
  show("signupBox");
}

function showLogin() {
  show("loginBox");
  hide("signupBox");
}


/* =========================================================
   5. LOGIN
   ========================================================= */

async function loginUser(event) {

  event.preventDefault();

  const email =
    $("loginEmail").value.trim();

  const password =
    $("loginPassword").value;

  if (!email || !password) {

    message(
      "loginMessage",
      "Please enter your email and password."
    );

    return;
  }

  const button = $("loginBtn");

  button.disabled = true;
  button.textContent = "Logging in...";

  message(
    "loginMessage",
    "Connecting..."
  );

  try {

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      throw error;
    }

    currentUser = data.user;

    message(
      "loginMessage",
      "Login successful.",
      true
    );

    await openApplication();

  } catch (error) {

    console.error(error);

    message(
      "loginMessage",
      error.message || "Login failed."
    );

  } finally {

    button.disabled = false;
    button.textContent = "Login";
  }
}


/* =========================================================
   6. SIGN UP
   ========================================================= */

async function signupUser(event) {

  event.preventDefault();

  const username =
    $("signupName").value.trim();

  const email =
    $("signupEmail").value.trim();

  const password =
    $("signupPassword").value;

  const password2 =
    $("signupPassword2").value;


  if (username.length < 3) {

    message(
      "signupMessage",
      "Username must contain at least 3 characters."
    );

    return;
  }


  if (password.length < 6) {

    message(
      "signupMessage",
      "Password must contain at least 6 characters."
    );

    return;
  }


  if (password !== password2) {

    message(
      "signupMessage",
      "Passwords do not match."
    );

    return;
  }


  const button = $("signupBtn");

  button.disabled = true;
  button.textContent = "Creating...";

  message(
    "signupMessage",
    "Creating your account..."
  );


  try {

    const { data, error } =
      await supabaseClient.auth.signUp({

        email,
        password,

        options: {
          data: {
            username: username
          }
        }

      });


    if (error) {
      throw error;
    }


    if (data.session) {

      currentUser = data.user;

      message(
        "signupMessage",
        "Account created.",
        true
      );

      await openApplication();

    } else {

      message(
        "signupMessage",
        "Account created. Check your email if email confirmation is enabled.",
        true
      );

      showLogin();
    }


  } catch (error) {

    console.error(error);

    message(
      "signupMessage",
      error.message || "Could not create account."
    );

  } finally {

    button.disabled = false;
    button.textContent = "Create Account";
  }
}


/* =========================================================
   7. SESSION
   ========================================================= */

async function checkSession() {

  try {

    const {
      data,
      error
    } = await supabaseClient.auth.getSession();

    if (error) {
      console.error(error);
      showAuth();
      return;
    }

    if (data.session) {

      currentUser = data.session.user;

      await openApplication();

    } else {

      showAuth();
    }

  } catch (error) {

    console.error(error);

    showAuth();
  }
}


/* =========================================================
   8. OPEN APPLICATION
   ========================================================= */

async function openApplication() {

  if (!currentUser) {
    showAuth();
    return;
  }

  hide("authPage");
  show("appShell");

  await loadProfile();
  await loadWallet();
  await loadHomeFeed();
  await loadInboxCount();

  navigate("homePage");
}


/* =========================================================
   9. PROFILE
   ========================================================= */

async function loadProfile() {

  if (!currentUser) return;


  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();


    if (error) {
      throw error;
    }


    currentProfile = data;


    if (!currentProfile) {

      const username =
        currentUser.user_metadata?.username ||
        currentUser.email?.split("@")[0] ||
        "User";


      const {
        data: created,
        error: createError
      } = await supabaseClient
        .from("profiles")
        .insert({
          id: currentUser.id,
          username: username
        })
        .select()
        .single();


      if (createError) {
        console.error(createError);
        return;
      }

      currentProfile = created;
    }


    renderProfile();

  } catch (error) {

    console.error(
      "Profile error:",
      error
    );
  }
}


function renderProfile() {

  if (!currentProfile) return;


  text(
    "profileUsername",
    currentProfile.username ||
    currentProfile.full_name ||
    "User"
  );


  text(
    "profileBio",
    currentProfile.bio ||
    "Welcome to my MENA profile."
  );


  const avatar =
    currentProfile.avatar_url ||
    currentProfile.profile_picture;


  if (avatar) {

    $("profilePicture").src = avatar;

  } else {

    $("profilePicture").src =
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg"
             width="100"
             height="100">
          <rect width="100"
                height="100"
                fill="#087f5b"/>
          <text x="50"
                y="60"
                text-anchor="middle"
                font-size="42"
                fill="white"
                font-family="Arial">
            M
          </text>
        </svg>
      `);
  }
}


/* =========================================================
   10. WALLET
   ========================================================= */

async function loadWallet() {

  if (!currentUser) return;


  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("wallets")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle();


    if (error) {
      throw error;
    }


    currentWallet = data;


    if (!currentWallet) {

      currentWallet = {
        coin_balance: 0,
        etb_balance: 0
      };
    }


    renderWallet();

  } catch (error) {

    console.error(
      "Wallet error:",
      error
    );
  }
}


function renderWallet() {

  if (!currentWallet) return;


  text(
    "walletEtbBalance",
    money(currentWallet.etb_balance)
  );


  text(
    "walletCoinBalance",
    coins(currentWallet.coin_balance)
  );
}


/* =========================================================
   11. NAVIGATION
   ========================================================= */

function navigate(pageId) {

  const pages =
    document.querySelectorAll(
      "#pageContainer > .page"
    );


  pages.forEach(page => {
    page.classList.add("hidden");
  });


  const target = $(pageId);

  if (!target) return;

  target.classList.remove("hidden");

  currentPage = pageId;


  document
    .querySelectorAll(".nav-item")
    .forEach(item => {

      item.classList.remove("active");

      if (
        item.dataset.page === pageId
      ) {
        item.classList.add("active");
      }

    });


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  if (pageId === "homePage") {
    loadHomeFeed();
  }


  if (pageId === "marketPage") {
    loadMarket();
  }


  if (pageId === "profilePage") {
    loadProfile();
    loadWallet();
    loadProfilePosts();
  }


  if (pageId === "inboxPage") {
    loadInbox();
  }
}


/* =========================================================
   12. HOME FEED
   ========================================================= */

async function loadHomeFeed() {

  const container =
    $("feedContainer");

  if (!container) return;


  container.innerHTML = `
    <div class="loading-box">
      <div class="loader"></div>
      <p>Loading posts...</p>
    </div>
  `;


  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("posts")
      .select(`
        *,
        profiles (
          id,
          username,
          avatar_url
        )
      `)
      .order("created_at", {
        ascending: false
      })
      .limit(30);


    if (error) {
      throw error;
    }


    if (!data || data.length === 0) {

      container.innerHTML = `
        <div class="empty-state">
          <strong>No posts yet</strong>
          <p>Be the first person to post on MENA.</p>
        </div>
      `;

      return;
    }


    container.innerHTML = "";


    data.forEach(post => {

      container.appendChild(
        createPostCard(post)
      );

    });


  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        <strong>Could not load posts</strong>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;
  }
}


function createPostCard(post) {

  const card =
    document.createElement("article");

  card.className = "post-card";

  const profile =
    post.profiles || {};

  const username =
    profile.username ||
    "MENA User";

  const avatar =
    profile.avatar_url || "";


  let mediaHTML = "";


  if (
    post.media_url &&
    post.media_type === "video"
  ) {

    mediaHTML = `
      <video
        class="post-media"
        src="${escapeHTML(post.media_url)}"
        controls
        playsinline>
      </video>
    `;

  } else if (post.media_url) {

    mediaHTML = `
      <img
        class="post-media"
        src="${escapeHTML(post.media_url)}"
        alt="Post">
    `;
  }


  card.innerHTML = `

    <div class="post-header">

      ${
        avatar
          ? `<img class="post-avatar"
                  src="${escapeHTML(avatar)}"
                  alt="">`
          : `<div class="post-avatar"></div>`
      }

      <div class="post-user">
        <strong>${escapeHTML(username)}</strong>
        <small>MENA</small>
      </div>

    </div>


    ${mediaHTML}


    <div class="post-actions">

      <button
        class="post-action like-post"
        data-id="${escapeHTML(post.id)}">
        ♡
      </button>

      <button
        class="post-action comment-post"
        data-id="${escapeHTML(post.id)}">
        💬
      </button>

      <button
        class="post-action share-post"
        data-id="${escapeHTML(post.id)}">
        ↗
      </button>

    </div>


    <div class="post-caption">
      ${escapeHTML(post.caption || "")}
    </div>

  `;


  const like =
    card.querySelector(".like-post");

  like.addEventListener(
    "click",
    () => likePost(post.id, like)
  );


  const comment =
    card.querySelector(".comment-post");

  comment.addEventListener(
    "click",
    () => openComments(post.id)
  );


  const share =
    card.querySelector(".share-post");

  share.addEventListener(
    "click",
    () => sharePost(post)
  );


  return card;
}


/* =========================================================
   13. LIKE
   ========================================================= */

async function likePost(
  postId,
  button
) {

  if (!currentUser) return;


  try {

    const {
      data: existing,
      error: checkError
    } = await supabaseClient
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", currentUser.id)
      .maybeSingle();


    if (checkError) {
      throw checkError;
    }


    if (existing) {

      await supabaseClient
        .from("post_likes")
        .delete()
        .eq("id", existing.id);

      button.textContent = "♡";

    } else {

      await supabaseClient
        .from("post_likes")
        .insert({
          post_id: postId,
          user_id: currentUser.id
        });

      button.textContent = "♥";
    }


  } catch (error) {

    console.error(
      "Like error:",
      error
    );
  }
}


/* =========================================================
   14. COMMENTS
   ========================================================= */

async function openComments(postId) {

  openModal(`
    <h2>Comments</h2>

    <div
      id="commentsList"
      class="comments-list">
      Loading...
    </div>

    <form
      id="commentForm"
      class="form-card">

      <textarea
        id="commentText"
        rows="3"
        placeholder="Write a comment..."
        required></textarea>

      <button
        type="submit"
        class="primary-btn">
        Comment
      </button>

    </form>
  `);


  const {
    data,
    error
  } = await supabaseClient
    .from("comments")
    .select(`
      *,
      profiles (
        username,
        avatar_url
      )
    `)
    .eq("post_id", postId)
    .order("created_at", {
      ascending: true
    });


  const list =
    $("commentsList");


  if (error) {

    list.textContent =
      error.message;

  } else if (!data || data.length === 0) {

    list.innerHTML =
      `<div class="empty-state">
         No comments yet.
       </div>`;

  } else {

    list.innerHTML =
      data.map(comment => `

        <div class="notification-item">

          <div class="message-info">

            <strong>
              ${escapeHTML(
                comment.profiles?.username ||
                "User"
              )}
            </strong>

            <p>
              ${escapeHTML(
                comment.content ||
                comment.comment ||
                ""
              )}
            </p>

          </div>

        </div>

      `).join("");
  }


  $("commentForm")
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const content =
          $("commentText").value.trim();

        if (!content) return;


        const {
          error
        } = await supabaseClient
          .from("comments")
          .insert({
            post_id: postId,
            user_id: currentUser.id,
            content: content
          });


        if (error) {

          alert(error.message);
          return;
        }


        $("commentText").value = "";

        openComments(postId);
      }
    );
}


/* =========================================================
   15. SHARE
   ========================================================= */

async function sharePost(post) {

  const url =
    window.location.origin +
    window.location.pathname +
    "?post=" +
    encodeURIComponent(post.id);


  try {

    if (
      navigator.share
    ) {

      await navigator.share({
        title: "MENA",
        text: post.caption || "MENA post",
        url: url
      });

    } else {

      await navigator.clipboard.writeText(url);

      alert("Post link copied.");

    }

  } catch (error) {

    console.log(error);
  }
}


/* =========================================================
   16. MARKET
   ========================================================= */

async function loadMarket() {

  await loadCategories();
  await loadProducts();
}


async function loadCategories() {

  const container =
    $("marketCategories");

  if (!container) return;


  container.innerHTML = `
    <div class="loading-box">
      Loading...
    </div>
  `;


  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("market_categories")
      .select("*")
      .order("name");


    if (error) {
      throw error;
    }


    if (!data || data.length === 0) {

      container.innerHTML = `
        <div class="empty-state">
          <strong>No categories yet</strong>
        </div>
      `;

      return;
    }


    container.innerHTML =
      data.map(category => `

        <button
          class="category-card"
          data-category-id="${escapeHTML(category.id)}"
          type="button">

          <span>
            ${escapeHTML(
              category.icon || "🛍️"
            )}
          </span>

          <small>
            ${escapeHTML(category.name)}
          </small>

        </button>

      `).join("");


    container
      .querySelectorAll(".category-card")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            loadProducts(
              button.dataset.categoryId
            );

          }
        );

      });


  } catch (error) {

    console.error(error);

    /*
      If the old marketplace schema is being used,
      categories can be loaded later after the
      database tables are consolidated.
    */

    container.innerHTML = `
      <div class="empty-state">
        <strong>Market categories</strong>
        <p>Connect your marketplace database to display categories.</p>
      </div>
    `;
  }
}


async function loadProducts(
  categoryId = null
) {

  const container =
    $("productGrid");

  if (!container) return;


  container.innerHTML = `
    <div class="loading-box">
      <div class="loader"></div>
      <p>Loading products...</p>
    </div>
  `;


  try {

    let query =
      supabaseClient
        .from("marketplace_listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", {
          ascending: false
        })
        .limit(40);


    if (categoryId) {

      query =
        query.eq(
          "category_id",
          categoryId
        );
    }


    const {
      data,
      error
    } = await query;


    if (error) {
      throw error;
    }


    if (!data || data.length === 0) {

      container.innerHTML = `
        <div class="empty-state">
          <strong>No products available</strong>
          <p>Real products will appear here when users list them.</p>
        </div>
      `;

      return;
    }


    container.innerHTML = "";


    data.forEach(product => {

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
                src="${escapeHTML(image)}"
                alt="${escapeHTML(product.title || "")}">`
            : `<div
                style="
                  aspect-ratio:1;
                  background:#eee;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  font-size:35px;
                ">
                🛍️
              </div>`
        }


        <div class="product-info">

          <h4>
            ${escapeHTML(
              product.title ||
              product.name ||
              "Product"
            )}
          </h4>

          <div class="product-price">
            ${money(
              product.price_etb ||
              product.price ||
              0
            )}
          </div>

          <div class="product-seller">
            Seller
          </div>

        </div>
      `;


      card.addEventListener(
        "click",
        () => showProductDetails(product)
      );


      container.appendChild(card);

    });


  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        <strong>No marketplace products loaded</strong>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;
  }
}


/* =========================================================
   17. PRODUCT DETAILS
   ========================================================= */

function showProductDetails(product) {

  hide("marketShopPage");
  show("productDetails");


  const container =
    $("productDetailsContent");


  const image =
    product.image_url ||
    product.media_url ||
    "";


  const price =
    Number(
      product.price_etb ||
      product.price ||
      0
    );


  container.innerHTML = `

    ${
      image
        ? `<img
            class="product-detail-image"
            src="${escapeHTML(image)}"
            alt="">`
        : ""
    }


    <h2>
      ${escapeHTML(
        product.title ||
        product.name ||
        "Product"
      )}
    </h2>


    <div class="product-detail-price">
      ${money(price)}
    </div>


    <p>
      ${escapeHTML(
        product.description ||
        ""
      )}
    </p>


    <div
      style="
        margin-top:15px;
        background:#e8f7f1;
        padding:13px;
        border-radius:10px;
      ">

      <strong>Delivery: 80 ETB</strong>

      <p style="margin-top:5px;font-size:13px;">
        Delivery is paid separately.
      </p>

    </div>


    <button
      id="buyProductButton"
      class="buy-product-btn"
      type="button"
      style="margin-top:15px;">

      Buy Product

    </button>
  `;


  $("buyProductButton")
    ?.addEventListener(
      "click",
      () => beginProductPurchase(product)
    );
}


function beginProductPurchase(product) {

  if (!currentUser) {
    alert("Please login first.");
    return;
  }


  const productPrice =
    Number(
      product.price_etb ||
      product.price ||
      0
    );


  const total =
    productPrice + 80;


  openModal(`

    <h2>Confirm purchase</h2>

    <div class="form-card">

      <p>
        Product:
        <strong>
          ${escapeHTML(
            product.title ||
            product.name ||
            "Product"
          )}
        </strong>
      </p>

      <p style="margin-top:10px;">
        Product price:
        <strong>
          ${money(productPrice)}
        </strong>
      </p>

      <p style="margin-top:10px;">
        Delivery:
        <strong>
          80.00 ETB
        </strong>
      </p>

      <hr style="margin:15px 0;">

      <p>
        Total:
        <strong>
          ${money(total)}
        </strong>
      </p>

      <button
        id="confirmBuyBtn"
        class="primary-btn"
        style="margin-top:15px;"
        type="button">

        Confirm Buy

      </button>

    </div>

  `);


  $("confirmBuyBtn")
    ?.addEventListener(
      "click",
      () => {

        /*
          IMPORTANT:
          Actual order/payment creation must
          happen through a secure Supabase
          Edge Function/RPC.

          Do NOT put service_role keys in
          this browser file.
        */

        alert(
          "The secure purchase backend must be connected before a real payment/order is created."
        );

      }
    );
}


/* =========================================================
   18. SELL PRICE CALCULATION
   =========================================================

   Seller wants 950 ETB.

   MENA keeps 5%.

   Buyer product price =
   950 / 0.95 = 1000 ETB

   Buyer additionally pays 80 ETB delivery.

   Seller receives exactly 950 ETB.
*/

function calculateSellerPrice() {

  const input =
    $("sellPrice");

  if (!input) return;


  const desired =
    Number(input.value || 0);


  const buyerPrice =
    desired > 0
      ? desired / 0.95
      : 0;


  text(
    "sellerReceiveAmount",
    money(desired)
  );


  text(
    "buyerProductAmount",
    money(buyerPrice)
  );
}


/* =========================================================
   19. SELL PRODUCT
   ========================================================= */

async function publishProduct(event) {

  event.preventDefault();


  if (!currentUser) {

    alert("Please login first.");
    return;
  }


  const title =
    $("sellTitle").value.trim();

  const description =
    $("sellDescription").value.trim();

  const categoryId =
    $("sellCategory").value;

  const desiredReceive =
    Number($("sellPrice").value);


  if (!title) {
    alert("Enter product name.");
    return;
  }


  if (!desiredReceive || desiredReceive <= 0) {
    alert("Enter the amount you want to receive.");
    return;
  }


  /*
    Buyer price is calculated from
    seller desired amount.

    5% MENA fee.
  */

  const buyerPrice =
    desiredReceive / 0.95;


  /*
    We do not directly create a money-sensitive
    listing if the exact production schema differs.

    The secure backend should calculate this again.
  */


  try {

    const {
      error
    } = await supabaseClient
      .from("marketplace_listings")
      .insert({

        seller_id: currentUser.id,

        title: title,

        description: description,

        category_id:
          categoryId || null,

        price:
          Number(
            buyerPrice.toFixed(2)
          ),

        platform_fee_percent: 5,

        status: "active"

      });


    if (error) {
      throw error;
    }


    alert(
      "Product listing created."
    );


    $("sellProductForm").reset();

    calculateSellerPrice();

    loadProducts();


  } catch (error) {

    console.error(error);

    alert(
      "Could not create listing: " +
      error.message
    );
  }
}


/* =========================================================
   20. FREE WORK
   ========================================================= */

async function loadFreeWork() {

  const container =
    $("freeWorkList");

  if (!container) return;


  container.innerHTML = `
    <div class="loading-box">
      Loading work...
    </div>
  `;


  try {

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
      throw error;
    }


    if (!data || data.length === 0) {

      container.innerHTML = `
        <div class="empty-state">
          <strong>No Free Work yet</strong>
          <p>Real work posts will appear here.</p>
        </div>
      `;

      return;
    }


    container.innerHTML =
      data.map(work => `

        <article class="work-card">

          <h3>
            ${escapeHTML(
              work.title || "Work"
            )}
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


  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        <strong>Free Work</strong>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;
  }
}


async function publishFreeWork(event) {

  event.preventDefault();


  if (!currentUser) {
    alert("Please login first.");
    return;
  }


  const title =
    $("workTitle").value.trim();

  const description =
    $("workDescription").value.trim();

  const location =
    $("workLocation").value.trim();


  if (!title || !description) {

    alert(
      "Enter a title and description."
    );

    return;
  }


  /*
    Posting fee is 50 ETB.

    The actual balance deduction must be
    handled securely on the backend.
  */


  try {

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
      throw error;
    }


    alert(
      "Free Work post created."
    );


    $("freeWorkForm").reset();

    hide("freeWorkFormBox");

    await loadFreeWork();


  } catch (error) {

    console.error(error);

    alert(
      "Could not create work post: " +
      error.message
    );
  }
}


/* =========================================================
   21. INBOX
   ========================================================= */

async function loadInbox() {

  await loadMessages();
  await loadNotifications();
  await loadReceivedGifts();

}


async function loadInboxCount() {

  /*
    This is intentionally based on real data.
    No fake unread number is generated.
  */

  text(
    "inboxBadge",
    ""
  );

  hide("inboxBadge");

  text(
    "bottomInboxBadge",
    ""
  );

  hide("bottomInboxBadge");
}


async function loadMessages() {

  const container =
    $("messagesContainer");

  if (!container) return;


  container.innerHTML = `
    <div class="empty-state">
      <strong>Messages</strong>
      <p>Your real conversations will appear here.</p>
    </div>
  `;


  /*
    Messaging table is not assumed here because
    your final database schema needs to define
    conversations/messages securely.
  */
}


async function loadNotifications() {

  const container =
    $("notificationsContainer");

  if (!container) return;


  container.innerHTML = `
    <div class="empty-state">
      <strong>No notifications</strong>
      <p>Real notifications will appear here.</p>
    </div>
  `;
}


/* =========================================================
   22. RECEIVED GIFTS
   ========================================================= */

async function loadReceivedGifts() {

  const container =
    $("receivedGiftsList");

  if (!container) return;


  if (!currentUser) return;


  try {

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
      })
      .limit(50);


    if (error) {
      throw error;
    }


    if (!data || data.length === 0) {

      container.innerHTML = `
        <div class="empty-state">
          <strong>No gifts received</strong>
          <p>Gifts sent to you will appear here.</p>
        </div>
      `;

      return;
    }


    container.innerHTML =
      data.map(gift => `

        <div class="received-gift">

          <div class="received-gift-icon">
            🎁
          </div>

          <div class="received-gift-info">

            <strong>
              Gift received
            </strong>

            <small>
              ${escapeHTML(
                gift.gift_name ||
                "MENA Gift"
              )}
            </small>

          </div>

          <div class="gift-coins">

            ${coins(
              gift.coin_amount ||
              gift.coins ||
              0
            )}

            🪙

          </div>

        </div>

      `).join("");


  } catch (error) {

    console.error(
      "Gift error:",
      error
    );


    container.innerHTML = `
      <div class="empty-state">
        <strong>Gifts</strong>
        <p>Received gifts will appear here.</p>
      </div>
    `;
  }
}


/* =========================================================
   23. GIFT CATALOG
   ========================================================= */

async function loadGiftCatalog() {

  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("gift_catalog")
      .select("*")
      .order("coin_price", {
        ascending: true
      });


    if (error) {
      throw error;
    }


    return data || [];


  } catch (error) {

    console.error(
      "Gift catalog error:",
      error
    );

    return [];
  }
}


/* =========================================================
   24. PROFILE POSTS
   ========================================================= */

async function loadProfilePosts() {

  const container =
    $("profileContent");

  if (!container || !currentUser) return;


  try {

    const {
      data,
      error
    } = await supabaseClient
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
      throw error;
    }


    if (!data || data.length === 0) {

      container.innerHTML = `
        <div
          class="empty-state"
          style="grid-column:1/-1;">

          <strong>No posts</strong>

          <p>
            Your posts will appear here.
          </p>

        </div>
      `;

      text("postCount", "0");

      return;
    }


    text(
      "postCount",
      data.length
    );


    container.innerHTML =
      data.map(post => {

        if (
          post.media_type ===
          "video"
        ) {

          return `
            <video
              class="profile-post"
              src="${escapeHTML(
                post.media_url || ""
              )}"
              controls>
            </video>
          `;

        }


        return `
          <img
            class="profile-post"
            src="${escapeHTML(
              post.media_url || ""
            )}"
            alt="Post">
        `;

      }).join("");


  } catch (error) {

    console.error(
      "Profile posts:",
      error
    );
  }
}


/* =========================================================
   25. CREATE POST
   ========================================================= */

async function createPost(event) {

  event.preventDefault();


  if (!currentUser) {

    alert("Please login first.");
    return;
  }


  const caption =
    $("postCaption").value.trim();


  if (!selectedPostFile) {

    alert(
      "Please select a photo or video."
    );

    return;
  }


  try {

    const file =
      selectedPostFile;


    const extension =
      file.name
        .split(".")
        .pop()
        .toLowerCase();


    const path =
      `${currentUser.id}/posts/${Date.now()}.${extension}`;


    const {
      error: uploadError
    } = await supabaseClient
      .storage
      .from("media")
      .upload(
        path,
        file,
        {
          upsert: false
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
        .getPublicUrl(path);


    const mediaURL =
      publicData.publicUrl;


    const mediaType =
      file.type.startsWith("video/")
        ? "video"
        : "image";


    const {
      error
    } = await supabaseClient
      .from("posts")
      .insert({

        user_id: currentUser.id,

        media_url: mediaURL,

        media_type: mediaType,

        caption: caption

      });


    if (error) {
      throw error;
    }


    alert("Post published.");


    $("postForm").reset();

    selectedPostFile = null;

    $("postMediaPreview").innerHTML = "";

    navigate("homePage");


  } catch (error) {

    console.error(error);

    alert(
      "Could not publish post: " +
      error.message
    );
  }
}


/* =========================================================
   26. MEDIA PREVIEW
   ========================================================= */

function previewPostFile(file) {

  const container =
    $("postMediaPreview");

  if (!container) return;


  container.innerHTML = "";


  const url =
    URL.createObjectURL(file);


  if (
    file.type.startsWith("video/")
  ) {

    container.innerHTML = `
      <video
        src="${url}"
        controls
        style="
          width:100%;
          max-height:400px;
          border-radius:10px;
        ">
      </video>
    `;

  } else {

    container.innerHTML = `
      <img
        src="${url}"
        style="
          width:100%;
          max-height:400px;
          object-fit:contain;
          border-radius:10px;
        ">
    `;
  }
}


/* =========================================================
   27. SELL MEDIA
   ========================================================= */

function previewSellFiles(files) {

  const container =
    $("sellPhotoPreview");

  if (!container) return;


  container.innerHTML = "";

  selectedSellFiles =
    Array.from(files);


  selectedSellFiles
    .forEach(file => {

      const url =
        URL.createObjectURL(file);


      if (
        file.type.startsWith("image/")
      ) {

        const img =
          document.createElement("img");

        img.src = url;

        container.appendChild(img);

      }

    });
}


/* =========================================================
   28. WALLET / WITHDRAW
   ========================================================= */

function openWallet() {

  hide("profileHeader");
  hide("profileFinance");
  hide("profileContent");
  hide("profileContentTabs");

  show("walletPage");

  loadWallet();
}


function openWithdraw() {

  hide("walletPage");
  show("withdrawPage");
}


function openBuyCoins() {

  hide("walletPage");
  hide("withdrawPage");
  show("buyCoinsPage");
}


function closeProfileSubpage() {

  hide("walletPage");
  hide("withdrawPage");
  hide("buyCoinsPage");

  show("profilePage");

  loadProfile();
  loadWallet();
}


/* =========================================================
   29. WITHDRAW REQUEST
   ========================================================= */

async function requestWithdrawal(event) {

  event.preventDefault();


  if (!currentUser) return;


  const method =
    $("withdrawMethod").value;

  const account =
    $("withdrawAccount").value.trim();

  const amount =
    Number(
      $("withdrawAmount").value
    );


  if (!method || !account) {

    message(
      "withdrawMessage",
      "Complete all fields."
    );

    return;
  }


  if (amount < 10) {

    message(
      "withdrawMessage",
      "Minimum withdrawal is 10 ETB."
    );

    return;
  }


  /*
    IMPORTANT:
    Actual wallet deduction and withdrawal
    approval must happen in a secure backend.
  */

  message(
    "withdrawMessage",
    "Withdrawal request needs the secure wallet backend before money can be moved."
  );
}


/* =========================================================
   30. COIN PURCHASE
   ========================================================= */

function selectCoinPackage(button) {

  document
    .querySelectorAll(".coin-package")
    .forEach(item => {

      item.classList.remove(
        "selected"
      );

    });


  button.classList.add(
    "selected"
  );


  selectedCoinAmount =
    Number(
      button.dataset.coins || 0
    );
}


function selectPaymentMethod(method) {

  selectedPaymentMethod =
    method;


  message(
    "coinPurchaseMessage",
    `${method.toUpperCase()} selected.`,
    true
  );


  if (
    selectedCoinAmount <= 0
  ) {

    message(
      "coinPurchaseMessage",
      "Select a coin package first."
    );

    return;
  }


  /*
    Actual payment confirmation must
    happen through a secure payment/backend
    integration.
  */

  const price =
    selectedCoinAmount * 0.50;


  message(
    "coinPurchaseMessage",
    `${coins(selectedCoinAmount)} coins selected — ${money(price)}. Secure payment backend is required to complete the purchase.`,
    true
  );
}


/* =========================================================
   31. SEARCH
   ========================================================= */

async function performSearch() {

  const query =
    $("globalSearchInput")
      ?.value
      .trim();


  if (!query) return;


  const results =
    $("searchResults");


  results.innerHTML = `
    <div class="loading-box">
      <div class="loader"></div>
      <p>Searching...</p>
    </div>
  `;


  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("profiles")
      .select(
        "id, username, avatar_url, bio"
      )
      .ilike(
        "username",
        `%${query}%`
      )
      .limit(30);


    if (error) {
      throw error;
    }


    if (!data || data.length === 0) {

      results.innerHTML = `
        <div class="empty-state">
          <strong>No users found</strong>
        </div>
      `;

      return;
    }


    results.innerHTML =
      data.map(user => `

        <div class="search-result">

          <strong>
            ${escapeHTML(
              user.username ||
              "User"
            )}
          </strong>

          <p>
            ${escapeHTML(
              user.bio || ""
            )}
          </p>

        </div>

      `).join("");


  } catch (error) {

    results.innerHTML = `
      <div class="empty-state">
        <strong>Search error</strong>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;
  }
}


/* =========================================================
   32. MODAL
   ========================================================= */

function openModal(html) {

  const modal =
    $("globalModal");

  const content =
    $("modalContent");


  content.innerHTML = html;

  modal.classList.remove(
    "hidden"
  );

  modal.setAttribute(
    "aria-hidden",
    "false"
  );
}


function closeModal() {

  const modal =
    $("globalModal");

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
   33. SETTINGS
   ========================================================= */

function openSettings() {

  navigate("settingsPage");
}


/* =========================================================
   34. LOGOUT
   ========================================================= */

async function logout() {

  try {

    const {
      error
    } = await supabaseClient
      .auth
      .signOut();


    if (error) {
      throw error;
    }


    currentUser = null;
    currentProfile = null;
    currentWallet = null;


    showAuth();

  } catch (error) {

    console.error(error);

    alert(
      "Could not log out: " +
      error.message
    );
  }
}


/* =========================================================
   35. EVENT LISTENERS
   ========================================================= */

function setupEvents() {


  /* ---------------- AUTH ---------------- */

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


  $("showSignupBtn")
    ?.addEventListener(
      "click",
      showSignup
    );


  $("showLoginBtn")
    ?.addEventListener(
      "click",
      showLogin
    );


  /* ---------------- TOP ---------------- */

  $("homeLogoBtn")
    ?.addEventListener(
      "click",
      () => navigate("homePage")
    );


  $("searchBtn")
    ?.addEventListener(
      "click",
      () => navigate("searchPage")
    );


  $("settingsBtn")
    ?.addEventListener(
      "click",
      openSettings
    );


  $("inboxBtn")
    ?.addEventListener(
      "click",
      () => navigate("inboxPage")
    );


  /* ---------------- BOTTOM ---------------- */

  $("navHome")
    ?.addEventListener(
      "click",
      () => navigate("homePage")
    );


  $("navMarket")
    ?.addEventListener(
      "click",
      () => navigate("marketPage")
    );


  $("navInbox")
    ?.addEventListener(
      "click",
      () => navigate("inboxPage")
    );


  $("navProfile")
    ?.addEventListener(
      "click",
      () => navigate("profilePage")
    );


  $("navCreate")
    ?.addEventListener(
      "click",
      () => navigate("createPage")
    );


  /* ---------------- MARKET ---------------- */

  $("marketShopTab")
    ?.addEventListener(
      "click",
      () => {

        show("marketShopPage");
        hide("marketSellPage");
        hide("marketWorkPage");
        hide("productDetails");

        document
          .querySelectorAll(".market-tab")
          .forEach(x =>
            x.classList.remove("active")
          );

        $("marketShopTab")
          .classList.add("active");

        loadProducts();
      }
    );


  $("marketSellTab")
    ?.addEventListener(
      "click",
      () => {

        hide("marketShopPage");
        show("marketSellPage");
        hide("marketWorkPage");
        hide("productDetails");

        document
          .querySelectorAll(".market-tab")
          .forEach(x =>
            x.classList.remove("active")
          );

        $("marketSellTab")
          .classList.add("active");
      }
    );


  $("marketWorkTab")
    ?.addEventListener(
      "click",
      () => {

        hide("marketShopPage");
        hide("marketSellPage");
        show("marketWorkPage");
        hide("productDetails");

        document
          .querySelectorAll(".market-tab")
          .forEach(x =>
            x.classList.remove("active")
          );

        $("marketWorkTab")
          .classList.add("active");

        loadFreeWork();
      }
    );


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


  $("sellPhotoBtn")
    ?.addEventListener(
      "click",
      () => $("sellMediaInput").click()
    );


  $("sellMediaInput")
    ?.addEventListener(
      "change",
      event =>
        previewSellFiles(
          event.target.files
        )
    );


  $("closeProductDetails")
    ?.addEventListener(
      "click",
      () => {

        show("marketShopPage");
        hide("productDetails");

      }
    );


  $("marketSearchSubmit")
    ?.addEventListener(
      "click",
      () => {

        const query =
          $("marketSearchInput")
            .value
            .trim();

        if (query) {

          /*
            Search product listings.
          */

          searchProducts(query);
        }

      }
    );


  $("viewAllProductsBtn")
    ?.addEventListener(
      "click",
      () => loadProducts()
    );


  /* ---------------- FREE WORK ---------------- */

  $("createWorkBtn")
    ?.addEventListener(
      "click",
      () => {

        const box =
          $("freeWorkFormBox");

        box.classList.toggle(
          "hidden"
        );

      }
    );


  $("freeWorkForm")
    ?.addEventListener(
      "submit",
      publishFreeWork
    );


  /* ---------------- CREATE ---------------- */

  $("closeCreateBtn")
    ?.addEventListener(
      "click",
      () => navigate("homePage")
    );


  $("createPostBtn")
    ?.addEventListener(
      "click",
      () => {

        show("postForm");

      }
    );


  $("selectMediaBtn")
    ?.addEventListener(
      "click",
      () => $("mediaInput").click()
    );


  $("mediaInput")
    ?.addEventListener(
      "change",
      event => {

        const file =
          event.target.files?.[0];

        if (!file) return;

        selectedPostFile = file;

        previewPostFile(file);
      }
    );


  $("postForm")
    ?.addEventListener(
      "submit",
      createPost
    );


  $("createStoryBtn")
    ?.addEventListener(
      "click",
      () => {

        alert(
          "Story upload will use the same MENA media storage system."
        );

      }
    );


  $("createLiveBtn")
    ?.addEventListener(
      "click",
      () => {

        alert(
          "Live requires the MENA live-stream backend and camera service."
        );

      }
    );


  /* ---------------- INBOX ---------------- */

  $("messagesTab")
    ?.addEventListener(
      "click",
      () => {

        $("messagesTab")
          .classList.add("active");

        $("notificationsTab")
          .classList.remove("active");

        $("giftInboxTab")
          .classList.remove("active");

        show("messagesContainer");
        hide("notificationsContainer");
        hide("giftInboxContainer");

        loadMessages();
      }
    );


  $("notificationsTab")
    ?.addEventListener(
      "click",
      () => {

        $("notificationsTab")
          .classList.add("active");

        $("messagesTab")
          .classList.remove("active");

        $("giftInboxTab")
          .classList.remove("active");

        hide("messagesContainer");
        show("notificationsContainer");
        hide("giftInboxContainer");

        loadNotifications();
      }
    );


  $("giftInboxTab")
    ?.addEventListener(
      "click",
      () => {

        $("giftInboxTab")
          .classList.add("active");

        $("messagesTab")
          .classList.remove("active");

        $("notificationsTab")
          .classList.remove("active");

        hide("messagesContainer");
        hide("notificationsContainer");
        show("giftInboxContainer");

        loadReceivedGifts();
      }
    );


  /* ---------------- PROFILE ---------------- */

  $("editProfileBtn")
    ?.addEventListener(
      "click",
      () => {

        openModal(`

          <h2>Edit profile</h2>

          <form
            id="editProfileForm"
            class="form-card">

            <div class="input-group">

              <label>Username</label>

              <input
                id="editUsername"
                value="${escapeHTML(
                  currentProfile?.username || ""
                )}"
                required>

            </div>


            <div class="input-group">

              <label>Bio</label>

              <textarea
                id="editBio"
                rows="4">${escapeHTML(
                  currentProfile?.bio || ""
                )}</textarea>

            </div>


            <button
              type="submit"
              class="primary-btn">

              Save

            </button>

          </form>

        `);


        $("editProfileForm")
          ?.addEventListener(
            "submit",
            saveProfile
          );
      }
    );


  $("walletBtn")
    ?.addEventListener(
      "click",
      () => {

        show("walletPage");
        hide("withdrawPage");
        hide("buyCoinsPage");

        loadWallet();

      }
    );


  $("withdrawBtn")
    ?.addEventListener(
      "click",
      () => {

        show("withdrawPage");
        hide("walletPage");
        hide("buyCoinsPage");

      }
    );


  $("buyCoinsBtn")
    ?.addEventListener(
      "click",
      () => {

        show("buyCoinsPage");
        hide("walletPage");
        hide("withdrawPage");

      }
    );


  $("walletBackBtn")
    ?.addEventListener(
      "click",
      closeProfileSubpage
    );


  $("withdrawBackBtn")
    ?.addEventListener(
      "click",
      closeProfileSubpage
    );


  $("buyCoinsBackBtn")
    ?.addEventListener(
      "click",
      closeProfileSubpage
    );


  $("walletBuyCoinsBtn")
    ?.addEventListener(
      "click",
      openBuyCoins
    );


  $("walletWithdrawBtn")
    ?.addEventListener(
      "click",
      openWithdraw
    );


  $("withdrawForm")
    ?.addEventListener(
      "submit",
      requestWithdrawal
    );


  $("walletTransactionsBtn")
    ?.addEventListener(
      "click",
      loadTransactions
    );


  $("profilePostsTab")
    ?.addEventListener(
      "click",
      loadProfilePosts
    );


  $("profileVideosTab")
    ?.addEventListener(
      "click",
      loadProfileVideos
    );


  $("profileLiveTab")
    ?.addEventListener(
      "click",
      loadProfileLives
    );


  $("changeProfilePictureBtn")
    ?.addEventListener(
      "click",
      () =>
        $("profilePictureInput").click()
    );


  $("profilePictureInput")
    ?.addEventListener(
      "change",
      uploadProfilePicture
    );


  /* ---------------- COINS ---------------- */

  document
    .querySelectorAll(".coin-package")
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          selectCoinPackage(button)
      );

    });


  $("coinTelebirrBtn")
    ?.addEventListener(
      "click",
      () =>
        selectPaymentMethod(
          "telebirr"
        )
    );


  $("coinMpesaBtn")
    ?.addEventListener(
      "click",
      () =>
        selectPaymentMethod(
          "mpesa"
        )
    );


  /* ---------------- SEARCH ---------------- */

  $("globalSearchInput")
    ?.addEventListener(
      "input",
      performSearch
    );


  $("searchBackBtn")
    ?.addEventListener(
      "click",
      () => navigate("homePage")
    );


  $("marketSearchInput")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

          $("marketSearchSubmit")
            .click();
        }

      }
    );


  /* ---------------- SETTINGS ---------------- */

  $("settingsBackBtn")
    ?.addEventListener(
      "click",
      () => navigate("profilePage")
    );


  $("profileSettingsBtn")
    ?.addEventListener(
      "click",
      openSettings
    );


  $("logoutBtn")
    ?.addEventListener(
      "click",
      logout
    );


  /* ---------------- MODAL ---------------- */

  $("modalCloseBtn")
    ?.addEventListener(
      "click",
      closeModal
    );


  $("globalModal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("globalModal")
        ) {

          closeModal();
        }

      }
    );
}


/* =========================================================
   36. MARKET SEARCH
   ========================================================= */

async function searchProducts(query) {

  const container =
    $("productGrid");


  container.innerHTML = `
    <div class="loading-box">
      Searching products...
    </div>
  `;


  try {

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
      .limit(40);


    if (error) {
      throw error;
    }


    if (!data || data.length === 0) {

      container.innerHTML = `
        <div class="empty-state">
          <strong>No products found</strong>
        </div>
      `;

      return;
    }


    container.innerHTML = "";


    data.forEach(product => {

      const card =
        document.createElement("article");

      card.className =
        "product-card";


      card.innerHTML = `

        ${
          product.image_url
            ? `<img
                src="${escapeHTML(
                  product.image_url
                )}"
                alt="">`
            : `<div
                style="
                  aspect-ratio:1;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  background:#eee;
                  font-size:35px;
                ">
                🛍️
              </div>`
        }

        <div class="product-info">

          <h4>
            ${escapeHTML(
              product.title ||
              "Product"
            )}
          </h4>

          <div class="product-price">
            ${money(
              product.price ||
              product.price_etb ||
              0
            )}
          </div>

        </div>

      `;


      card.addEventListener(
        "click",
        () => showProductDetails(product)
      );


      container.appendChild(card);

    });


  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        <strong>Search failed</strong>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;
  }
}


/* =========================================================
   37. SAVE PROFILE
   ========================================================= */

async function saveProfile(event) {

  event.preventDefault();


  const username =
    $("editUsername").value.trim();

  const bio =
    $("editBio").value.trim();


  if (!username) return;


  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("profiles")
      .update({
        username,
        bio
      })
      .eq(
        "id",
        currentUser.id
      )
      .select()
      .single();


    if (error) {
      throw error;
    }


    currentProfile = data;

    renderProfile();

    closeModal();


  } catch (error) {

    alert(
      error.message
    );
  }
}


/* =========================================================
   38. PROFILE PICTURE
   ========================================================= */

async function uploadProfilePicture(
  event
) {

  const file =
    event.target.files?.[0];


  if (!file || !currentUser) {
    return;
  }


  try {

    const extension =
      file.name
        .split(".")
        .pop()
        .toLowerCase();


    const path =
      `${currentUser.id}/profile/avatar.${extension}`;


    const {
      error: uploadError
    } = await supabaseClient
      .storage
      .from("media")
      .upload(
        path,
        file,
        {
          upsert: true
        }
      );


    if (uploadError) {
      throw uploadError;
    }


    const {
      data
    } =
      supabaseClient
        .storage
        .from("media")
        .getPublicUrl(path);


    const avatarURL =
      data.publicUrl;


    const {
      error
    } = await supabaseClient
      .from("profiles")
      .update({
        avatar_url: avatarURL
      })
      .eq(
        "id",
        currentUser.id
      );


    if (error) {
      throw error;
    }


    currentProfile.avatar_url =
      avatarURL;


    renderProfile();


  } catch (error) {

    console.error(error);

    alert(
      "Could not upload profile picture: " +
      error.message
    );
  }
}


/* =========================================================
   39. PROFILE VIDEOS
   ========================================================= */

async function loadProfileVideos() {

  const container =
    $("profileContent");


  if (!container || !currentUser) {
    return;
  }


  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("posts")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      )
      .eq(
        "media_type",
        "video"
      )
      .order("created_at", {
        ascending: false
      });


    if (error) {
      throw error;
    }


    if (!data || data.length === 0) {

      container.innerHTML = `
        <div
          class="empty-state"
          style="grid-column:1/-1;">

          <strong>No videos</strong>

        </div>
      `;

      return;
    }


    container.innerHTML =
      data.map(video => `

        <video
          class="profile-post"
          src="${escapeHTML(
            video.media_url || ""
          )}"
          controls>
        </video>

      `).join("");


  } catch (error) {

    console.error(error);
  }
}


/* =========================================================
   40. PROFILE LIVES
   ========================================================= */

async function loadProfileLives() {

  const container =
    $("profileContent");


  container.innerHTML = `
    <div
      class="empty-state"
      style="grid-column:1/-1;">

      <strong>Live streams</strong>

      <p>
        Your real live streams will appear here.
      </p>

    </div>
  `;
}


/* =========================================================
   41. TRANSACTIONS
   ========================================================= */

async function loadTransactions() {

  const container =
    $("transactionList");

  if (!container || !currentUser) {
    return;
  }


  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("coin_transactions")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      )
      .order("created_at", {
        ascending: false
      })
      .limit(50);


    if (error) {
      throw error;
    }


    if (!data || data.length === 0) {

      container.innerHTML = `
        <div class="empty-state">
          <strong>No transactions</strong>
        </div>
      `;

      return;
    }


    container.innerHTML =
      data.map(item => `

        <div class="transaction-item">

          <div>

            <strong>
              ${escapeHTML(
                item.type ||
                "Transaction"
              )}
            </strong>

            <small>
              ${escapeHTML(
                item.created_at || ""
              )}
            </small>

          </div>


          <strong>

            ${coins(
              item.amount ||
              item.coin_amount ||
              0
            )}
            🪙

          </strong>

        </div>

      `).join("");


  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        <strong>Transactions unavailable</strong>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;
  }
}


/* =========================================================
   42. AUTH STATE LISTENER
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {

    if (
      event === "SIGNED_IN" &&
      session?.user
    ) {

      currentUser =
        session.user;

    }


    if (
      event === "SIGNED_OUT"
    ) {

      currentUser = null;

      currentProfile = null;

      currentWallet = null;

      showAuth();

    }

  }
);


/* =========================================================
   43. START APPLICATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setupEvents();

    await checkSession();

  }
);
