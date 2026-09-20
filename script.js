/* =====================================================
   MENA — MAIN JAVASCRIPT
   ===================================================== */


/* =====================================================
   DATA
   ===================================================== */

const posts = [
  {
    user: "Abel Tech",
    avatar: "👨‍💻",
    time: "2 hours ago",
    text: "Welcome to MENA 🚀 Connect, discover and grow together.",
    image: "🚀",
    likes: 128
  },

  {
    user: "Hana Fashion",
    avatar: "👩🏻",
    time: "4 hours ago",
    text: "New products are available in MENA Market 🛍️",
    image: "👗",
    likes: 86
  },

  {
    user: "Dawit",
    avatar: "👨🏻",
    time: "6 hours ago",
    text: "Building something new with MENA. 🇪🇹",
    image: "🇪🇹",
    likes: 54
  }
];


const products = [
  {
    name: "Samsung Phone",
    price: "12,500 ETB",
    seller: "Dawit",
    phone: "0912345678",
    location: "Addis Ababa",
    description: "Good condition Samsung phone. Ready for use.",
    image: "📱"
  },

  {
    name: "Fashion Shoes",
    price: "1,800 ETB",
    seller: "Hana",
    phone: "0923456789",
    location: "Bole",
    description: "New fashion shoes. Different sizes available.",
    image: "👟"
  },

  {
    name: "Laptop",
    price: "28,000 ETB",
    seller: "Abel",
    phone: "0934567890",
    location: "Addis Ababa",
    description: "Good laptop for work, school and online business.",
    image: "💻"
  },

  {
    name: "Smart Watch",
    price: "2,500 ETB",
    seller: "Selam",
    phone: "0945678901",
    location: "Piassa",
    description: "Modern smart watch with multiple features.",
    image: "⌚"
  }
];


/* =====================================================
   LOAD HOME FEED
   ===================================================== */

function loadFeed() {

  const feed = document.getElementById("feed");

  if (!feed) {
    return;
  }

  feed.innerHTML = "";

  posts.forEach((post, index) => {

    feed.innerHTML += `
      <article class="post">

        <div class="post-header">

          <div class="avatar">
            ${post.avatar}
          </div>

          <div>
            <b>${escapeHTML(post.user)}</b>

            <div class="small-text">
              ${post.time}
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
            ❤️ Like
          </button>

          <button onclick="commentPost(${index})">
            💬 Comment
          </button>

          <button onclick="sharePost(${index})">
            ↗ Share
          </button>

          <span class="like-count" id="likes-${index}">
            ${post.likes} likes
          </span>

        </div>

      </article>
    `;
  });
}


/* =====================================================
   LOAD PRODUCTS
   ===================================================== */

function loadProducts() {

  const grid = document.getElementById("productGrid");

  if (!grid) {
    return;
  }

  grid.innerHTML = "";

  products.forEach((product, index) => {

    grid.innerHTML += `
      <div class="product">

        <div class="product-image">
          ${product.image}
        </div>

        <div class="product-info">

          <h3>
            ${escapeHTML(product.name)}
          </h3>

          <div class="price">
            ${escapeHTML(product.price)}
          </div>

          <div class="location">
            📍 ${escapeHTML(product.location)}
          </div>

          <button
            class="view"
            onclick="viewProduct(${index})"
          >
            View Details
          </button>

        </div>

      </div>
    `;
  });
}


/* =====================================================
   PAGE NAVIGATION
   ===================================================== */

