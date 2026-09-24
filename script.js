/* =========================================================
   MENA
   Main application
   ========================================================= */

const SUPABASE_URL =
  "https://ryywkqyeoftuejczeqgg.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_E6S3EtoGbEqA_XkRpJhYpA_g8SvjMeH";


/* =========================================================
   SUPABASE
   ========================================================= */

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================================================
   MENA BUSINESS RULES
   ========================================================= */

const MENA = {
  sellerFeePercent: 5,
  deliveryFee: 80,
  coinValue: 0.50,
  minimumWithdrawal: 10,
  freeWorkFee: 50,
  freeWorkDays: 30
};


/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;
let currentPage = "home";
let posts = [];
let products = [];
let workPosts = [];
let gifts = [];


/* =========================================================
   HELPERS
   ========================================================= */

const $ = id => document.getElementById(id);

function esc(value){

  if(value === null || value === undefined){
    return "";
  }

  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}


function money(value){

  const n = Number(value || 0);

  return n.toLocaleString("en-US",{
    minimumFractionDigits:2,
    maximumFractionDigits:2
  }) + " ETB";
}


function toast(message){

  const el = $("toast");

  el.textContent = message;
  el.classList.remove("hidden");

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(()=>{
    el.classList.add("hidden");
  },3000);
}


function openModal(html){

  $("modalContent").innerHTML = html;
  $("modal").classList.remove("hidden");
}


function closeModal(){

  $("modal").classList.add("hidden");
  $("modalContent").innerHTML = "";
}


$("modalClose").onclick = closeModal;


$("modal").addEventListener("click",e=>{

  if(e.target.classList.contains("modal-backdrop")){
    closeModal();
  }

});


function avatarHTML(profile,sizeClass="avatar"){

  if(profile?.avatar_url){

    return `
      <img
        class="${sizeClass}"
        src="${esc(profile.avatar_url)}"
        alt=""
      >
    `;
  }

  const letter =
    (profile?.full_name ||
     profile?.username ||
     "M")
    .charAt(0)
    .toUpperCase();

  return `
    <div class="${sizeClass}">
      ${esc(letter)}
    </div>
  `;
}


/* =========================================================
   AUTH UI
   ========================================================= */

function showLogin(){

  $("loginBox").classList.remove("hidden");
  $("signupBox").classList.add("hidden");
  $("authMessage").textContent = "";
}


function showSignup(){

  $("loginBox").classList.add("hidden");
  $("signupBox").classList.remove("hidden");
  $("authMessage").textContent = "";
}


$("showSignup").onclick = showSignup;
$("showLogin").onclick = showLogin;


/* =========================================================
   SIGN UP
   ========================================================= */

async function signup(){

  const username =
    $("signupUsername").value.trim();

  const fullName =
    $("signupName").value.trim();

  const email =
    $("signupEmail").value.trim();

  const password =
    $("signupPassword").value;


  if(!username || !email || !password){

    $("authMessage").textContent =
      "Username, email and password are required.";

    return;
  }


  if(password.length < 6){

    $("authMessage").textContent =
      "Password must contain at least 6 characters.";

    return;
  }


  $("signupBtn").disabled = true;


  const {data,error} =
    await sb.auth.signUp({

      email,
      password,

      options:{
        data:{
          username,
          full_name:fullName
        }
      }

    });


  $("signupBtn").disabled = false;


  if(error){

    $("authMessage").textContent =
      error.message;

    return;
  }


  if(data.user){

    $("authMessage").style.color =
      "#087f5b";

    $("authMessage").textContent =
      "Account created. Check your email if email confirmation is enabled.";

    showLogin();
  }

}


$("signupBtn").onclick = signup;


/* =========================================================
   LOGIN
   ========================================================= */

async function login(){

  const email =
    $("loginEmail").value.trim();

  const password =
    $("loginPassword").value;


  if(!email || !password){

    $("authMessage").textContent =
      "Enter email and password.";

    return;
  }


  $("loginBtn").disabled = true;


  const {data,error} =
    await sb.auth.signInWithPassword({

      email,
      password

    });


  $("loginBtn").disabled = false;


  if(error){

    $("authMessage").textContent =
      error.message;

    return;
  }


  currentUser = data.user;

  await ensureProfile();

  await loadAll();

  showApp();

}


$("loginBtn").onclick = login;


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout(){

  await sb.auth.signOut();

  currentUser = null;

  $("appShell").classList.add("hidden");
  $("authPage").classList.remove("hidden");

  showLogin();

}


