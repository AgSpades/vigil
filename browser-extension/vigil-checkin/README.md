# Vigil Browser Extension: Check-in Reminder

This extension is intentionally lightweight.

## What it does

- Schedules periodic check-in reminders.
- Shows a browser notification when a reminder is due.
- Opens your Vigil dashboard check-in URL when the notification is clicked.

## What it does NOT do

- It does not call check-in APIs.
- It does not send your PIN.
- It does not verify identity.

Identity verification stays in Vigil via `/api/verify-checkin` after you open the dashboard.

## Load locally

1. Open Chrome/Edge extension developer mode.
2. Choose **Load unpacked**.
3. Select this folder: `browser-extension/vigil-checkin`.
4. Open extension options and set your production dashboard URL.
