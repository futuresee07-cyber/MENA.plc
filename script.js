/* =========================================================
   MENA — SUPABASE CONNECTED JAVASCRIPT
   ========================================================= */

const SUPABASE_URL =
  "https://ryywkqyeoftuejczeqgg.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_E6S3EtoGbEqA_XkRpJhYpA_g8SvjMeH";

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const app = document.getElementById("app");
const modal = document.getElementById("modal");
const mediaInput = document.getElementById("mediaInput");

let currentUser = null;
let page = "home";
let posts = [];
let gifts = [];


/* =========================================================
   HELPERS
   ========================================================= */

function val(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c];
    }
  );
}

function etb(value) {
  return `${Number(value || 0).toFixed(2)} ETB`;
}

function toast(message) {
  alert(message);
}

function openModal(content) {
  modal.innerHTML = `
    <section class="sheet">
      <button class="close" onclick="closeModal()">×</button>
      ${content}
    </section>
  `;

  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
  modal.innerHTML = "";
}

window.closeModal = closeModal;


/* =========================================================
   NAVIGATION
   ========================================================= */

function bindNav() {
  document.querySelectorAll("[data-page]").forEach(button => {
    button.onclick = function () {
      page = button.dataset.page;
      render();
      window.scrollTo(0, 0);
    };
  });
}


/* =========================================================
   START APP
   ========================================================= */

async function init() {
  try {
    const result = await sb.auth.getSession();

    currentUser = result.data?.session?.user || null;

    sb.auth.onAuthStateChange(function (_event, session) {
      currentUser = session?.user || null;

      if (!currentUser) {
        showAuth();
      }
    });

    bindNav();

    if (!currentUser) {
      showAuth();
      return;
    }

    await ensureProfile();
    await loadCatalogs();
    await render();

  } catch (error) {
    console.error(error);

    app.innerHTML = `
      <div class="card error">
        <h3>MENA connection error</h3>
        <p>${esc(error.message)}</p>
      </div>
    `;
  }
}


/* =========================================================
   LOGIN / SIGNUP
   ========================================================= */

function showAuth() {
  app.innerHTML = `
    <div class="card auth-card">

      <div class="brand">
        <span class="logo">M</span>
        <strong>MENA</strong>
      </div>

      <p class="muted">
        Connect, discover and grow.
      </p>

      <input
        id="fullName"
        class="input"
        placeholder="Full name"
      >

      <input
        id="username"
        class="input"
        placeholder="Username"
      >

      <input
        id="email"
        class="input"
        type="email"
        autocomplete="email"
        placeholder="Email"
      >

      <input
        id="password"
        class="input"
        type="password"
        autocomplete="current-password"
        placeholder="Password"
      >

      <div class="actions">

        <button
          id="signupButton"
          class="action primary"
          type="button"
          onclick="signUp()"
        >
          Create account
        </button>

        <button
          id="loginButton"
          class="action"
          type="button"
          onclick="signIn()"
        >
          Log in
        </button>

      </div>

      <p id="authMsg" class="muted"></p>

    </div>
  `;
}


async function signUp() {

  const email = val("email");
  const password = val("password");
  const username = val("username");
  const fullName = val("fullName");

  if (!username || !email || !password) {
    toast("Enter username, email and password.");
    return;
  }

  if (password.length < 6) {
    toast("Password must contain at least 6 characters.");
    return;
  }

  const button = document.getElementById("signupButton");

  if (button) {
    button.disabled = true;
    button.textContent = "Creating...";
  }

  try {

    const { data, error } = await sb.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username,
          full_name: fullName
        }
      }
    });

    if (error) {
      document.getElementById("authMsg").textContent =
        error.message;

      return;
    }

    if (data?.session) {

      currentUser = data.user;

      await ensureProfile();
      await loadCatalogs();

      page = "home";

      await render();

    } else {

      document.getElementById("authMsg").textContent =
        "Account created. Check your email if confirmation is required.";
    }

  } catch (error) {

    document.getElementById("authMsg").textContent =
      error.message;

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent = "Create account";
    }

  }
}


