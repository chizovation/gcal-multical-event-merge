# Google Multi-Calendar Event Merge

Chrome extension that visually merges the same event on multiple Google Calendars into one event.

# Download [for Chrome](https://chrome.google.com/webstore/detail/event-merge-for-google-ca/idehaflielbgpaokehlhidbjlehlfcep), [for FireFox](https://addons.mozilla.org/en-US/firefox/addon/google-cal-event-merge/) or [install with Greasemonkey](https://github.com/imightbeamy/gcal-multical-event-merge/raw/master/events.user.js)

![examples](images/examples.png)

### Classic UI

For reference, [here's the last commit before changing to support the newer UI.](https://github.com/imightbeamy/gcal-multical-event-merge/blob/bed9a531157e14bf86463ea7970f8ce0ef76db1d/events.user.js)

### Build

Run `build` to create zip file for Chrome and FF.

### Local Development Testing

To test this extension locally while it's pending Chrome Web Store approval:

1. Clone this repository:

   ```bash
   git clone https://github.com/chizovation/gcal-multical-event-merge.git
   cd gcal-multical-event-merge
   ```

2. Open Chrome and go to the Extensions page:

   - Type `chrome://extensions` in the address bar, or
   - Click the three dots menu → More Tools → Extensions

3. Enable Developer Mode:

   - Toggle the "Developer mode" switch in the top right corner

4. Load the extension:

   - Click "Load unpacked"
   - Navigate to the cloned repository folder
   - Click "Select Folder"

5. The extension should now be active:
   - You'll see the extension icon in your toolbar
   - Visit Google Calendar to test the functionality
   - Click the extension icon to toggle event merging on/off

Note: When testing locally, Chrome will show a warning about running in developer mode. This is normal for unpacked extensions.
