const DEFAULTS = {
  checkInUrl: "http://localhost:3000/dashboard",
  reminderIntervalMinutes: 100,
};

const checkInUrlInput = document.getElementById("checkInUrl");
const reminderInput = document.getElementById("reminderIntervalMinutes");
const saveButton = document.getElementById("saveButton");
const status = document.getElementById("status");

async function loadSettings() {
  const values = await chrome.storage.sync.get(DEFAULTS);
  checkInUrlInput.value = values.checkInUrl;
  reminderInput.value = String(values.reminderIntervalMinutes);
}

async function saveSettings() {
  const checkInUrl = checkInUrlInput.value.trim();
  const reminderIntervalMinutes = Math.max(
    100,
    Number(reminderInput.value || DEFAULTS.reminderIntervalMinutes),
  );

  if (!/^https?:\/\//.test(checkInUrl)) {
    status.textContent = "Enter a valid http(s) URL.";
    return;
  }

  await chrome.storage.sync.set({
    checkInUrl,
    reminderIntervalMinutes,
  });

  status.textContent = "Saved.";
  setTimeout(() => {
    status.textContent = "";
  }, 1500);
}

saveButton.addEventListener("click", () => {
  void saveSettings();
});

void loadSettings();
