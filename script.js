/* =========================================================
   MENA APP
   STEP 5 — SUPABASE + REAL AUTHENTICATION
   ========================================================= */


/* =========================================================
   1. SUPABASE CONNECTION
   ========================================================= */

const SUPABASE_URL =
  "https://ryywkqyeoftuejczeqgg.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_E6S3EtoGbEqA_XkRpJhYpA_g8SvjMeH";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

console.log("MENA: Supabase connected");


/* =========================================================
   2. MENA SETTINGS
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
   3. APP STATE
   ========================================================= */

let currentPage = "homePage";
let currentUser = null;
let currentProfile = null;
let installPrompt = null;


/* =========================================================
   4. BASIC HELPERS
   ========================================================= */

function $(selector) {
  return document.querySelector(selector);
}

function all(selector) {
  return document.querySelectorAll(selector);
}

function showMessage(message, type = "info") {
  console.log(`[MENA ${type}]`, message);

  alert(message);
}


/* =========================================================
   5. START APP
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  console.log("MENA: App starting...");

  setupNavigation();

  setupInstallApp();

  setupSearch();

  setupMarket();

  setupProfile();

  setupCreateButtons();

  setupAuthButtons();

  await restoreSession();

  showPage("homePage");

  console.log("MENA: App ready.");
});


/* =========================================================
   6. PAGE NAVIGATION
   ========================================================= */

function setupNavigation() {

  all("[data-page]").forEach(button => {

    button.addEventListener("click", () => {

      const page = button.dataset.page;

      if (!page) return;

      showPage(page);
    });
  });
}


function showPage(pageId) {

  const pages = all(".page");

  pages.forEach(page => {
    page.classList.remove("active");
    page.style.display = "none";
  });

  const target = document.getElementById(pageId);

  if (!target) {
    console.warn("MENA: Page not found:", pageId);
    return;
  }

  target.classList.add("active");
  target.style.display = "block";

  currentPage = pageId;

  updateNavigation(pageId);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  console.log("MENA: Opened", pageId);
}


function updateNavigation(pageId) {

  all("[data-page]").forEach(button => {

    button.classList.remove("active");

    if (button.dataset.page === pageId) {
      button.classList.add("active");
    }
  });
}


/* =========================================================
   7. INSTALL APP
   ========================================================= */

function setupInstallApp() {

  window.addEventListener("beforeinstallprompt", event => {

    event.preventDefault();

    installPrompt = event;

    const banner = $("#installBanner");

    if (banner) {
      banner.style.display = "flex";
    }
  });


  const installButton = $("#installApp");

  if (installButton) {

    installButton.addEventListener("click", async () => {

      if (!installPrompt) {
        showMessage(
          "MENA install is not available yet. Open the app in Chrome and try again."
        );
        return;
      }

      installPrompt.prompt();

      const result = await installPrompt.userChoice;

      console.log(
        "MENA install result:",
        result.outcome
      );

      installPrompt = null;

      const banner = $("#installBanner");

      if (banner) {
        banner.style.display = "none";
      }
    });
  }


  const closeInstall = $("#closeInstall");

  if (closeInstall) {

    closeInstall.addEventListener("click", () => {

      const banner = $("#installBanner");

      if (banner) {
        banner.style.display = "none";
      }
    });
  }
}


/* =========================================================
   8. SEARCH
   ========================================================= */

function setupSearch() {

  const globalSearch = $("#globalSearch");

  if (globalSearch) {

    globalSearch.addEventListener("keydown", event => {

      if (event.key !== "Enter") return;

      const value = globalSearch.value.trim();

      if (!value) return;

      openSearch(value);
    });
  }


  const searchButton = $("#searchButton");

  if (searchButton) {

    searchButton.addEventListener("click", () => {

      const value = globalSearch
        ? globalSearch.value.trim()
        : "";

      if (!value) {
        showPage("searchPage");
        return;
      }

      openSearch(value);
    });
  }


  const marketSearch = $("#marketSearch");

  if (marketSearch) {

    marketSearch.addEventListener("input", () => {

      filterMarketProducts(
        marketSearch.value.trim()
      );
    });
  }
}