async function signIn() {

  const email = val("email");
  const password = val("password");

  if (!email || !password) {
    toast("Enter your email and password.");
    return;
  }

  const button = document.getElementById("loginButton");

  if (button) {
    button.disabled = true;
    button.textContent = "Logging in...";
  }

  try {

    const { data, error } =
      await sb.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (error) {
      toast(error.message);
      return;
    }

    currentUser = data.user;

    await ensureProfile();
    await loadCatalogs();

    page = "home";

    await render();

  } catch (error) {

    toast(error.message);

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent = "Log in";
    }

  }
}


async function logout() {

  await sb.auth.signOut();

  currentUser = null;

  showAuth();
}

window.signUp = signUp;
window.signIn = signIn;
window.logout = logout;


/* =========================================================
   PROFILE
   ========================================================= */

async function ensureProfile() {

  if (!currentUser) return;

  const { data: profile } =
    await sb
      .from("profiles")
      .select("id")
      .eq("id", currentUser.id)
      .maybeSingle();

  if (profile) return;

  const metadata = currentUser.user_metadata || {};

  let username =
    metadata.username ||
    `user_${currentUser.id.slice(0, 8)}`;

  username = username
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);

  if (!username) {
    username =
      `user_${currentUser.id.slice(0, 8)}`;
  }

  await sb.from("profiles").insert({
    id: currentUser.id,
    username: username,
    full_name: metadata.full_name || ""
  });
}


/* =========================================================
   GIFTS
   ========================================================= */

async function loadCatalogs() {

  const { data, error } =
    await sb
      .from("gift_catalog")
      .select("*")
      .eq("active", true)
      .order("coin_cost");

  if (error) {
    console.error("Gift catalog:", error);
    gifts = [];
    return;
  }

  gifts = data || [];
}


/* =========================================================
   RENDER
   ========================================================= */

async function render() {

  if (!currentUser) {
    showAuth();
    return;
  }

  bindNav();

  if (page === "home") {
    await home();
    return;
  }

  if (page === "market") {
    await market();
    return;
  }

  if (page === "work") {
    await work();
    return;
  }

  if (page === "profile") {
    await profile(currentUser.id);
    return;
  }

  await home();
}

window.render = render;


/* =========================================================
   HOME
   ========================================================= */