/* =========================================================
   ENSURE PROFILE
   ========================================================= */

async function ensureProfile(){

  if(!currentUser){
    return;
  }


  const {data,error} =
    await sb
      .from("profiles")
      .select("id")
      .eq("id",currentUser.id)
      .maybeSingle();


  if(error){
    console.error(error);
    return;
  }


  if(data){
    return;
  }


  const meta =
    currentUser.user_metadata || {};


  let username =
    meta.username ||
    "user_" + currentUser.id.slice(0,8);


  username =
    username
      .toLowerCase()
      .replace(/[^a-z0-9_]/g,"")
      .slice(0,24);


  if(!username){
    username =
      "user_" + currentUser.id.slice(0,8);
  }


  await sb
    .from("profiles")
    .insert({

      id:currentUser.id,

      username,

      full_name:
        meta.full_name || ""

    });

}


/* =========================================================
   APP VISIBILITY
   ========================================================= */

function showApp(){

  $("authPage").classList.add("hidden");
  $("appShell").classList.remove("hidden");

  navigate(currentPage);

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function navigate(page){

  currentPage = page;


  const pages = [
    "home",
    "market",
    "work",
    "profile",
    "settings"
  ];


  pages.forEach(name=>{

    const el =
      $(name + "Page");

    if(el){

      el.classList.toggle(
        "hidden",
        name !== page
      );

    }

  });


  document
    .querySelectorAll(".nav-btn")
    .forEach(btn=>{

      btn.classList.toggle(
        "active",
        btn.dataset.page === page
      );

    });


  if(page === "home"){
    renderHome();
  }

  if(page === "market"){
    loadMarketplace();
  }

  if(page === "work"){
    loadFreeWork();
  }

  if(page === "profile"){
    loadMyProfile();
  }

}


document
  .querySelectorAll("[data-page]")
  .forEach(button=>{

    button.addEventListener("click",()=>{

      navigate(button.dataset.page);

    });

  });


$("brandBtn").onclick = ()=>{
  navigate("home");
};


/* =========================================================
   LOAD ALL
   ========================================================= */

async function loadAll(){

  await Promise.all([
    loadPosts(),
    loadGifts()
  ]);

}


/* =========================================================
   POSTS
   ========================================================= */

async function loadPosts(){

  const {data,error} =
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
      .order("created_at",{ascending:false})
      .limit(50);


  if(error){

    console.error(error);

    posts = [];

    return;
  }


  posts = data || [];

}


/* =========================================================
   HOME
   ========================================================= */

function renderHome(){

  const box =
    $("postFeed");


  if(!posts.length){

    box.innerHTML = `
      <div class="card empty">
        <h3>No posts yet</h3>
        <p>Create the first MENA post.</p>
      </div>
    `;

    return;
  }


  box.innerHTML =
    posts
      .map(postHTML)
      .join("");

}


function postHTML(post){

  const profile =
    post.profiles || {};


  let media = "";


  if(post.media_type === "video"){

    media = `
      <video
        class="post-media"
        controls
        playsinline
        src="${esc(post.media_url)}"
      ></video>
    `;

  }else{

    media = `
      <img
        class="post-media"
        src="${esc(post.media_url)}"
        alt="MENA post"
      >
    `;

  }


  return `

    <article class="post">

      <div class="post-head">

        ${avatarHTML(profile)}

        <div>

          <div class="post-user">
            ${esc(
              profile.full_name ||
              profile.username ||
              "MENA user"
            )}
          </div>

          <div class="post-username">
            @${esc(profile.username || "user")}
          </div>

        </div>

      </div>


      ${media}


      <div class="post-caption">

        ${esc(post.caption || "")}

      </div>


      <div class="post-actions">

        <button
          class="action-btn"
          onclick="likePost('${post.id}')"
        >
          ❤️ Like
        </button>

        <button
          class="action-btn"
          onclick="commentPost('${post.id}')"
        >
          💬 Comment
        </button>

        <button
          class="action-btn"
          onclick="sharePost('${post.id}')"
        >
          ↗ Share
        </button>

        <button
          class="action-btn"
          onclick="giftPost('${post.id}','${post.user_id}')"
        >
          🎁 Gift
        </button>

      </div>

    </article>

  `;

}


/* =========================================================
   LIKE
   ========================================================= */

async function likePost(postId){

  if(!currentUser){
    return;
  }


  const {error} =
    await sb
      .from("post_likes")
      .upsert({

        post_id:postId,

        user_id:currentUser.id

      },{
        onConflict:"post_id,user_id"
      });


  if(error){

    toast(error.message);

    return;
  }


  toast("Liked.");

}


window.likePost = likePost;


/* =========================================================
   COMMENTS
   ========================================================= */

async function commentPost(postId){

  const {data,error} =
    await sb
      .from("comments")
      .select(`
        *,
        profiles(
          username,
          avatar_url
        )
      `)
      .eq("post_id",postId)
      .order("created_at",{ascending:true});


  if(error){

    toast(error.message);

    return;
  }


  const comments =
    data || [];


  const html =
    comments.length

      ? comments.map(comment=>`

          <div class="card">

            <b>
              @${esc(
                comment.profiles?.username ||
                "user"
              )}
            </b>

            <p>
              ${esc(comment.comment_text)}
            </p>

          </div>

        `).join("")

      : `
        <p class="muted">
          No comments yet.
        </p>
      `;


  openModal(`

    <h2>Comments</h2>

    <div>
      ${html}
    </div>

    <textarea
      id="commentText"
      class="input"
      placeholder="Write a comment..."
    ></textarea>

    <button
      class="btn primary full"
      onclick="sendComment('${postId}')"
    >
      Comment
    </button>

  `);

}


window.commentPost = commentPost;


async function sendComment(postId){

  const text =
    $("commentText").value.trim();


  if(!text){
    return;
  }


  const {error} =
    await sb
      .from("comments")
      .insert({

        post_id:postId,

        user_id:currentUser.id,

        comment_text:text

      });


  if(error){

    toast(error.message);

    return;
  }


  closeModal();

  toast("Comment added.");

}


window.sendComment = sendComment;


/* =========================================================
   SHARE
   ========================================================= */

async function sharePost(postId){

  const url =
    location.href.split("#")[0] +
    "#post-" +
    postId;


  try{

    if(navigator.share){

      await navigator.share({
        title:"MENA",
        text:"Check this MENA post.",
        url
      });

    }else{

      await navigator.clipboard.writeText(url);

      toast("Post link copied.");

    }

  }catch(e){

    console.log(e);

  }

}


window.sharePost = sharePost;


/* =========================================================
   GIFTS
   ========================================================= */

async function loadGifts(){

  const {data,error} =
    await sb
      .from("gift_catalog")
      .select("*")
      .eq("active",true)
      .order("coin_cost");


  if(error){

    gifts = [];

    return;
  }


  gifts = data || [];

}


function giftPost(postId,receiverId){

  if(!gifts.length){

    toast("Gift catalog is empty.");

    return;
  }


  openModal(`

    <h2>Send a gift</h2>

    <p class="muted">
      1 coin = 0.50 ETB.
    </p>

    <div>

      ${gifts.map(g=>`

        <button
          class="btn secondary full"
          onclick="selectGift(
            '${postId}',
            '${receiverId}',
            '${g.id}',
            '${g.coin_cost}'
          )"
        >
          ${esc(g.icon || "🎁")}
          ${esc(g.name)}
          — ${esc(g.coin_cost)} coins
        </button>

      `).join("")}

    </div>

  `);

}