function openSearch(query) {

  showPage("searchPage");

  const searchInput = $("#searchPageInput");

  if (searchInput) {
    searchInput.value = query;
  }

  const resultText = $("#searchResultText");

  if (resultText) {
    resultText.textContent =
      `Search results for "${query}"`;
  }

  console.log("MENA search:", query);
}


function filterMarketProducts(query) {

  const products = all(".market-product");

  if (!products.length) return;

  const search = query.toLowerCase();

  products.forEach(product => {

    const text =
      product.textContent.toLowerCase();

    product.style.display =
      !search || text.includes(search)
        ? ""
        : "none";
  });
}


/* =========================================================
   9. MARKET
   ========================================================= */

function setupMarket() {

  all("[data-market-tab]").forEach(button => {

    button.addEventListener("click", () => {

      const tab = button.dataset.marketTab;

      all("[data-market-tab]").forEach(item => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      console.log("MENA market tab:", tab);
    });
  });


  const sellButton = $("#sellButton");

  if (sellButton) {

    sellButton.addEventListener("click", () => {

      requireLogin(() => {
        showPage("createPage");
      });
    });
  }


  loadMarket();
}


async function loadMarket() {

  /*
    We intentionally do not create fake products.

    Real marketplace products will be loaded from Supabase
    after the marketplace tables/RLS are connected.
  */

  console.log(
    "MENA: Marketplace ready for real Supabase products."
  );
}


/* =========================================================
   10. MARKET PRICE CALCULATION
   ========================================================= */

function calculateMarketPrice(sellerAmount) {

  const sellerPrice = Number(sellerAmount);

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


  /*
    Seller wants to receive 950 ETB.

    MENA keeps 5%.

    Buyer product price:
    950 / 0.95 = 1000 ETB

    MENA fee:
    1000 - 950 = 50 ETB

    Delivery:
    80 ETB

    Buyer total:
    1000 + 80 = 1080 ETB
  */

  const buyerProductPrice =
    sellerPrice /
    (1 - MENA.sellerFeePercent / 100);

  const platformFee =
    buyerProductPrice - sellerPrice;

  const buyerPrice =
    Number(buyerProductPrice.toFixed(2));

  const fee =
    Number(platformFee.toFixed(2));

  const delivery =
    Number(MENA.deliveryFee.toFixed(2));

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
   11. CREATE BUTTONS
   ========================================================= */

function setupCreateButtons() {

  const createButtons = all(
    "[data-create-action]"
  );

  createButtons.forEach(button => {

    button.addEventListener("click", () => {

      const action =
        button.dataset.createAction;

      handleCreateAction(action);
    });
  });
}


function handleCreateAction(action) {

  requireLogin(() => {

    switch (action) {

      case "post":
        showPage("createPage");
        console.log("MENA: Create post");
        break;

      case "live":
        showPage("createPage");
        console.log("MENA: Start live");
        break;

      case "sell":
        showPage("createPage");
        console.log("MENA: Sell product");
        break;

      case "free-work":
        showPage("createPage");
        console.log("MENA: Free Work");
        break;

      default:
        console.warn(
          "Unknown create action:",
          action
        );
    }
  });
}


/* =========================================================
   12. PROFILE
   ========================================================= */

function setupProfile() {

  const profileButton = $("#profileButton");

  if (profileButton) {

    profileButton.addEventListener("click", () => {

      showPage("profilePage");

      if (currentUser) {
        loadProfile();
      }
    });
  }


  const buyCoins = $("#buyCoins");

  if (buyCoins) {

    buyCoins.addEventListener("click", () => {

      requireLogin(() => {

        console.log(
          "MENA: Buy Coins opened"
        );

        showMessage(
          "Coin purchase will be connected to the real payment system in the next backend step."
        );
      });
    });
  }


  const withdraw = $("#withdrawButton");

  if (withdraw) {

    withdraw.addEventListener("click", () => {

      requireLogin(() => {

        console.log(
          "MENA: Withdrawal opened"
        );

        showMessage(
          `Minimum withdrawal is ${MENA.minimumWithdrawal} ETB.`
        );
      });
    });
  }


  const myMarket = $("#myMarketButton");

  if (myMarket) {

    myMarket.addEventListener("click", () => {

      requireLogin(() => {

        showPage("profilePage");

        loadMyMarket();
      });
    });
  }


  const freeWork = $("#freeWorkButton");

  if (freeWork) {

    freeWork.addEventListener("click", () => {

      requireLogin(() => {

        showPage("profilePage");

        loadMyMarket();
      });
    });
  }


  all("[data-my-market-tab]").forEach(button => {

    button.addEventListener("click", () => {

      const tab =
        button.dataset.myMarketTab;

      all("[data-my-market-tab]")
        .forEach(item => {
          item.classList.remove("active");
        });

      button.classList.add("active");

      loadMyMarket(tab);
    });
  });
}


/* =========================================================
   13. LOAD USER PROFILE
   ========================================================= */

async function loadProfile() {

  if (!currentUser) {
    return;
  }

  console.log(
    "MENA: Loading profile:",
    currentUser.id
  );


  const { data, error } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();


  if (error) {

    console.error(
      "MENA profile error:",
      error
    );

    return;
  }


  currentProfile = data;


  if (!data) {

    console.log(
      "MENA: No profile row found yet."
    );

    return;
  }


  updateProfileUI(data);
}


function updateProfileUI(profile) {

  if (!profile) return;


  const nameElements = all(
    "[data-profile-name]"
  );

  nameElements.forEach(element => {

    element.textContent =
      profile.full_name ||
      profile.username ||
      "MENA User";
  });


  const usernameElements = all(
    "[data-profile-username]"
  );

  usernameElements.forEach(element => {

    element.textContent =
      profile.username
        ? `@${profile.username}`
        : "";
  });


  const avatarElements = all(
    "[data-profile-avatar]"
  );

  avatarElements.forEach(element => {

    if (profile.avatar_url) {

      element.src =
        profile.avatar_url;

      element.style.display = "block";
    }
  });
}


/* =========================================================
   14. MY MARKET
   ========================================================= */

async function loadMyMarket(tab = "active") {

  if (!currentUser) {
    return;
  }

  console.log(
    "MENA: Loading My Market:",
    tab
  );


  /*
    Important:

    No fake products.
    No fake purchases.
    No fake sold items.

    These will be read from the real marketplace
    tables after the marketplace backend is connected.
  */


  const container =
    $("#myMarketContent");

  if (!container) return;


  container.innerHTML = `
    <div class="empty-state">
      <h3>No ${escapeHtml(tab)} items yet</h3>
      <p>Your real MENA marketplace activity will appear here.</p>
    </div>
  `;
}


/* =========================================================
   15. AUTHENTICATION
   ========================================================= */

function setupAuthButtons() {

  /*
    LOGIN FORM
  */

  const loginForm =
    $("#loginForm");

  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      handleLogin
    );
  }


  /*
    SIGNUP FORM
  */

  const signupForm =
    $("#signupForm");

  if (signupForm) {

    signupForm.addEventListener(
      "submit",
      handleSignup
    );
  }


  /*
    CLOSE AUTH MODAL
  */

  const closeAuth =
    $("#closeAuth");

  if (closeAuth) {

    closeAuth.addEventListener(
      "click",
      closeAuthModal
    );
  }


  /*
    SWITCH TO SIGNUP
  */

  const signupButton =
    $("#signupButton");

  if (signupButton) {

    signupButton.addEventListener(
      "click",
      showSignupForm
    );
  }


  /*
    SWITCH TO LOGIN
  */

  const loginButton =
    $("#loginButton");

  if (loginButton) {

    loginButton.addEventListener(
      "click",
      showLoginForm
    );
  }


  /*
    LOGOUT
  */

  const logoutButton =
    $("#logoutButton");

  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      logoutUser
    );
  }
}