async function loadPosts() {

  const { data, error } =
    await sb
      .from("posts")
      .select(`
        *,
        profiles(
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .order("created_at", {
        ascending: false
      })
      .limit(60);

  if (error) {
    console.error(error);
    posts = [];
    return;
  }

  posts = data || [];
}


async function home() {

  await loadPosts();

  app.innerHTML = `
    <div class="hero">
      <div class="title">For You</div>
      <div class="subtitle">
        Real MENA posts
      </div>
    </div>

    <div class="card">

      <div class="row between">

        <div>
          <b>Go Live</b>

          <div class="muted">
            Camera + microphone
          </div>
        </div>

        <button
          class="action primary"
          onclick="startLive()"
        >
          🔴 Live
        </button>

      </div>

    </div>

    ${
      posts.length
        ? `<div class="feed">
            ${posts.map(postCard).join("")}
           </div>`
        : `
          <div class="card empty">
            No posts yet.
            Create the first MENA post.
          </div>
        `
    }
  `;
}


function postCard(post) {

  const owner = post.profiles || {};

  let media = "";

  if (post.media_type === "video") {

    media = `
      <video
        class="media"
        src="${esc(post.media_url)}"
        controls
        playsinline
      ></video>
    `;

  } else {

    media = `
      <img
        class="media"
        src="${esc(post.media_url)}"
        alt="MENA post"
      >
    `;
  }

  return `
    <article
      class="card video-card"
      id="post-${esc(post.id)}"
    >

      <div class="post-head">

        <div class="row">

          <button
            class="link"
            onclick="profile('${esc(post.user_id)}')"
          >
            ${
              owner.avatar_url
                ? `<img
                     class="avatar"
                     src="${esc(owner.avatar_url)}"
                     alt=""
                   >`
                : `<span class="avatar"></span>`
            }
          </button>

          <div>

            <button
              class="link"
              onclick="profile('${esc(post.user_id)}')"
            >
              ${esc(
                owner.full_name ||
                owner.username ||
                "MENA user"
              )}
            </button>

            <div class="muted">
              @${esc(owner.username || "user")}
            </div>

          </div>

        </div>

      </div>

      ${media}

      <div class="post-body">

        <p>
          ${esc(post.caption || "")}
        </p>

        <div class="actions">

          <button
            class="action"
            onclick="likePost('${esc(post.id)}')"
          >
            ❤️ ${post.likes_count || 0}
          </button>

          <button
            class="action"
            onclick="commentPost('${esc(post.id)}')"
          >
            💬 ${post.comments_count || 0}
          </button>

          <button
            class="action"
            onclick="giftPost('${esc(post.id)}','${esc(post.user_id)}')"
          >
            🎁 Gift
          </button>

          <button
            class="action"
            onclick="followUser('${esc(post.user_id)}')"
          >
            ＋ Follow
          </button>

          <button
            class="action"
            onclick="sharePost('${esc(post.id)}')"
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

async function likePost(postId) {

  if (!currentUser) return;

  const { error } =
    await sb
      .from("post_likes")
      .upsert(
        {
          post_id: postId,
          user_id: currentUser.id
        },
        {
          onConflict:
            "post_id,user_id"
        }
      );

  if (error) {
    toast(error.message);
    return;
  }

  await loadPosts();
  await render();
}

window.likePost = likePost;


/* =========================================================
   FOLLOW
   ========================================================= */

async function followUser(userId) {

  if (!currentUser) return;

  if (userId === currentUser.id) {
    toast("You cannot follow yourself.");
    return;
  }

  const { error } =
    await sb
      .from("follows")
      .upsert(
        {
          follower_id: currentUser.id,
          following_id: userId
        },
        {
          onConflict:
            "follower_id,following_id"
        }
      );

  if (error) {
    toast(error.message);
    return;
  }

  toast("Followed.");
}

window.followUser = followUser;


/* =========================================================
   COMMENTS
   ========================================================= */

async function commentPost(postId) {

  const { data, error } =
    await sb
      .from("comments")
      .select(`
        *,
        profiles(
          username,
          avatar_url
        )
      `)
      .eq("post_id", postId)
      .order("created_at", {
        ascending: true
      });

  if (error) {
    toast(error.message);
    return;
  }

  const comments = data || [];

  openModal(`
    <h2>Comments</h2>

    ${
      comments.length
        ? comments.map(comment => `
            <div class="comment">

              <b>
                @${esc(
                  comment.profiles?.username ||
                  "user"
                )}
              </b>

              ${esc(
                comment.comment_text || ""
              )}

            </div>
          `).join("")
        : `
          <p class="muted">
            No comments yet.
          </p>
        `
    }

    <textarea
      id="commentText"
      class="textarea"
      placeholder="Write a comment..."
    ></textarea>

    <button
      class="action primary block"
      onclick="sendComment('${esc(postId)}')"
    >
      💬 Comment
    </button>
  `);
}


async function sendComment(postId) {

  const text = val("commentText");

  if (!text) return;

  const { error } =
    await sb
      .from("comments")
      .insert({
        post_id: postId,
        user_id: currentUser.id,
        comment_text: text
      });

  if (error) {
    toast(error.message);
    return;
  }

  closeModal();

  await render();
}

window.commentPost = commentPost;
window.sendComment = sendComment;


/* =========================================================
   SHARE
   ========================================================= */

async function sharePost(postId) {

  const url =
    `${location.origin}${location.pathname}#post-${postId}`;

  try {

    await navigator.clipboard.writeText(url);

    toast("Post link copied.");

  } catch {

    toast(url);
  }
}

window.sharePost = sharePost;


/* =========================================================
   GIFTS
   ========================================================= */

function giftPost(postId, receiverId) {

  if (!gifts.length) {
    toast("Gift catalog is empty.");
    return;
  }

  openModal(`
    <h2>Send a gift</h2>

    <p class="muted">
      1 coin = 0.50 ETB
    </p>

    <div class="gift-grid">

      ${gifts.map(gift => `
        <button
          class="gift"
          onclick="
            chooseGift(
              '${esc(postId)}',
              '${esc(receiverId)}',
              '${esc(gift.id)}',
              ${Number(gift.coin_cost)}
            )
          "
        >

          <span class="emoji">
            ${esc(gift.icon || "🎁")}
          </span>

          <b>
            ${esc(gift.name)}
          </b>

          <small>
            ${Number(gift.coin_cost)} coins
          </small>

        </button>
      `).join("")}

    </div>
  `);
}


function chooseGift(
  postId,
  receiverId,
  giftId,
  cost
) {

  closeModal();

  toast(
    `${cost} coins selected. Real coin charging will use the secure backend.`
  );
}

window.giftPost = giftPost;
window.chooseGift = chooseGift;


/* =========================================================
   CREATE POST
   ========================================================= */

function openCreate() {

  openModal(`
    <h2>Create post</h2>

    <p class="muted">
      Choose a photo or video.
    </p>

    <button
      class="action primary block"
      onclick="pickMedia()"
    >
      📷 Choose photo/video
    </button>
  `);
}


function pickMedia() {

  closeModal();

  mediaInput.click();
}


mediaInput.addEventListener(
  "change",
  async function (event) {

    const file =
      event.target.files?.[0];

    if (!file) return;

    const caption =
      prompt("Caption") || "";

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() || "bin";

    const path =
      `${currentUser.id}/${crypto.randomUUID()}.${extension}`;

    const upload =
      await sb.storage
        .from("media")
        .upload(
          path,
          file,
          {
            upsert: false,
            contentType: file.type
          }
        );

    if (upload.error) {

      mediaInput.value = "";

      toast(
        "Upload failed: " +
        upload.error.message
      );

      return;
    }

    const publicUrl =
      sb.storage
        .from("media")
        .getPublicUrl(path)
        .data
        .publicUrl;

    const mediaType =
      file.type.startsWith("video/")
        ? "video"
        : "image";

    const { error } =
      await sb
        .from("posts")
        .insert({
          user_id: currentUser.id,
          media_url: publicUrl,
          media_type: mediaType,
          caption: caption
        });

    if (error) {

      toast(error.message);
      return;
    }

    mediaInput.value = "";

    toast("Post uploaded successfully.");

    page = "home";

    await render();
  }
);

window.pickMedia = pickMedia;
window.openCreate = openCreate;


/* =========================================================
   LIVE
   ========================================================= */

function startLive() {

  openModal(`
    <h2>Start MENA Live</h2>

    <input
      id="liveName"
      class="input"
      placeholder="Stream name"
    >

    <button
      class="action primary block"
      onclick="requestAV()"
    >
      🎥 Camera + 🎙 Microphone
    </button>

    <p class="notice">
      Camera and microphone permissions
      will be requested.
    </p>
  `);
}


async function requestAV() {

  try {

    const stream =
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

    stream
      .getTracks()
      .forEach(track => track.stop());

    toast(
      "Camera and microphone permission granted."
    );

    closeModal();

  } catch (error) {

    toast(
      "Camera or microphone permission was denied."
    );
  }
}

window.startLive = startLive;
window.requestAV = requestAV;


/* =========================================================
   MARKET
   ========================================================= */

async function market() {

  const { data, error } =
    await sb
      .from("marketplace_listings")
      .select(`
        *,
        profiles(
          username,
          full_name,
          avatar_url
        )
      `)
      .eq("status", "active")
      .order("created_at", {
        ascending: false
      })
      .limit(40);

  if (error) {
    toast(error.message);
    return;
  }

  const items = data || [];

  app.innerHTML = `
    <div class="title">
      Market
    </div>

    <div class="tabs">

      <button
        class="action tab primary"
        onclick="market()"
      >
        🛍 Marketplace
      </button>

      <button
        class="action tab"
        onclick="work()"
      >
        💼 Free Work
      </button>

    </div>

    <div class="actions">

      <button
        class="action primary"
        onclick="newListing()"
      >
        ＋ Sell item
      </button>

    </div>

    ${
      items.length
        ? `
          <div class="grid2">
            ${items.map(marketCard).join("")}
          </div>
        `
        : `
          <div class="card empty">
            No real marketplace listings yet.
          </div>
        `
    }
  `;
}


function marketCard(item) {

  return `
    <div class="card">

      ${
        item.image_url
          ? `
            <img
              class="market-img"
              src="${esc(item.image_url)}"
              alt=""
            >
          `
          : ""
      }

      <h3>
        ${esc(item.title)}
      </h3>

      <p>
        ${esc(item.description || "")}
      </p>

      <b>
        ${etb(item.price_etb)}
      </b>

      <p class="muted">
        Seller:
        @${esc(
          item.profiles?.username ||
          "user"
        )}
      </p>

    </div>
  `;
}


function newListing() {

  openModal(`
    <h2>Sell item</h2>

    <input
      id="mt"
      class="input"
      placeholder="Product title"
    >

    <textarea
      id="md"
      class="textarea"
      placeholder="Description"
    ></textarea>

    <input
      id="mp"
      class="input"
      type="number"
      min="0"
      placeholder="Amount you want to receive (ETB)"
    >

    <input
      id="mloc"
      class="input"
      placeholder="Location"
    >

    <input
      id="mphone"
      class="input"
      placeholder="Phone"
    >

    <p class="notice">
      MENA fee = 5%.
      Buyer delivery = 80 ETB.
    </p>

    <button
      class="action primary block"
      onclick="saveListing()"
    >
      Continue
    </button>
  `);
}


async function saveListing() {

  const desiredReceive =
    Number(val("mp") || 0);

  if (!val("mt")) {
    toast("Product title is required.");
    return;
  }

  if (desiredReceive <= 0) {
    toast("Enter the amount you want to receive.");
    return;
  }

  const buyerPrice =
    desiredReceive / 0.95;

  toast(
    `Buyer product price: ${buyerPrice.toFixed(2)} ETB`
  );

  closeModal();
}

window.market = market;
window.newListing = newListing;
window.saveListing = saveListing;


/* =========================================================
   FREE WORK
   ========================================================= */

async function work() {

  const { data, error } =
    await sb
      .from("free_work_posts")
      .select(`
        *,
        profiles(
          username,
          full_name
        )
      `)
      .eq("status", "active")
      .order("created_at", {
        ascending: false
      })
      .limit(40);

  if (error) {
    toast(error.message);
    return;
  }

  const items = data || [];

  app.innerHTML = `
    <div class="title">
      Free Work
    </div>

    <div class="tabs">

      <button
        class="action tab"
        onclick="market()"
      >
        🛍 Marketplace
      </button>

      <button
        class="action tab primary"
        onclick="work()"
      >
        💼 Free Work
      </button>

    </div>

    <div class="actions">

      <button
        class="action primary"
        onclick="newWork()"
      >
        ＋ Post work
      </button>

    </div>

    ${
      items.length
        ? items.map(item => `
            <div class="card">

              <h3>
                ${esc(item.title)}
              </h3>

              <p>
                ${esc(item.description || "")}
              </p>

              <p class="muted">
                ${esc(item.category || "WORK")}
              </p>

            </div>
          `).join("")
        : `
          <div class="card empty">
            No real Free Work posts yet.
          </div>
        `
    }
  `;
}


function newWork() {

  openModal(`
    <h2>Post Free Work</h2>

    <input
      id="wt"
      class="input"
      placeholder="Title"
    >

    <textarea
      id="wd"
      class="textarea"
      placeholder="Work details"
    ></textarea>

    <input
      id="wc"
      class="input"
      placeholder="Category"
    >

    <input
      id="wcontact"
      class="input"
      placeholder="Contact"
    >

    <input
      id="wm"
      class="input"
      type="number"
      placeholder="Material amount ETB"
    >

    <p class="notice">
      Free Work posting fee: 50 ETB.
    </p>

    <button
      class="action primary block"
      onclick="saveWork()"
    >
      Continue
    </button>
  `);
}


function saveWork() {

  toast(
    "The 50 ETB payment must be connected before publishing."
  );

  closeModal();
}

window.work = work;
window.newWork = newWork;
window.saveWork = saveWork;


/* =========================================================
   PROFILE
   ========================================================= */

async function profile(userId) {

  const { data: profileData, error } =
    await sb
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

  if (error) {
    toast(error.message);
    return;
  }

  const own =
    userId === currentUser.id;

  const postsResult =
    await sb
      .from("posts")
      .select(`
        id,
        media_url,
        media_type,
        caption,
        likes_count,
        comments_count,
        created_at
      `)
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false
      })
      .limit(30);

  app.innerHTML = `
    <div class="card">

      <div class="row">

        ${
          profileData.avatar_url
            ? `
              <img
                class="avatar big"
                src="${esc(profileData.avatar_url)}"
                alt=""
              >
            `
            : `
              <span class="avatar big"></span>
            `
        }

        <div>

          <h2>
            ${esc(
              profileData.full_name ||
              profileData.username ||
              "MENA User"
            )}
          </h2>

          <div class="muted">
            @${esc(profileData.username || "")}
          </div>

        </div>

      </div>

      <p>
        ${esc(profileData.bio || "")}
      </p>

      <div class="stats">

        <div class="stat">
          <strong>
            ${profileData.followers_count || 0}
          </strong>
          <small>Followers</small>
        </div>

        <div class="stat">
          <strong>
            ${profileData.following_count || 0}
          </strong>
          <small>Following</small>
        </div>

        <div class="stat">
          <strong>
            ${profileData.likes_count || 0}
          </strong>
          <small>Likes</small>
        </div>

      </div>

      <div class="actions">

        ${
          own
            ? `
              <button
                class="action primary"
                onclick="editProfile()"
              >
                Edit profile
              </button>

              <button
                class="action"
                onclick="openWallet()"
              >
                💰 Wallet
              </button>

              <button
                class="action"
                onclick="settings()"
              >
                ⚙ Settings
              </button>
            `
            : `
              <button
                class="action primary"
                onclick="followUser('${esc(userId)}')"
              >
                ＋ Follow
              </button>
            `
        }

      </div>

    </div>

    <div class="section-title">
      Posts
    </div>

    ${
      postsResult.data?.length
        ? `
          <div class="grid2">
            ${postsResult.data.map(post => `
              <div class="card">

                ${
                  post.media_type === "video"
                    ? `
                      <video
                        class="market-img"
                        src="${esc(post.media_url)}"
                        controls
                      ></video>
                    `
                    : `
                      <img
                        class="market-img"
                        src="${esc(post.media_url)}"
                        alt=""
                      >
                    `
                }

                <p>
                  ${esc(post.caption || "")}
                </p>

              </div>
            `).join("")}
          </div>
        `
        : `
          <div class="card empty">
            No posts.
          </div>
        `
    }
  `;
}

