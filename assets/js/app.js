const storageName = "passwordVaultEntries";

const form = document.getElementById("passwordForm");
const websiteInput = document.getElementById("website");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const lengthInput = document.getElementById("lengthRange");
const lengthText = document.getElementById("lengthValue");

const lowercaseInput = document.getElementById("includeLowercase");
const uppercaseInput = document.getElementById("includeUppercase");
const numbersInput = document.getElementById("includeNumbers");
const symbolsInput = document.getElementById("includeSymbols");

const generateButton = document.getElementById("generateBtn");
const copyButton = document.getElementById("copyGeneratedBtn");
const toggleButton = document.getElementById("togglePasswordBtn");
const clearButton = document.getElementById("clearFormBtn");
const clearAllButton = document.getElementById("clearAllBtn");
const addButton = document.getElementById("focusAddBtn");
const searchInput = document.getElementById("searchInput");

const strengthText = document.getElementById("liveStrengthText");
const tableBody = document.getElementById("vaultTableBody");
const toast = document.getElementById("toast");

const totalText = document.getElementById("totalPasswords");
const strongText = document.getElementById("strongPasswords");
const weakText = document.getElementById("weakPasswords");

let savedPasswords = loadPasswords();

showPasswords(savedPasswords);
updateStats();
updateLengthText();
updateLiveStrength();

/* -------------------- event listeners -------------------- */

lengthInput.addEventListener("input", updateLengthText);

passwordInput.addEventListener("input", updateLiveStrength);

generateButton.addEventListener("click", function () {
  const newPassword = makePassword();

  if (newPassword === "") {
    showToast("Select at least one character type.");
    return;
  }

  passwordInput.value = newPassword;
  updateLiveStrength();
  showToast("Password generated.");
});

copyButton.addEventListener("click", function () {
  const currentPassword = passwordInput.value.trim();

  if (currentPassword === "") {
    showToast("There is no password to copy.");
    return;
  }

  copyToClipboard(currentPassword);
});

toggleButton.addEventListener("click", function () {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleButton.textContent = "🙈";
  } else {
    passwordInput.type = "password";
    toggleButton.textContent = "👁";
  }
});

clearButton.addEventListener("click", resetForm);

addButton.addEventListener("click", function () {
  websiteInput.focus();
});

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const website = websiteInput.value.trim();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (website === "" || username === "" || password === "") {
    showToast("Please fill in all fields.");
    return;
  }

  const passwordItem = {
    id: Date.now().toString(),
    website: website,
    username: username,
    password: password,
  };

  savedPasswords.unshift(passwordItem);
  savePasswords();
  showPasswords(filterPasswords(searchInput.value.trim()));
  updateStats();
  resetForm();

  showToast("Password saved.");
});

searchInput.addEventListener("input", function () {
  const searchValue = searchInput.value.trim();
  const filteredPasswords = filterPasswords(searchValue);
  showPasswords(filteredPasswords);
});

clearAllButton.addEventListener("click", function () {
  if (savedPasswords.length === 0) {
    showToast("There are no saved passwords to delete.");
    return;
  }

  const answer = window.confirm("Delete all saved passwords?");

  if (!answer) {
    return;
  }

  savedPasswords = [];
  savePasswords();
  showPasswords(savedPasswords);
  updateStats();

  showToast("All passwords deleted.");
});

/* -------------------- functions -------------------- */

function updateLengthText() {
  lengthText.textContent = lengthInput.value;
}

function updateLiveStrength() {
  const currentPassword = passwordInput.value.trim();

  if (currentPassword === "") {
    strengthText.textContent = "-";
    return;
  }

  const strength = checkStrength(currentPassword);
  strengthText.textContent = strength.label;
}

function resetForm() {
  form.reset();

  lengthInput.value = 14;
  lowercaseInput.checked = true;
  uppercaseInput.checked = true;
  numbersInput.checked = true;
  symbolsInput.checked = true;

  passwordInput.type = "password";
  toggleButton.textContent = "👁";

  updateLengthText();
  updateLiveStrength();
}