function openPage(pageId, button) {

  document
    .querySelectorAll(".page")
    .forEach(page => {
      page.classList.remove("active");
    });


  const page = document.getElementById(pageId);

  if (page) {
    page.classList.add("active");
  }


  document
    .querySelectorAll(".nav")
    .forEach(nav => {
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


/* =====================================================
   MARKET TABS
   ===================================================== */

function showMarketTab(type, button) {

  document
    .querySelectorAll(".market-tabs button")
    .forEach(btn => {
      btn.classList.remove("active");
    });


  if (button) {
    button.classList.add("active");
  }


  const productsTab =
    document.getElementById("productsTab");

  const jobsTab =
    document.getElementById("jobsTab");


  if (type === "products") {

    productsTab.classList.remove("hidden");

    jobsTab.classList.add("hidden");

  } else {

    productsTab.classList.add("hidden");

    jobsTab.classList.remove("hidden");
  }
}


/* =====================================================
   VIEW PRODUCT
   ===================================================== */

function viewProduct(index) {

  const product = products[index];

  if (!product) {
    return;
  }


  document.getElementById("productImage").textContent =
    product.image;

  document.getElementById("productName").textContent =
    product.name;

  document.getElementById("productPrice").textContent =
    product.price;

  document.getElementById("productSeller").textContent =
    product.seller;

  document.getElementById("productPhone").textContent =
    product.phone;

  document.getElementById("productLocation").textContent =
    product.location;

  document.getElementById("productDescription").textContent =
    product.description;


  document
    .getElementById("productModal")
    .classList.add("show");
}


/* =====================================================
   CLOSE MODAL
   ===================================================== */

function closeModal(id) {

  const modal = document.getElementById(id);

  if (modal) {
    modal.classList.remove("show");
  }
}


/* Close modal when clicking outside */

document.addEventListener("click", function(event) {

  const modal =
    document.getElementById("productModal");

  if (
    modal &&
    event.target === modal
  ) {
    modal.classList.remove("show");
  }

});


/* =====================================================
   CONTACT SELLER
   ===================================================== */

function contactSeller() {

  const phone =
    document.getElementById("productPhone").textContent;

  if (!phone) {
    return;
  }

  alert(
    "Seller phone:\n\n" + phone
  );
}


/* =====================================================
   CREATE POST
   ===================================================== */

function createPost() {

  const text = prompt(
    "Write your MENA post:"
  );


  if (!text || !text.trim()) {
    return;
  }


  posts.unshift({

    user: "See Future",

    avatar: "👨‍💻",

    time: "Just now",

    text: text.trim(),

    image: "MENA",

    likes: 0

  });


  loadFeed();


  openPage(
    "homePage",
    document.querySelector(".nav")
  );


  alert(
    "✅ Your post was created!"
  );
}


/* =====================================================
   LIKE POST
   ===================================================== */

function likePost(index) {

  if (!posts[index]) {
    return;
  }


  posts[index].likes++;


  const likes =
    document.getElementById(
      "likes-" + index
    );


  if (likes) {

    likes.textContent =
      posts[index].likes + " likes";
  }
}


/* =====================================================
   COMMENT
   ===================================================== */

function commentPost(index) {

  const comment = prompt(
    "Write your comment:"
  );


  if (!comment || !comment.trim()) {
    return;
  }


  alert(
    "💬 Comment added:\n\n" +
    comment.trim()
  );
}


/* =====================================================
   SHARE
   ===================================================== */

function sharePost(index) {

  if (
    navigator.share &&
    posts[index]
  ) {

    navigator.share({
      title: "MENA",
      text: posts[index].text
    }).catch(() => {});

  } else {

    alert(
      "↗ Post shared successfully!"
    );
  }
}


/* =====================================================
   START LIVE
   ===================================================== */

function startLive() {

  alert(
    "🔴 MENA Live\n\n" +
    "Live streaming is currently in demo mode.\n\n" +
    "Real live streaming will require a server and streaming service."
  );
}


/* =====================================================
   POST JOB
   ===================================================== */

function postJob() {

  const title = prompt(
    "Enter the job title:"
  );


  if (!title || !title.trim()) {
    return;
  }


  const location = prompt(
    "Enter the job location:"
  );


  if (!location || !location.trim()) {
    return;
  }


  const payment = prompt(
    "Enter payment amount:"
  );


  if (!payment || !payment.trim()) {
    return;
  }


  alert(
    "✅ Job created in demo mode!\n\n" +

    "Job: " +
    title.trim() +

    "\nLocation: " +
    location.trim() +

    "\nPayment: " +
    payment.trim() +
    " ETB"
  );
}


/* =====================================================
   TELEBIRR
   ===================================================== */

function connectTelebirr() {

  const phone = prompt(
    "Enter your Telebirr phone number:"
  );


  if (!phone || !phone.trim()) {
    return;
  }


  document.getElementById(
    "telebirrPhone"
  ).textContent =
    "Telebirr: " + phone.trim();


  alert(
    "✅ Telebirr connected in demo mode."
  );
}


/* =====================================================
   DEPOSIT
   ===================================================== */

function depositMoney() {

  const amount = Number(
    prompt(
      "Enter deposit amount in ETB:"
    )
  );


  if (!amount || amount <= 0) {

    alert(
      "Please enter a valid amount."
    );

    return;
  }


  alert(
    "💰 Demo deposit\n\n" +
    amount +
    " ETB"
  );
}


/* =====================================================
   WITHDRAW
   ===================================================== */

function withdrawMoney() {

  const amount = Number(
    prompt(
      "Enter withdrawal amount in ETB:"
    )
  );


  if (!amount || amount <= 0) {

    alert(
      "Please enter a valid amount."
    );

    return;
  }


  if (amount < 10) {

    alert(
      "⚠️ Minimum withdrawal is 10 ETB."
    );

    return;
  }


  alert(
    "✅ Withdrawal request created in demo mode.\n\n" +
    "Amount: " +
    amount +
    " ETB"
  );
}


/* =====================================================
   GIFTS
   ===================================================== */

function sendGift(name, coins) {

  alert(
    "🎁 Gift sent!\n\n" +
    name +
    "\n" +
    coins +
    " coins"
  );
}


/* =====================================================
   SEARCH
   ===================================================== */

const searchInput =
  document.getElementById("mainSearch");


if (searchInput) {

  searchInput.addEventListener(
    "input",
    function() {

      const search =
        this.value
          .toLowerCase()
          .trim();


      if (!search) {

        loadFeed();

        return;
      }


      const results =
        posts.filter(post =>
          post.user
            .toLowerCase()
            .includes(search) ||

          post.text
            .toLowerCase()
            .includes(search)
        );


      const feed =
        document.getElementById("feed");


      if (!feed) {
        return;
      }


      feed.innerHTML = "";


      if (results.length === 0) {

        feed.innerHTML = `
          <div class="profile-card">
            <h2>
              🔎 No results
            </h2>

            <p>
              We couldn't find anything matching "${escapeHTML(search)}".
            </p>
          </div>
        `;

        return;
      }


      results.forEach(post => {

        feed.innerHTML += `
          <article class="post">

            <div class="post-header">

              <div class="avatar">
                ${post.avatar}
              </div>

              <div>
                <b>
                  ${escapeHTML(post.user)}
                </b>

                <div class="small-text">
                  ${post.time}
                </div>
              </div>

            </div>

            <div class="post-content">
              ${escapeHTML(post.text)}
            </div>

            <div class="post-image">
              ${post.image}
            </div>

          </article>
        `;
      });

    }
  );
}


/* =====================================================
   SECURITY HELPER
   ===================================================== */

function escapeHTML(text) {

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =====================================================
   START MENA
   ===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    loadFeed();

    loadProducts();

  }
);