window.profile = profile;


/* =========================================================
   EDIT PROFILE
   ========================================================= */

function editProfile() {

  openModal(`
    <h2>Edit profile</h2>

    <input
      id="epname"
      class="input"
      placeholder="Full name"
    >

    <input
      id="epuser"
      class="input"
      placeholder="Username"
    >

    <textarea
      id="epbio"
      class="textarea"
      placeholder="Bio"
    ></textarea>

    <input
      id="epavatar"
      class="input"
      placeholder="Avatar image URL"
    >

    <button
      class="action primary block"
      onclick="saveProfile()"
    >
      Save
    </button>
  `);
}


async function saveProfile() {

  const update = {
    full_name: val("epname"),
    username: val("epuser"),
    bio: val("epbio"),
    avatar_url: val("epavatar"),
    updated_at: new Date().toISOString()
  };

  const { error } =
    await sb
      .from("profiles")
      .update(update)
      .eq("id", currentUser.id);

  if (error) {
    toast(error.message);
    return;
  }

  closeModal();

  await profile(currentUser.id);
}

window.editProfile = editProfile;
window.saveProfile = saveProfile;


/* =========================================================
   SETTINGS
   ========================================================= */

function settings() {

  openModal(`
    <h2>Settings</h2>

    <div class="actions">

      <button
        class="action block"
        onclick="editProfile();"
      >
        ✏️ Edit profile
      </button>

      <button
        class="action block"
        onclick="openWallet();"
      >
        💰 Wallet
      </button>

      <button
        class="action block"
        onclick="coinShop();"
      >
        🪙 Coin shop
      </button>

      <button
        class="action block"
        onclick="manageWallet();"
      >
        📲 Telebirr / M-Pesa
      </button>

      <button
        class="action danger block"
        onclick="logout();closeModal();"
      >
        Log out
      </button>

    </div>
  `);
}

