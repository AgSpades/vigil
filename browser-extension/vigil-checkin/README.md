# Vigil Browser Extension: Check-in Reminder

This extension is intentionally lightweight.

## What it does

- Schedules periodic check-in reminders.
- Shows a browser notification when a reminder is due.
- Updates heartbeat directly when the notification is clicked.

## What it does NOT do

- It does not send your PIN.
- It does not verify identity.

This mode is a lightweight check-in path that calls `/api/heartbeat` from the extension.

## Load locally

1. Open Chrome/Edge extension developer mode.
2. Choose **Load unpacked**.
3. Select this folder: `browser-extension/vigil-checkin`.
4. Open extension options and set your production dashboard URL.