/* =========================================================
   16. SHOW LOGIN
   ========================================================= */

function showLoginForm() {

  const modal =
    $("#authModal");

  if (!modal) return;

  modal.style.display = "flex";


  const loginForm =
    $("#loginForm");

  const signupForm =
    $("#signupForm");

  if (loginForm) {
    loginForm.style.display = "block";
  }

  if (signupForm) {
    signupForm.style.display = "none";
  }
}


/* =========================================================
   17. SHOW SIGNUP
   ========================================================= */

function showSignupForm() {

  const modal =
    $("#authModal");

  if (!modal) return;

  modal.style.display = "flex";


  const loginForm =
    $("#loginForm");

  const signupForm =
    $("#signupForm");

  if (loginForm) {
    loginForm.style.display = "none";
  }

  if (signupForm) {
    signupForm.style.display = "block";
  }
}


/* =========================================================
   18. CLOSE AUTH
   ========================================================= */

function closeAuthModal() {

  const modal =
    $("#authModal");

  if (modal) {
    modal.style.display = "none";
  }
}


/* =========================================================
   19. REQUIRE LOGIN
   ========================================================= */

function requireLogin(callback) {

  if (currentUser) {

    if (typeof callback === "function") {
      callback();
    }

    return;
  }


  showLoginForm();

  console.log(
    "MENA: Login required."
  );
}