window.settings = settings;


/* =========================================================
   WALLET
   ========================================================= */

async function openWallet() {

  const { data } =
    await sb
      .from("wallets")
      .select(
        "coin_balance,etb_balance"
      )
      .eq(
        "user_id",
        currentUser.id
      )
      .maybeSingle();

  const wallet =
    data || {
      coin_balance: 0,
      etb_balance: 0
    };

  openModal(`
    <h2>Wallet</h2>

    <div class="stats">

      <div class="stat">
        <strong>
          ${wallet.coin_balance || 0}
        </strong>
        <small>Coins</small>
      </div>

      <div class="stat">
        <strong>
          ${etb(wallet.etb_balance)}
        </strong>
        <small>ETB</small>
      </div>

      <div class="stat">
        <strong>10 ETB</strong>
        <small>Minimum withdrawal</small>
      </div>

    </div>

    <div class="actions">

      <button
        class="action primary"
        onclick="coinShop()"
      >
        🪙 Buy coins
      </button>

      <button
        class="action"
        onclick="withdrawPage()"
      >
        Withdraw
      </button>

    </div>
  `);
}

window.openWallet = openWallet;


/* =========================================================
   COIN SHOP
   ========================================================= */

function coinShop() {

  openModal(`
    <h2>Coin shop</h2>

    <p>
      1 coin = 0.50 ETB
    </p>

    <p class="muted">
      Choose Telebirr or M-Pesa.
    </p>

    <button
      class="action primary block"
      onclick="depositPage()"
    >
      📲 Buy coins
    </button>
  `);
}