window.giftPost = giftPost;


function selectGift(
  postId,
  receiverId,
  giftId,
  cost
){

  closeModal();

  toast(
    cost +
    " coins selected. Secure gift payment backend is required before charging coins."
  );

}


window.selectGift = selectGift;


/* =========================================================
   CREATE POST
   ========================================================= */

$("createBtn").onclick = openCreate;


function openCreate(){

  openModal(`

    <h2>Create post</h2>

    <p class="muted">
      Upload a photo or video.
    </p>

    <button
      class="btn primary full"
      onclick="chooseMedia()"
    >
      📷 Choose photo / video
    </button>

  `);

}


window.openCreate = openCreate;


function chooseMedia(){

  closeModal();

  $("mediaInput").click();

}


window.chooseMedia = chooseMedia;


$("mediaInput").addEventListener(
  "change",
  async event=>{

    const file =
      event.target.files?.[0];


    if(!file){
      return;
    }


    if(!currentUser){

      toast("Please log in.");

      return;
    }


    const caption =
      prompt("Caption") || "";


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


    toast("Uploading...");


    const upload =
      await sb.storage
        .from("media")
        .upload(
          filePath,
          file,
          {
            upsert:false,
            contentType:file.type
          }
        );


    if(upload.error){

      toast(
        "Upload failed: " +
        upload.error.message
      );

      event.target.value = "";

      return;
    }


    const publicURL =
      sb.storage
        .from("media")
        .getPublicUrl(filePath)
        .data
        .publicUrl;


    const mediaType =
      file.type.startsWith("video/")
        ? "video"
        : "image";


    const {error} =
      await sb
        .from("posts")
        .insert({

          user_id:currentUser.id,

          media_url:publicURL,

          media_type:mediaType,

          caption

        });


    if(error){

      toast(error.message);

      event.target.value = "";

      return;
    }


    event.target.value = "";

    await loadPosts();

    navigate("home");

    toast("Post published.");

  }
);