/* =========================================================
   20. REAL SIGNUP
   ========================================================= */

async function handleSignup(event) {

  event.preventDefault();


  const fullNameInput =
    $("#signupFullName");

  const usernameInput =
    $("#signupUsername");

  const emailInput =
    $("#signupEmail");

  const passwordInput =
    $("#signupPassword");


  const fullName =
    fullNameInput
      ? fullNameInput.value.trim()
      : "";


  const username =
    usernameInput
      ? usernameInput.value.trim()
      : "";


  const email =
    emailInput
      ? emailInput.value.trim()
      : "";


  const password =
    passwordInput
      ? passwordInput.value
      : "";


  if (!fullName) {

    showMessage(
      "Please enter your full name."
    );

    return;
  }


  if (!username) {

    showMessage(
      "Please enter a username."
    );

    return;
  }


  if (!email) {

    showMessage(
      "Please enter your email."
    );

    return;
  }


  if (!password) {

    showMessage(
      "Please enter a password."
    );

    return;
  }


  if (password.length < 6) {

    showMessage(
      "Password must be at least 6 characters."
    );

    return;
  }


  const submitButton =
    event.submitter;


  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent =
      "Creating account...";
  }


  console.log(
    "MENA: Creating account..."
  );


  try {

    const { data, error } =
      await supabase.auth.signUp({

        email: email,

        password: password,

        options: {

          data: {

            full_name:
              fullName,

            username:
              username
          }
        }
      });


    if (error) {

      console.error(
        "MENA signup error:",
        error
      );

      showMessage(
        error.message,
        "error"
      );

      return;
    }


    console.log(
      "MENA signup successful:",
      data
    );


    /*
      Supabase may require email confirmation.

      If email confirmation is enabled,
      a user can be created without an active session
      until the email is confirmed.
    */

    if (
      data.user &&
      !data.session
    ) {

      showMessage(
        "Account created. Please check your email and confirm your account before logging in."
      );

      showLoginForm();

      return;
    }


    if (data.session) {

      currentUser =
        data.session.user;

      await loadProfile();

      closeAuthModal();

      showPage("profilePage");

      showMessage(
        "Welcome to MENA!"
      );
    }

  } catch (error) {

    console.error(
      "MENA signup exception:",
      error
    );

    showMessage(
      "Something went wrong while creating your account.",
      "error"
    );

  } finally {

    if (submitButton) {

      submitButton.disabled =
        false;

      submitButton.textContent =
        "Create Account";
    }
  }
}