window.coinShop = coinShop;


/* =========================================================
   DEPOSIT
   ========================================================= */

function depositPage() {

  openModal(`
    <h2>Buy coins</h2>

    <select
      id="paymentMethod"
      class="select"
    >
      <option value="telebirr">
        Telebirr
      </option>

      <option value="mpesa">
        M-Pesa
      </option>
    </select>

    <input
      id="depPhone"
      class="input"
      placeholder="Payment number"
    >

    <input
      id="depAmount"
      class="input"
      type="number"
      min="1"
      placeholder="Amount ETB"
    >

    <button
      class="action primary block"
      onclick="paymentNotice('deposit')"
    >
      Continue
    </button>
  `);
}

window.depositPage = depositPage;


/* =========================================================
   WITHDRAW
   ========================================================= */

function withdrawPage() {

  openModal(`
    <h2>Withdraw</h2>

    <p>
      Minimum withdrawal:
      <b>10 ETB</b>
    </p>

    <select
      class="select"
      id="withdrawMethod"
    >
      <option value="telebirr">
        Telebirr
      </option>

      <option value="mpesa">
        M-Pesa
      </option>
    </select>

    <input
      id="withdrawPhone"
      class="input"
      placeholder="Wallet number"
    >

    <input
      id="withdrawAmount"
      class="input"
      type="number"
      min="10"
      placeholder="Amount ETB"
    >

    <button
      class="action primary block"
      onclick="paymentNotice('withdraw')"
    >
      Request withdrawal
    </button>
  `);
}