/* =========================================================
   MARKETPLACE
   ========================================================= */

async function loadMarketplace(){

  const {data,error} =
    await sb
      .from("marketplace_listings")
      .select(`
        *,
        profiles(
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq("status","active")
      .order("created_at",{ascending:false})
      .limit(50);


  if(error){

    console.error(error);

    products = [];

    renderMarketplaceError(
      error.message
    );

    return;
  }


  products = data || [];

  renderMarketplace();

}


function renderMarketplace(){

  const box =
    $("marketList");


  if(!products.length){

    box.innerHTML = `

      <div class="card empty">

        <h3>No products yet</h3>

        <p>
          Real seller listings will appear here.
        </p>

      </div>

    `;

    return;
  }


  box.innerHTML =
    products
      .map(productHTML)
      .join("");

}


function renderMarketplaceError(message){

  $("marketList").innerHTML = `

    <div class="card">

      <b>Marketplace error</b>

      <p class="muted">
        ${esc(message)}
      </p>

    </div>

  `;

}


function productHTML(product){

  const image =
    product.image_url
      ? `
        <img
          class="product-image"
          src="${esc(product.image_url)}"
          alt=""
        >
      `
      : "";


  return `

    <article class="product-card">

      ${image}

      <div class="product-title">
        ${esc(product.title || "Product")}
      </div>

      <div class="price">
        ${money(product.price_etb)}
      </div>

      <div class="delivery">
        Delivery: ${money(MENA.deliveryFee)}
      </div>

      <p class="muted">
        Seller:
        @${esc(
          product.profiles?.username ||
          "user"
        )}
      </p>

      <button
        class="btn primary full"
        onclick="viewProduct('${product.id}')"
      >
        View product
      </button>

    </article>

  `;

}


function viewProduct(id){

  const product =
    products.find(p=>p.id===id);


  if(!product){
    return;
  }


  openModal(`

    <h2>${esc(product.title)}</h2>

    <div class="price">
      ${money(product.price_etb)}
    </div>

    <p>
      Delivery:
      ${money(MENA.deliveryFee)}
    </p>

    <p class="notice">
      Buyer total =
      product price +
      ${money(MENA.deliveryFee)} delivery.
    </p>

    <button
      class="btn primary full"
      onclick="startOrder('${product.id}')"
    >
      Buy
    </button>

  `);

}


window.viewProduct = viewProduct;


function startOrder(id){

  closeModal();

  toast(
    "Secure marketplace order backend is required before taking payment."
  );

}


/* =========================================================
   SELL
   ========================================================= */

$("sellBtn").onclick = openSell;


function openSell(){

  openModal(`

    <h2>Sell a product</h2>

    <p class="muted">
      Enter the amount you want to receive.
    </p>

    <input
      id="sellerReceive"
      class="input"
      type="number"
      min="1"
      placeholder="Your desired receive amount"
    >

    <input
      id="productTitle"
      class="input"
      placeholder="Product title"
    >

    <input
      id="productImage"
      class="input"
      placeholder="Product image URL"
    >

    <textarea
      id="productDescription"
      class="input"
      placeholder="Description"
    ></textarea>

    <div
      id="pricePreview"
      class="notice"
    >
      Enter your desired receive amount.
    </div>

    <button
      class="btn primary full"
      onclick="calculateSellerPrice()"
    >
      Calculate price
    </button>

    <button
      class="btn secondary full"
      onclick="createListing()"
    >
      Create listing
    </button>

  `);

}


function calculateSellerPrice(){

  const receive =
    Number(
      $("sellerReceive").value
    );


  if(!receive || receive <= 0){

    $("pricePreview").textContent =
      "Enter a valid amount.";

    return;
  }


  const productPrice =
    receive / 0.95;


  const fee =
    productPrice * 0.05;


  const total =
    productPrice + MENA.deliveryFee;


  $("pricePreview").innerHTML = `

    You receive:
    <b>${money(receive)}</b>
    <br>

    Buyer product price:
    <b>${money(productPrice)}</b>
    <br>

    MENA fee:
    <b>${money(fee)}</b>
    <br>

    Delivery:
    <b>${money(MENA.deliveryFee)}</b>
    <br>

    Buyer total:
    <b>${money(total)}</b>

  `;

}


window.calculateSellerPrice =
  calculateSellerPrice;


async function createListing(){

  const receive =
    Number(
      $("sellerReceive").value
    );


  const title =
    $("productTitle").value.trim();


  const image =
    $("productImage").value.trim();


  const description =
    $("productDescription").value.trim();


  if(!receive || !title){

    toast(
      "Enter desired receive amount and product title."
    );

    return;
  }


  const buyerPrice =
    receive / 0.95;


  const {error} =
    await sb
      .from("marketplace_listings")
      .insert({

        seller_id:currentUser.id,

        title,

        description,

        price_etb:
          Number(
            buyerPrice.toFixed(2)
          ),

        image_url:image || null,

        status:"active"

      });


  if(error){

    toast(error.message);

    return;
  }


  closeModal();

  await loadMarketplace();

  toast("Listing created.");

}


window.createListing =
  createListing;


/* =========================================================
   FREE WORK
   ========================================================= */

$("workPostBtn").onclick =
  openFreeWork;


async function loadFreeWork(){

  const {data,error} =
    await sb
      .from("free_work_posts")
      .select(`
        *,
        profiles(
          username,
          full_name,
          avatar_url
        )
      `)
      .eq("status","active")
      .order("created_at",{ascending:false})
      .limit(50);


  if(error){

    workPosts = [];

    $("workList").innerHTML = `

      <div class="card">

        <b>Free Work</b>

        <p class="muted">
          ${esc(error.message)}
        </p>

      </div>

    `;

    return;
  }


  workPosts = data || [];


  if(!workPosts.length){

    $("workList").innerHTML = `

      <div class="card empty">

        <h3>No work posts yet.</h3>

        <p>
          Real Free Work posts will appear here.
        </p>

      </div>

    `;

    return;
  }


  $("workList").innerHTML =
    workPosts
      .map(workHTML)
      .join("");

}


function workHTML(work){

  return `

    <article class="card">

      <h3>
        ${esc(work.title)}
      </h3>

      <p>
        ${esc(work.description)}
      </p>

      <p class="muted">

        Posted by @${esc(
          work.profiles?.username ||
          "user"
        )}

      </p>

    </article>

  `;

}


function openFreeWork(){

  openModal(`

    <h2>Create Free Work</h2>

    <p class="notice">
      Posting fee: 50 ETB.
      Active for 30 days.
    </p>

    <input
      id="workTitle"
      class="input"
      placeholder="Work title"
    >

    <textarea
      id="workDescription"
      class="input"
      placeholder="Describe the work"
    ></textarea>

    <button
      class="btn primary full"
      onclick="createFreeWork()"
    >
      Continue
    </button>

  `);

}


async function createFreeWork(){

  const title =
    $("workTitle").value.trim();


  const description =
    $("workDescription").value.trim();


  if(!title || !description){

    toast(
      "Enter title and description."
    );

    return;
  }


  closeModal();


  toast(
    "Free Work requires secure 50 ETB payment before publishing."
  );

}


window.createFreeWork =
  createFreeWork;


/* =========================================================
   PROFILE
   ========================================================= */

async function loadMyProfile(){

  if(!currentUser){
    return;
  }


  const {data,error} =
    await sb
      .from("profiles")
      .select("*")
      .eq("id",currentUser.id)
      .maybeSingle();


  if(error){

    $("profileContent").innerHTML = `

      <div class="card">
        ${esc(error.message)}
      </div>

    `;

    return;
  }


  if(!data){

    $("profileContent").innerHTML = `

      <div class="card">
        Profile not found.
      </div>

    `;

    return;
  }


  renderProfile(data);

}


function renderProfile(profile){

  $("profileContent").innerHTML = `

    <div class="profile-header">

      ${
        avatarHTML(
          profile,
          "profile-avatar"
        )
      }

      <div class="profile-name">

        ${esc(
          profile.full_name ||
          profile.username ||
          "MENA user"
        )}

      </div>

      <div class="profile-username">

        @${esc(profile.username || "user")}

      </div>

      <p class="profile-bio">

        ${esc(profile.bio || "")}

      </p>


      <div class="stats">

        <div class="stat">
          <strong>
            ${profile.followers_count || 0}
          </strong>
          <small>Followers</small>
        </div>

        <div class="stat">
          <strong>
            ${profile.following_count || 0}
          </strong>
          <small>Following</small>
        </div>

        <div class="stat">
          <strong>
            ${profile.likes_count || 0}
          </strong>
          <small>Likes</small>
        </div>

      </div>


      <div class="profile-buttons">

        <button
          class="btn primary"
          onclick="editProfile()"
        >
          Edit profile
        </button>

        <button
          class="btn secondary"
          onclick="openWallet()"
        >
          💰 Wallet
        </button>

        <button
          class="btn secondary"
          onclick="openMyMarket()"
        >
          🛍 My Market
        </button>

      </div>

    </div>


    <div class="card">

      <h3>My posts</h3>

      <div id="myPosts">
        Loading...
      </div>

    </div>

  `;


  loadMyPosts();

}


async function loadMyPosts(){

  const box =
    $("myPosts");


  const {data,error} =
    await sb
      .from("posts")
      .select("*")
      .eq("user_id",currentUser.id)
      .order("created_at",{ascending:false});


  if(error){

    box.innerHTML =
      `<p class="muted">${esc(error.message)}</p>`;

    return;
  }


  if(!data?.length){

    box.innerHTML =
      `<p class="muted">No posts yet.</p>`;

    return;
  }


  box.innerHTML =
    data.map(post=>`

      <div class="card">

        ${
          post.media_type === "video"

          ? `
            <video
              class="product-image"
              controls
              src="${esc(post.media_url)}"
            ></video>
          `

          : `
            <img
              class="product-image"
              src="${esc(post.media_url)}"
              alt=""
            >
          `
        }

        <p>
          ${esc(post.caption || "")}
        </p>

      </div>

    `).join("");

}


/* =========================================================
   EDIT PROFILE
   ========================================================= */

function editProfile(){

  openModal(`

    <h2>Edit profile</h2>

    <input
      id="editName"
      class="input"
      placeholder="Full name"
    >

    <input
      id="editUsername"
      class="input"
      placeholder="Username"
    >

    <textarea
      id="editBio"
      class="input"
      placeholder="Bio"
    ></textarea>

    <input
      id="editAvatar"
      class="input"
      placeholder="Avatar image URL"
    >

    <button
      class="btn primary full"
      onclick="saveProfile()"
    >
      Save
    </button>

  `);


  loadEditValues();

}


async function loadEditValues(){

  const {data} =
    await sb
      .from("profiles")
      .select(
        "full_name,username,bio,avatar_url"
      )
      .eq("id",currentUser.id)
      .maybeSingle();


  if(!data){
    return;
  }


  $("editName").value =
    data.full_name || "";


  $("editUsername").value =
    data.username || "";


  $("editBio").value =
    data.bio || "";


  $("editAvatar").value =
    data.avatar_url || "";

}


window.editProfile =
  editProfile;


async function saveProfile(){

  const update = {

    full_name:
      $("editName").value.trim(),

    username:
      $("editUsername").value.trim(),

    bio:
      $("editBio").value.trim(),

    avatar_url:
      $("editAvatar").value.trim(),

    updated_at:
      new Date().toISOString()

  };


  const {error} =
    await sb
      .from("profiles")
      .update(update)
      .eq("id",currentUser.id);


  if(error){

    toast(error.message);

    return;
  }


  closeModal();

  loadMyProfile();

  toast("Profile updated.");

}


window.saveProfile =
  saveProfile;


/* =========================================================
   WALLET
   ========================================================= */

async function openWallet(){

  const {data,error} =
    await sb
      .from("wallets")
      .select(
        "coin_balance,etb_balance"
      )
      .eq("user_id",currentUser.id)
      .maybeSingle();


  if(error){

    toast(error.message);

    return;
  }


  const wallet =
    data || {
      coin_balance:0,
      etb_balance:0
    };


  openModal(`

    <h2>Wallet</h2>

    <div class="stats">

      <div class="stat">
        <strong>
          ${Number(
            wallet.coin_balance || 0
          ).toLocaleString()}
        </strong>
        <small>Coins</small>
      </div>

      <div class="stat">
        <strong>
          ${money(wallet.etb_balance)}
        </strong>
        <small>ETB</small>
      </div>

      <div class="stat">
        <strong>
          10 ETB
        </strong>
        <small>Minimum withdrawal</small>
      </div>

    </div>

    <div class="notice">

      1 coin = 0.50 ETB.

      <br><br>

      Real deposits and withdrawals must be processed by the secure payment backend.

    </div>

    <button
      class="btn primary full"
      onclick="openCoinShop()"
    >
      🪙 Buy Coins
    </button>

    <button
      class="btn secondary full"
      onclick="openWithdraw()"
    >
      Withdraw
    </button>

  `);

}


window.openWallet =
  openWallet;


/* =========================================================
   COIN SHOP
   ========================================================= */

$("coinBtn").onclick =
  openCoinShop;


function openCoinShop(){

  openModal(`

    <h2>Coin shop</h2>

    <div class="notice">

      1 coin = 0.50 ETB

      <br>

      Gifts can range from 1 to 27,000 coins.

    </div>

    <button
      class="btn primary full"
      onclick="openDeposit()"
    >
      📲 Buy with Telebirr / M-Pesa
    </button>

  `);

}


window.openCoinShop =
  openCoinShop;


/* =========================================================
   DEPOSIT
   ========================================================= */

function openDeposit(){

  openModal(`

    <h2>Buy coins</h2>

    <p class="muted">
      Choose payment method.
    </p>

    <button
      class="btn primary full"
      onclick="requestPayment('Telebirr')"
    >
      Telebirr
    </button>

    <button
      class="btn secondary full"
      onclick="requestPayment('M-Pesa')"
    >
      M-Pesa
    </button>

    <div class="notice">

      Payment must be verified by the MENA backend before coins are added.

    </div>

  `);

}


window.openDeposit =
  openDeposit;


function requestPayment(method){

  closeModal();

  toast(
    method +
    " payment requires the secure payment backend."
  );

}


window.requestPayment =
  requestPayment;


/* =========================================================
   WITHDRAW
   ========================================================= */

function openWithdraw(){

  openModal(`

    <h2>Withdraw</h2>

    <p class="muted">
      Minimum withdrawal: 10 ETB
    </p>

    <input
      id="withdrawAmount"
      class="input"
      type="number"
      min="10"
      placeholder="Amount in ETB"
    >

    <button
      class="btn primary full"
      onclick="requestWithdraw()"
    >
      Continue
    </button>

  `);

}


window.openWithdraw =
  openWithdraw;


function requestWithdraw(){

  const amount =
    Number(
      $("withdrawAmount").value
    );


  if(amount < MENA.minimumWithdrawal){

    toast(
      "Minimum withdrawal is 10 ETB."
    );

    return;
  }


  closeModal();

  toast(
    "Withdrawal requires secure backend verification."
  );

}


window.requestWithdraw =
  requestWithdraw;


/* =========================================================
   MY MARKET
   ========================================================= */

function openMyMarket(){

  openModal(`

    <h2>My Market</h2>

    <button
      class="btn primary full"
      onclick="showMyListings()"
    >
      My active listings
    </button>

    <button
      class="btn secondary full"
      onclick="showMySold()"
    >
      Sold
    </button>

    <button
      class="btn secondary full"
      onclick="showMyBought()"
    >
      Bought
    </button>

    <button
      class="btn secondary full"
      onclick="showMyFreeWork()"
    >
      Free Work
    </button>

  `);

}


window.openMyMarket =
  openMyMarket;


async function showMyListings(){

  const {data,error} =
    await sb
      .from("marketplace_listings")
      .select("*")
      .eq("seller_id",currentUser.id)
      .eq("status","active")
      .order("created_at",{ascending:false});


  if(error){

    toast(error.message);

    return;
  }


  openModal(`

    <h2>My active listings</h2>

    ${
      data?.length

      ? data.map(p=>`

        <div class="card">

          <b>
            ${esc(p.title)}
          </b>

          <p class="price">
            ${money(p.price_etb)}
          </p>

        </div>

      `).join("")

      : `
        <p class="muted">
          No active listings.
        </p>
      `
    }

  `);

}


window.showMyListings =
  showMyListings;


async function showMySold(){

  openModal(`

    <h2>Sold</h2>

    <p class="muted">
      Your completed marketplace orders will appear here.
    </p>

  `);

}


window.showMySold =
  showMySold;


async function showMyBought(){

  openModal(`

    <h2>Bought</h2>

    <p class="muted">
      Your purchased products will appear here.
    </p>

  `);

}


window.showMyBought =
  showMyBought;


async function showMyFreeWork(){

  const {data,error} =
    await sb
      .from("free_work_posts")
      .select("*")
      .eq("user_id",currentUser.id)
      .order("created_at",{ascending:false});


  if(error){

    toast(error.message);

    return;
  }


  openModal(`

    <h2>My Free Work</h2>

    ${
      data?.length

      ? data.map(w=>`

        <div class="card">

          <b>${esc(w.title)}</b>

          <p>
            ${esc(w.description)}
          </p>

        </div>

      `).join("")

      : `
        <p class="muted">
          No Free Work posts.
        </p>
      `
    }

  `);

}


window.showMyFreeWork =
  showMyFreeWork;


/* =========================================================
   SETTINGS
   ========================================================= */

$("settingsBtn").onclick = ()=>{

  navigate("settings");

};


$("editProfileBtn").onclick =
  editProfile;


$("walletBtn").onclick =
  openWallet;


$("marketSettingsBtn").onclick =
  openMyMarket;


$("logoutBtn").onclick =
  logout;


/* =========================================================
   SEARCH
   ========================================================= */

$("searchBtn").onclick = ()=>{

  $("searchPanel")
    .classList
    .toggle("hidden");

};


$("searchSubmit").onclick =
  searchAll;


async function searchAll(){

  const q =
    $("searchInput").value.trim();


  if(!q){

    $("searchResults").innerHTML = "";

    return;
  }


  $("searchResults").innerHTML = `
    <div class="result">
      Searching...
    </div>
  `;


  const [
    people,
    market,
    work
  ] = await Promise.all([

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
      .eq("status","active")
      .ilike("title",`%${q}%`)
      .limit(10),

    sb
      .from("free_work_posts")
      .select(
        "id,title,description"
      )
      .eq("status","active")
      .ilike("title",`%${q}%`)
      .limit(10)

  ]);


  $("searchResults").innerHTML = `

    <div class="result">

      <h3>People</h3>

      ${
        people.data?.length

        ? people.data.map(p=>`

          <div class="card">

            <b>
              ${esc(
                p.full_name ||
                p.username
              )}
            </b>

            <p class="muted">
              @${esc(p.username)}
            </p>

          </div>

        `).join("")

        : `
          <p class="muted">
            No people found.
          </p>
        `
      }

    </div>


    <div class="result">

      <h3>Marketplace</h3>

      ${
        market.data?.length

        ? market.data.map(p=>`

          <div class="card">

            <b>
              ${esc(p.title)}
            </b>

            <p class="price">
              ${money(p.price_etb)}
            </p>

          </div>

        `).join("")

        : `
          <p class="muted">
            No products found.
          </p>
        `
      }

    </div>


    <div class="result">

      <h3>Free Work</h3>

      ${
        work.data?.length

        ? work.data.map(w=>`

          <div class="card">

            <b>
              ${esc(w.title)}
            </b>

            <p>
              ${esc(w.description)}
            </p>

          </div>

        `).join("")

        : `
          <p class="muted">
            No work found.
          </p>
        `
      }

    </div>

  `;

}


/* =========================================================
   REFRESH
   ========================================================= */

$("refreshBtn").onclick =
  async ()=>{

    await loadPosts();

    renderHome();

    toast("Feed refreshed.");

  };


/* =========================================================
   SUPABASE AUTH SESSION
   ========================================================= */

async function init(){

  const {
    data
  } =
    await sb.auth.getSession();


  if(data?.session?.user){

    currentUser =
      data.session.user;

    await ensureProfile();

    await loadAll();

    showApp();

  }else{

    $("authPage")
      .classList
      .remove("hidden");

    $("appShell")
      .classList
      .add("hidden");

  }


  sb.auth.onAuthStateChange(
    async (_event,session)=>{

      if(session?.user){

        currentUser =
          session.user;

      }else{

        currentUser = null;

      }

    }
  );

}


/* =========================================================
   START
   ========================================================= */

init();
