const DEFAULTS = {
  checkInUrl: "http://localhost:3000/dashboard",
  reminderIntervalMinutes: 100,
};

const ALARM_NAME = "vigil-checkin-reminder";
const NOTIFICATION_ID = "vigil-checkin-notification";
const SUCCESS_NOTIFICATION_ID = "vigil-checkin-success";
const ERROR_NOTIFICATION_ID = "vigil-checkin-error";

async function getSettings() {
  const values = await chrome.storage.sync.get(DEFAULTS);
  return {
    checkInUrl: values.checkInUrl,
    reminderIntervalMinutes: Math.max(60, Number(values.reminderIntervalMinutes) || 100),
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
    iconUrl: chrome.runtime.getURL("icon-128.png"),
    title: "Vigil check-in due",
    message: "Tap Accept to check in instantly.",
    buttons: [{ title: "Accept" }],
    priority: 2,
  });
}

function getHeartbeatUrl(checkInUrl) {
  try {
    const url = new URL(checkInUrl);
    return `${url.origin}/api/heartbeat`;
  } catch {
    return null;
  }
}

async function showCheckinResult(ok, detail) {
  if (ok) {
    await chrome.notifications.create(SUCCESS_NOTIFICATION_ID, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icon-128.png"),
      title: "Vigil check-in accepted",
      message: "Accepted. Heartbeat updated.",
      priority: 2,
    });
    return;
  }

  await chrome.notifications.create(ERROR_NOTIFICATION_ID, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("icon-128.png"),
    title: "Vigil check-in failed",
    message: detail || "Could not update heartbeat. Please sign in to Vigil and try again.",
    priority: 2,
  });
}

async function verifyFromNotification() {
  const settings = await getSettings();
  const heartbeatUrl = getHeartbeatUrl(settings.checkInUrl);

  if (!heartbeatUrl) {
    await showCheckinResult(false, "Invalid check-in URL in extension settings.");
    await chrome.notifications.clear(NOTIFICATION_ID);
    return;
  }

  try {
    const response = await fetch(heartbeatUrl, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-checkin-source": "browser_extension",
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message = typeof body?.error === "string" ? body.error : null;
      await showCheckinResult(false, message);
    } else {
      await showCheckinResult(true, null);
    }
  } catch {
    await showCheckinResult(
      false,
      "Network error while updating heartbeat. Check your connection.",
    );
  }

  await chrome.notifications.clear(NOTIFICATION_ID);
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

  await verifyFromNotification();
});

chrome.notifications.onButtonClicked.addListener(async (id, buttonIndex) => {
  if (id !== NOTIFICATION_ID || buttonIndex !== 0) {
    return;
  }

  await verifyFromNotification();
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== "sync") {
    return;
  }

  if (changes.reminderIntervalMinutes || changes.checkInUrl) {
    await scheduleAlarm();
  }
});
