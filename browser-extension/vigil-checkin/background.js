const DEFAULTS = {
  checkInUrl: "http://localhost:3000/dashboard",
  reminderIntervalMinutes: 360,
};

const ALARM_NAME = "vigil-checkin-reminder";
const NOTIFICATION_ID = "vigil-checkin-notification";

async function getSettings() {
  const values = await chrome.storage.sync.get(DEFAULTS);
  return {
    checkInUrl: values.checkInUrl,
    reminderIntervalMinutes: Math.max(60, Number(values.reminderIntervalMinutes) || 360),
  };
}

async function scheduleAlarm() {
  const settings = await getSettings();
  await chrome.alarms.clear(ALARM_NAME);
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: settings.reminderIntervalMinutes,
    periodInMinutes: settings.reminderIntervalMinutes,
  });
}

async function showReminder() {
  await chrome.notifications.create(NOTIFICATION_ID, {
    type: "basic",
    iconUrl: "icon-128.png",
    title: "Vigil check-in due",
    message: "Tap to open Vigil and complete your secure check-in.",
    priority: 2,
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.sync.set(DEFAULTS);
  await scheduleAlarm();
});

chrome.runtime.onStartup.addListener(async () => {
  await scheduleAlarm();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) {
    return;
  }

  await showReminder();
});

chrome.notifications.onClicked.addListener(async (id) => {
  if (id !== NOTIFICATION_ID) {
    return;
  }

  const settings = await getSettings();
  await chrome.tabs.create({ url: settings.checkInUrl });
  await chrome.notifications.clear(NOTIFICATION_ID);
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== "sync") {
    return;
  }

  if (changes.reminderIntervalMinutes || changes.checkInUrl) {
    await scheduleAlarm();
  }
});
