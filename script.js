/* =========================================================
   MENA - NEW APP
   Step 3: Main JavaScript
   ========================================================= */

"use strict";

/* =========================================================
   MENA SETTINGS
   ========================================================= */

const MENA = {
  name: "MENA",

  sellerFeePercent: 5,

  deliveryFee: 80,

  coinValue: 0.5,

  minimumWithdrawal: 10,

  freeWorkFee: 50,

  freeWorkDays: 30
};


/* =========================================================
   APP STATE
   ========================================================= */

let currentPage = "homePage";

let installPrompt = null;


/* =========================================================
   SHORT HELPERS
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}

function all(selector) {
  return document.querySelectorAll(selector);
}


/* =========================================================
   START APP
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  setupNavigation();

  setupInstallApp();

  setupSearch();

  setupMarket();

  setupProfile();

  setupCreateButtons();

  showPage("homePage");

});


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

  all(".nav-item, .nav-create").forEach(function (button) {

    button.addEventListener("click", function () {

      const page =
        button.dataset.page;

      if (!page) return;

      showPage(page);

    });

  });

}


function showPage(pageId) {

  const pages =
    all(".page");

  pages.forEach(function (page) {

    page.classList.remove("active");

  });


  const target =
    $(pageId);

  if (target) {

    target.classList.add("active");

    currentPage = pageId;

  }


  all(".nav-item").forEach(function (item) {

    item.classList.remove("active");

  });


  const matchingNav =
    document.querySelector(
      `.nav-item[data-page="${pageId}"]`
    );

  if (matchingNav) {

    matchingNav.classList.add("active");

  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================================================
   INSTALL MENA APP
   ========================================================= */

function setupInstallApp() {

  window.addEventListener(
    "beforeinstallprompt",
    function (event) {

      event.preventDefault();

      installPrompt = event;

      const banner =
        $("installBanner");

      if (banner) {

        banner.classList.remove("hidden");

      }

    }
  );


  const installButton =
    $("installButton");


  if (installButton) {

    installButton.addEventListener(
      "click",
      async function () {

        if (!installPrompt) {

          alert(
            "Use your browser menu and choose 'Install app' or 'Add to Home screen'."
          );

          return;

        }


        installPrompt.prompt();

        const result =
          await installPrompt.userChoice;

        console.log(
          "MENA install:",
          result.outcome
        );

        installPrompt = null;

        const banner =
          $("installBanner");

        if (banner) {

          banner.classList.add("hidden");

        }

      }
    );

  }


  const closeInstall =
    $("closeInstall");


  if (closeInstall) {

    closeInstall.addEventListener(
      "click",
      function () {

        const banner =
          $("installBanner");

        if (banner) {

          banner.classList.add("hidden");

        }

      }
    );

  }

}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

  const searchButton =
    $("searchButton");


  if (searchButton) {

    searchButton.addEventListener(
      "click",
      function () {

        showPage("searchPage");

        setTimeout(function () {

          const input =
            $("globalSearch");

          if (input) {

            input.focus();

          }

        }, 100);

      }
    );

  }


  const globalSearchButton =
    $("globalSearchButton");


  if (globalSearchButton) {

    globalSearchButton.addEventListener(
      "click",
      performGlobalSearch
    );

  }


  const globalSearch =
    $("globalSearch");


  if (globalSearch) {

    globalSearch.addEventListener(
      "keydown",
      function (event) {

        if (event.key === "Enter") {

          performGlobalSearch();

        }

      }
    );

  }


  const marketSearchButton =
    $("marketSearchButton");


  if (marketSearchButton) {

    marketSearchButton.addEventListener(
      "click",
      performMarketSearch
    );

  }


  const marketSearch =
    $("marketSearch");


  if (marketSearch) {

    marketSearch.addEventListener(
      "keydown",
      function (event) {

        if (event.key === "Enter") {

          performMarketSearch();

        }

      }
    );

  }

}