function makePassword() {
  const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
  const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let allCharacters = "";

  if (lowercaseInput.checked) {
    allCharacters += lowercaseLetters;
  }

  if (uppercaseInput.checked) {
    allCharacters += uppercaseLetters;
  }

  if (numbersInput.checked) {
    allCharacters += numbers;
  }

  if (symbolsInput.checked) {
    allCharacters += symbols;
  }

  if (allCharacters === "") {
    return "";
  }

  let newPassword = "";
  const passwordLength = Number(lengthInput.value);

  for (let i = 0; i < passwordLength; i++) {
    const randomNumber = Math.floor(Math.random() * allCharacters.length);
    newPassword += allCharacters[randomNumber];
  }

  return newPassword;
}

function checkStrength(password) {
  let score = 0;

  if (password.length >= 8) {
    score++;
  }

  if (password.length >= 12) {
    score++;
  }

  if (/[a-z]/.test(password)) {
    score++;
  }

  if (/[A-Z]/.test(password)) {
    score++;
  }

  if (/[0-9]/.test(password)) {
    score++;
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score++;
  }

  if (score <= 2) {
    return {
      label: "Weak",
      className: "strength-weak",
    };
  }

  if (score <= 4) {
    return {
      label: "Medium",
      className: "strength-medium",
    };
  }

  return {
    label: "Strong",
    className: "strength-strong",
  };
}

function showPasswords(passwordList) {
  if (passwordList.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">No passwords stored yet.</td>
      </tr>
    `;
    return;
  }

  let tableContent = "";

  for (let i = 0; i < passwordList.length; i++) {
    const item = passwordList[i];
    const strength = checkStrength(item.password);

    tableContent += `
      <tr>
        <td>${safeText(item.website)}</td>
        <td>${safeText(item.username)}</td>
        <td>
          <span class="strength-badge ${strength.className}">
            ${strength.label}
          </span>
        </td>
        <td class="masked-password">••••••••••••</td>
        <td class="actions">
          <button class="icon-btn" type="button" data-action="copy" data-id="${item.id}">
            📋
          </button>
          <button class="icon-btn" type="button" data-action="toggle" data-id="${item.id}">
            👁
          </button>
          <button class="icon-btn" type="button" data-action="delete" data-id="${item.id}">
            🗑
          </button>
        </td>
      </tr>
    `;
  }

  tableBody.innerHTML = tableContent;
  addTableButtonEvents();
}

function addTableButtonEvents() {
  const buttons = tableBody.querySelectorAll("button");

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      const action = button.dataset.action;
      const id = button.dataset.id;
      const passwordItem = savedPasswords.find(function (item) {
        return item.id === id;
      });

      if (!passwordItem) {
        return;
      }

      if (action === "copy") {
        copyToClipboard(passwordItem.password);
      }

      if (action === "delete") {
        savedPasswords = savedPasswords.filter(function (item) {
          return item.id !== id;
        });

        savePasswords();
        showPasswords(filterPasswords(searchInput.value.trim()));
        updateStats();
        showToast("Password deleted.");
      }

      if (action === "toggle") {
        const row = button.closest("tr");
        const passwordCell = row.children[3];

        if (passwordCell.textContent.includes("•")) {
          passwordCell.textContent = passwordItem.password;
          button.textContent = "🙈";
        } else {
          passwordCell.textContent = "••••••••••••";
          button.textContent = "👁";
        }
      }
    });
  });
}

function updateStats() {
  totalText.textContent = savedPasswords.length;

  let strongCount = 0;
  let weakCount = 0;

  for (let i = 0; i < savedPasswords.length; i++) {
    const strength = checkStrength(savedPasswords[i].password);

    if (strength.label === "Strong") {
      strongCount++;
    }

    if (strength.label === "Weak") {
      weakCount++;
    }
  }

  strongText.textContent = strongCount;
  weakText.textContent = weakCount;
}

function filterPasswords(searchValue) {
  if (searchValue === "") {
    return savedPasswords;
  }

  const lowerSearchValue = searchValue.toLowerCase();

  return savedPasswords.filter(function (item) {
    return (
      item.website.toLowerCase().includes(lowerSearchValue) ||
      item.username.toLowerCase().includes(lowerSearchValue)
    );
  });
}

function loadPasswords() {
  const savedData = localStorage.getItem(storageName);

  if (savedData === null) {
    return [];
  }

  return JSON.parse(savedData);
}

function savePasswords() {
  localStorage.setItem(storageName, JSON.stringify(savedPasswords));
}

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(function () {
      showToast("Copied to clipboard.");
    })
    .catch(function () {
      showToast("Copy failed.");
    });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(function () {
    toast.classList.remove("show");
  }, 2200);
}

function safeText(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}