/* =========================================================
   21. REAL LOGIN
   ========================================================= */

async function handleLogin(event) {

  event.preventDefault();


  const emailInput =
    $("#loginEmail");

  const passwordInput =
    $("#loginPassword");


  const email =
    emailInput
      ? emailInput.value.trim()
      : "";


  const password =
    passwordInput
      ? passwordInput.value
      : "";


  if (!email) {

    showMessage(
      "Please enter your email."
    );

    return;
  }


  if (!password) {

    showMessage(
      "Please enter your password."
    );

    return;
  }


  const submitButton =
    event.submitter;


  if (submitButton) {

    submitButton.disabled =
      true;

    submitButton.textContent =
      "Logging in...";
  }


  try {

    const { data, error } =
      await supabase.auth.signInWithPassword({

        email: email,

        password: password
      });


    if (error) {

      console.error(
        "MENA login error:",
        error
      );

      showMessage(
        error.message,
        "error"
      );

      return;
    }


    currentUser =
      data.user;


    console.log(
      "MENA: Login successful:",
      currentUser.id
    );


    await loadProfile();

    closeAuthModal();

    showPage("profilePage");

    showMessage(
      "Welcome back to MENA!"
    );

  } catch (error) {

    console.error(
      "MENA login exception:",
      error
    );

    showMessage(
      "Something went wrong while logging in.",
      "error"
    );

  } finally {

    if (submitButton) {

      submitButton.disabled =
        false;

      submitButton.textContent =
        "Login";
    }
  }
}


/* =========================================================
   22. RESTORE EXISTING SESSION
   ========================================================= */

async function restoreSession() {

  try {

    const {
      data,
      error
    } =
      await supabase.auth.getSession();


    if (error) {

      console.error(
        "MENA session error:",
        error
      );

      return;
    }


    if (data.session) {

      currentUser =
        data.session.user;

      console.log(
        "MENA: Existing session restored."
      );

      await loadProfile();

    } else {

      currentUser = null;

      console.log(
        "MENA: No user logged in."
      );
    }


  } catch (error) {

    console.error(
      "MENA session exception:",
      error
    );
  }


  /*
    Listen for future login/logout changes.
  */

  supabase.auth.onAuthStateChange(
    async (event, session) => {

      console.log(
        "MENA auth event:",
        event
      );


      if (session) {

        currentUser =
          session.user;

        await loadProfile();

      } else {

        currentUser = null;

        currentProfile = null;
      }
    }
  );
}


/* =========================================================
   23. LOGOUT
   ========================================================= */

async function logoutUser() {

  try {

    const { error } =
      await supabase.auth.signOut();


    if (error) {

      console.error(
        "MENA logout error:",
        error
      );

      showMessage(
        error.message,
        "error"
      );

      return;
    }


    currentUser = null;

    currentProfile = null;


    showPage("homePage");


    showMessage(
      "You have been logged out."
    );


  } catch (error) {

    console.error(
      "MENA logout exception:",
      error
    );

    showMessage(
      "Logout failed.",
      "error"
    );
  }
}


/* =========================================================
   24. HTML SAFETY HELPER
   ========================================================= */

function escapeHtml(value) {

  if (value === null ||
      value === undefined) {

    return "";
  }


  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   25. DEBUG INFORMATION
   ========================================================= */

console.log(
  "MENA configuration:",
  {
    sellerFee:
      `${MENA.sellerFeePercent}%`,

    delivery:
      `${MENA.deliveryFee} ETB`,

    coinValue:
      `${MENA.coinValue} ETB`,

    minimumWithdrawal:
      `${MENA.minimumWithdrawal} ETB`,

    freeWorkFee:
      `${MENA.freeWorkFee} ETB`,

    freeWorkDays:
      MENA.freeWorkDays
  }
);


/* =========================================================
   END OF STEP 5
   ========================================================= */