function performGlobalSearch() {

  const input =
    $("globalSearch");

  if (!input) return;


  const query =
    input.value.trim();


  if (!query) {

    alert("Type something to search.");

    return;

  }


  const results =
    $("searchResults");

  if (!results) return;


  results.innerHTML = `

    <div class="empty-state">

      <div>🔎</div>

      <h3>Searching MENA</h3>

      <p>
        Search results will come from real MENA users,
        products and posts.
      </p>

    </div>

  `;

}


function performMarketSearch() {

  const input =
    $("marketSearch");

  if (!input) return;


  const query =
    input.value.trim();


  if (!query) {

    alert("Type a product name.");

    return;

  }


  console.log(
    "Market search:",
    query
  );

}


/* =========================================================
   MARKET
   ========================================================= */

function setupMarket() {

  setupMarketTabs();

  setupSellButtons();

}


function setupMarketTabs() {

  all(".market-tab").forEach(function (tab) {

    tab.addEventListener(
      "click",
      function () {

        all(".market-tab").forEach(
          function (item) {

            item.classList.remove("active");

          }
        );


        tab.classList.add("active");


        const type =
          tab.dataset.marketTab;

        loadMyMarket(type);

      }
    );

  });

}


function setupSellButtons() {

  const sellFromProfile =
    $("sellFromProfile");


  if (sellFromProfile) {

    sellFromProfile.addEventListener(
      "click",
      function () {

        requireLogin(
          "You need an account to sell a product."
        );

      }
    );

  }

}


/* =========================================================
   EXACT MARKET PRICE CALCULATION
   ========================================================= */

/*
   Seller enters the amount they want to RECEIVE.

   Example:

   Seller enters 950

   Buyer product price = 1000
   MENA fee             = 50
   Seller receives      = 950
   Delivery             = 80
   Buyer total          = 1080

   The buyer does NOT pay the 5% separately.
*/

function calculateMarketPrice(
  sellerAmount
) {

  const sellerPrice =
    Number(sellerAmount);


  if (
    !Number.isFinite(sellerPrice) ||
    sellerPrice <= 0
  ) {

    return {

      sellerReceive: 0,

      platformFee: 0,

      buyerProductPrice: 0,

      delivery: MENA.deliveryFee,

      buyerTotal: 0

    };

  }


  const buyerProductPrice =
    sellerPrice /
    (1 - MENA.sellerFeePercent / 100);


  const platformFee =
    buyerProductPrice -
    sellerPrice;


  const buyerPrice =
    Number(
      buyerProductPrice.toFixed(2)
    );


  const fee =
    Number(
      platformFee.toFixed(2)
    );


  const delivery =
    Number(
      MENA.deliveryFee.toFixed(2)
    );


  return {

    sellerReceive:
      Number(sellerPrice.toFixed(2)),

    platformFee:
      fee,

    buyerProductPrice:
      buyerPrice,

    delivery:
      delivery,

    buyerTotal:
      Number(
        (buyerPrice + delivery).toFixed(2)
      )

  };

}


/* =========================================================
   EXAMPLE MARKET CALCULATION
   ========================================================= */

console.log(
  "MENA 950 example:",
  calculateMarketPrice(950)
);


/* =========================================================
   PROFILE
   ========================================================= */

function setupProfile() {

  all(
    "[data-profile-action]"
  ).forEach(function (button) {

    button.addEventListener(
      "click",
      function () {

        const action =
          button.dataset.profileAction;

        handleProfileAction(action);

      }
    );

  });


  const editProfile =
    $("editProfileButton");


  if (editProfile) {

    editProfile.addEventListener(
      "click",
      function () {

        requireLogin(
          "You need an account to edit your profile."
        );

      }
    );

  }

}