window.withdrawPage = withdrawPage;


/* =========================================================
   PAYMENT NOTICE
   ========================================================= */

function paymentNotice(type) {

  if (type === "deposit") {

    toast(
      "Payment backend is not connected yet. No money was charged."
    );

  } else {

    toast(
      "Withdrawal backend is not connected yet. No withdrawal was made."
    );
  }
}

window.paymentNotice = paymentNotice;


/* =========================================================
   WALLET CONNECTION
   ========================================================= */

function manageWallet() {

  openModal(`
    <h2>Wallet connection</h2>

    <select
      id="walletMethod"
      class="select"
    >
      <option>
        Telebirr
      </option>

      <option>
        M-Pesa
      </option>
    </select>

    <input
      id="walletPhone"
      class="input"
      placeholder="Account phone number"
    >

    <button
      class="action primary block"
      onclick="toast('Wallet connection will be enabled with the secure payment backend.')"
    >
      Save wallet
    </button>
  `);
}

window.manageWallet = manageWallet;


/* =========================================================
   SEARCH
   ========================================================= */

async function searchAll() {

  const query =
    prompt("Search MENA");

  if (!query) return;

  const q =
    query.replace(/[%_]/g, "");

  const [people, products, works, postResults] =
    await Promise.all([

      sb
        .from("profiles")
        .select(
          "id,username,full_name,avatar_url"
        )
        .or(
          `username.ilike.%${q}%,full_name.ilike.%${q}%`
        )
        .limit(10),

      sb
        .from("marketplace_listings")
        .select(
          "id,title,price_etb,image_url"
        )
        .eq("status", "active")
        .ilike(
          "title",
          `%${q}%`
        )
        .limit(10),

      sb
        .from("free_work_posts")
        .select(
          "id,title,description"
        )
        .eq("status", "active")
        .ilike(
          "title",
          `%${q}%`
        )
        .limit(10),

      sb
        .from("posts")
        .select(
          `
          id,
          user_id,
          caption,
          media_url,
          profiles(
            username,
            full_name
          )
          `
        )
        .ilike(
          "caption",
          `%${q}%`
        )
        .limit(20)

    ]);

  openModal(`

    <h2>
      Search: ${esc(query)}
    </h2>

    <div class="section-title">
      People
    </div>

    ${
      people.data?.length
        ? people.data.map(person => `
            <div class="card">

              <button
                class="link"
                onclick="
                  closeModal();
                  profile('${esc(person.id)}')
                "
              >
                ${esc(
                  person.full_name ||
                  person.username
                )}
              </button>

              <div class="muted">
                @${esc(
                  person.username || ""
                )}
              </div>

            </div>
          `).join("")
        : `
          <p class="muted">
            No people found.
          </p>
        `
    }

    <div class="section-title">
      Marketplace
    </div>

    ${
      products.data?.length
        ? products.data.map(product => `
            <div class="card">

              <b>
                ${esc(product.title)}
              </b>

              <p>
                ${etb(product.price_etb)}
              </p>

            </div>
          `).join("")
        : `
          <p class="muted">
            No marketplace results.
          </p>
        `
    }

    <div class="section-title">
      Free Work
    </div>

    ${
      works.data?.length
        ? works.data.map(workItem => `
            <div class="card">

              <b>
                ${esc(workItem.title)}
              </b>

              <p>
                ${esc(
                  workItem.description || ""
                )}
              </p>

            </div>
          `).join("")
        : `
          <p class="muted">
            No work results.
          </p>
        `
    }

    <div class="section-title">
      Posts
    </div>

    ${
      postResults.data?.length
        ? postResults.data.map(post => `
            <div class="card">

              <b>
                @${esc(
                  post.profiles?.username ||
                  "user"
                )}
              </b>

              <p>
                ${esc(post.caption || "")}
              </p>

            </div>
          `).join("")
        : `
          <p class="muted">
            No posts found.
          </p>
        `
    }

  `);
}

window.searchAll = searchAll;


/* =========================================================
   BUTTON CONNECTIONS
   ========================================================= */

const createButton =
  document.getElementById("createBtn");

if (createButton) {
  createButton.onclick = function () {

    if (!currentUser) {
      showAuth();
      return;
    }

    openCreate();
  };
}


const settingsButton =
  document.getElementById("settingsBtn");

if (settingsButton) {

  settingsButton.onclick = function () {

    if (!currentUser) {
      showAuth();
      return;
    }

    settings();
  };
}


const searchButton =
  document.getElementById("searchBtn");

if (searchButton) {

  searchButton.onclick = function () {

    if (!currentUser) {
      showAuth();
      return;
    }

    searchAll();
  };
}


/* =========================================================
   START
   ========================================================= */

init();
