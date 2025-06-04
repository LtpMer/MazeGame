(() => {
  const adminUsername = "LtpMer";

  // Keys for localStorage
  const USERS_KEY = "maze_users";
  const WIN_STATS_KEY = "maze_winStats";
  const CURRENT_USER_KEY = "maze_currentUser";

  let currentUser = null;

  const loginBtn = document.getElementById("loginBtn");
  const usernameInput = document.getElementById("usernameInput");
  const passwordInput = document.getElementById("passwordInput");
  const loginStatus = document.getElementById("loginStatus");
  const usersList = document.getElementById("usersList");

  // Load users from localStorage
  function loadUsers() {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  }

  // Save users to localStorage
  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // Load win stats
  function getWinStats() {
    const raw = localStorage.getItem(WIN_STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  }

  // Save win stats
  function setWinStats(stats) {
    localStorage.setItem(WIN_STATS_KEY, JSON.stringify(stats));
  }

  // Increment wins for a user
  function incrementWinStat(user) {
    if (!user) return;
    const stats = getWinStats();
    stats[user] = (stats[user] || 0) + 1;
    setWinStats(stats);
    updateLeaderboard();
  }

  // Update the leaderboard display
  function updateLeaderboard() {
    const users = loadUsers();
    const stats = getWinStats();
    usersList.innerHTML = "";

    if (!currentUser) {
      usersList.textContent = "Please login to see leaderboard.";
      return;
    }

    Object.entries(users).forEach(([user, pass]) => {
      const div = document.createElement("div");
      div.textContent = user;

      if (user === adminUsername) {
        div.classList.add("admin");
      }

      // Show passwords only if current user is admin
      if (currentUser === adminUsername) {
        div.textContent += ` — pass: ${pass}`;
      }

      // Show win count for all users
      if (stats[user]) {
        div.textContent += ` | Wins: ${stats[user]}`;
      }

      usersList.appendChild(div);
    });
  }

  // Handle login button click
  loginBtn.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      loginStatus.textContent = "Please enter username and password.";
      return;
    }

    const users = loadUsers();

    if (users[username]) {
      // Existing user - check password
      if (users[username] === password) {
        currentUser = username;
        loginStatus.textContent = `Welcome back, ${username}!`;
      } else {
        loginStatus.textContent = "Wrong password.";
        return;
      }
    } else {
      // New user registration
      users[username] = password;
      saveUsers(users);
      currentUser = username;
      loginStatus.textContent = `Registered and logged in as ${username}.`;
    }

    localStorage.setItem(CURRENT_USER_KEY, currentUser);
    updateLeaderboard();
  });

  // Try to auto-login user from localStorage on page load
  function tryAutoLogin() {
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    const users = loadUsers();

    if (savedUser && users[savedUser]) {
      currentUser = savedUser;
      loginStatus.textContent = `Welcome back, ${currentUser}!`;
      updateLeaderboard();
    }
  }

  // Call auto-login on script start
  tryAutoLogin();

  // Example usage: incrementWinStat(currentUser); when player wins

  // Expose incrementWinStat to global for usage in game code
  window.incrementWinStat = incrementWinStat;
  window.getCurrentUser = () => currentUser;

})();