function handleProfileAction(action) {

  switch (action) {

    case "coins":

      requireLogin(
        "You need an account to buy coins."
      );

      break;


    case "withdraw":

      requireLogin(
        "You need an account to withdraw."
      );

      break;


    case "market":

      loadMyMarket("active");

      break;


    case "work":

      requireLogin(
        "You need an account to use Free Work."
      );

      break;


    default:

      console.log(
        "Unknown profile action:",
        action
      );

  }

}


/* =========================================================
   MY MARKET
   ========================================================= */

function loadMyMarket(type) {

  const container =
    $("myMarketContent");

  if (!container) return;


  /*
     For now this is intentionally EMPTY.

     We will connect this to Supabase later.

     We will NOT create fake sellers,
     fake products, fake purchases,
     fake sales or fake money.
  */


  if (type === "active") {

    container.innerHTML = `

      <div class="empty-state small">

        <div>🛍️</div>

        <h3>No active products</h3>

        <p>
          Your real products will appear here
          after you sell on MENA.
        </p>

      </div>

    `;

    return;

  }


  if (type === "sold") {

    container.innerHTML = `

      <div class="empty-state small">

        <div>✅</div>

        <h3>No sold products</h3>

        <p>
          Products you sell will appear here.
        </p>

      </div>

    `;

    return;

  }


  if (type === "purchases") {

    container.innerHTML = `

      <div class="empty-state small">

        <div>📦</div>

        <h3>No purchases</h3>

        <p>
          Products you buy will appear here.
        </p>

      </div>

    `;

    return;

  }

}


/* =========================================================
   CREATE BUTTONS
   ========================================================= */

function setupCreateButtons() {

  all(
    ".create-card"
  ).forEach(function (button) {

    button.addEventListener(
      "click",
      function () {

        const action =
          button.dataset.action;

        handleCreateAction(action);

      }
    );

  });

}


function handleCreateAction(action) {

  switch (action) {

    case "post":

      requireLogin(
        "You need an account to create a post."
      );

      break;


    case "live":

      requireLogin(
        "You need an account to go live."
      );

      break;


    case "sell":

      requireLogin(
        "You need an account to sell a product."
      );

      break;


    case "work":

      requireLogin(
        "You need an account to post Free Work."
      );

      break;


    default:

      console.log(
        "Create action:",
        action
      );

  }

}


/* =========================================================
   LOGIN REQUIREMENT
   ========================================================= */

function requireLogin(message) {

  /*
     We will connect this to real Supabase Auth
     in the next backend stage.
  */

  const modal =
    $("authModal");


  if (modal) {

    modal.classList.remove("hidden");

  }


  console.log(
    "Login required:",
    message
  );

}


/* =========================================================
   CLOSE AUTH
   ========================================================= */

const closeAuth =
  $("closeAuth");


if (closeAuth) {

  closeAuth.addEventListener(
    "click",
    function () {

      const modal =
        $("authModal");

      if (modal) {

        modal.classList.add("hidden");

      }

    }
  );

}


/* =========================================================
   LOGIN FORM
   ========================================================= */

const loginForm =
  $("loginForm");


if (loginForm) {

  loginForm.addEventListener(
    "submit",
    function (event) {

      event.preventDefault();

      alert(
        "Real MENA login will be connected to Supabase next."
      );

    }
  );

}


/* =========================================================
   SIGNUP BUTTON
   ========================================================= */

const showSignup =
  $("showSignup");


if (showSignup) {

  showSignup.addEventListener(
    "click",
    function () {

      alert(
        "Real MENA signup will be connected to Supabase next."
      );

    }
  );

}


/* =========================================================
   PREVENT FAKE DATA
   ========================================================= */

/*
   Important:

   This new version does NOT create:

   - fake followers
   - fake likes
   - fake sellers
   - fake buyers
   - fake products
   - fake money
   - fake live users
   - fake purchases

   Real data will come from Supabase.
*/


/* =========================================================
   MENA READY
   ========================================================= */

console.log(
  "MENA new app JavaScript loaded successfully."
);