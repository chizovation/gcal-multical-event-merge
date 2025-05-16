// ==UserScript==
// @name        Event Merge for Google Calendar™ (by @imightbeAmy)
// @namespace   gcal-multical-event-merge
// @include     https://www.google.com/calendar/*
// @include     http://www.google.com/calendar/*
// @include     https://calendar.google.com/*
// @include     http://calendar.google.com/*
// @version     1
// @grant       none
// ==/UserScript==

"use strict";

const stripesGradient = (colors, width, angle) => {
  let gradient = `repeating-linear-gradient( ${angle}deg,`;
  let pos = 0;

  const colorCounts = colors.reduce((counts, color) => {
    counts[color] = (counts[color] || 0) + 1;
    return counts;
  }, {});

  colors.forEach((color, i) => {
    colorCounts[color] -= 1;
    color = chroma(color)
      .darken(colorCounts[color] / 3)
      .css();

    gradient += color + " " + pos + "px,";
    pos += width;
    gradient += color + " " + pos + "px,";
  });
  gradient = gradient.slice(0, -1);
  gradient += ")";
  return gradient;
};

const dragType = (e) => parseInt(e.dataset.dragsourceType);

const calculatePosition = (event, parentPosition) => {
  const eventPosition = event.getBoundingClientRect();
  return {
    left: Math.max(eventPosition.left - parentPosition.left, 0),
    right: parentPosition.right - eventPosition.right,
  };
};

const mergeEventElements = (events) => {
  events.sort((e1, e2) => dragType(e1) - dragType(e2));
  const colors = events.map(
    (event) =>
      event.style.backgroundColor || // Week day and full day events marked 'attending'
      event.style.borderColor || // Not attending or not responded week view events
      event.parentElement.style.borderColor // Timed month view events
  );

  const parentPosition = events[0].parentElement.getBoundingClientRect();
  const positions = events.map((event) => {
    event.originalPosition =
      event.originalPosition || calculatePosition(event, parentPosition);
    return event.originalPosition;
  });

  const eventToKeep = events.shift();
  events.forEach((event) => {
    event.style.visibility = "hidden";
  });

  // --- Begin: Add dropdown icon for merged events ---
  // Remove any previous dropdown/icon
  if (eventToKeep._mergeMenuHandler) {
    eventToKeep.removeEventListener(
      "contextmenu",
      eventToKeep._mergeMenuHandler
    );
    eventToKeep._mergeMenuHandler = null;
  }
  if (eventToKeep._mergeDropdown) {
    eventToKeep._mergeDropdown.remove();
    eventToKeep._mergeDropdown = null;
  }
  if (events.length > 0) {
    // Create dropdown icon
    const dropdown = document.createElement("span");
    dropdown.textContent = "🔽";
    dropdown.style.position = "absolute";
    dropdown.style.left = "4px";
    dropdown.style.top = "4px";
    dropdown.style.transform = "none";
    dropdown.style.cursor = "pointer";
    dropdown.style.fontSize = "14px";
    dropdown.style.opacity = "0";
    dropdown.style.transition = "opacity 0.2s";
    dropdown.style.zIndex = "10";
    dropdown.className = "gcal-merge-dropdown";
    // Show only on hover
    eventToKeep.addEventListener("mouseenter", () => {
      dropdown.style.opacity = "1";
    });
    eventToKeep.addEventListener("mouseleave", () => {
      dropdown.style.opacity = "0";
    });
    // Positioning: ensure eventToKeep is relative
    if (getComputedStyle(eventToKeep).position === "static") {
      eventToKeep.style.position = "relative";
    }
    eventToKeep.appendChild(dropdown);
    eventToKeep._mergeDropdown = dropdown;
    // Click handler for dropdown
    dropdown.onclick = function (e) {
      e.stopPropagation();
      // Remove any existing menu
      document
        .querySelectorAll(".gcal-merge-menu")
        .forEach((el) => el.remove());
      // Create menu
      const menu = document.createElement("div");
      menu.className = "gcal-merge-menu";
      menu.style.position = "fixed";
      menu.style.zIndex = 9999;
      // Adaptive background for dark/light mode
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      menu.style.background = isDark ? "rgba(32,32,32,0.98)" : "#fff";
      menu.style.color = isDark ? "#eee" : "#222";
      menu.style.border = isDark ? "1px solid #444" : "1px solid #ccc";
      menu.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
      menu.style.padding = "4px 0";
      menu.style.borderRadius = "6px";
      menu.style.minWidth = "180px";
      menu.style.font = "14px Arial, sans-serif";
      // Position at dropdown
      const rect = dropdown.getBoundingClientRect();
      menu.style.top = rect.bottom + "px";
      menu.style.left = rect.left + "px";
      // Helper to get event title and colour
      const getTitle = (ev) => {
        const el = ev.querySelector('[aria-hidden="true"]');
        return el ? el.textContent.trim() : "(No title)";
      };
      const getColour = (ev) =>
        ev.style.backgroundColor ||
        ev.style.borderColor ||
        ev.parentElement.style.borderColor ||
        "#888";
      // Gather event objects and their calendar names
      const menuItems = [eventToKeep, ...events].map((ev) => {
        // Try to get calendar name from .XuJrye
        let calName = "Unknown calendar";
        const xu = ev.querySelector(".XuJrye");
        if (xu) {
          const m = xu.textContent.match(/Calendar: ([^,]+)/);
          if (m) {
            calName = m[1].trim();
          } else {
            calName = "[Default calendar]";
          }
        }
        // Try to get colour from .jSrjCf
        const swatchColour =
          ev.querySelector(".jSrjCf")?.style.backgroundColor || getColour(ev);
        return { ev, calName, swatchColour };
      });
      // Sort alphabetically by calendar name
      menuItems.sort((a, b) => a.calName.localeCompare(b.calName));
      // Render menu
      menuItems.forEach(({ ev, calName, swatchColour }) => {
        const item = document.createElement("div");
        item.style.display = "flex";
        item.style.alignItems = "center";
        item.style.cursor = "pointer";
        item.style.padding = "4px 12px";
        item.style.gap = "8px";
        item.onmouseenter = () =>
          (item.style.background = isDark ? "#222" : "#f0f0f0");
        item.onmouseleave = () => (item.style.background = "");
        // Colour swatch
        const swatch = document.createElement("span");
        swatch.style.display = "inline-block";
        swatch.style.width = "12px";
        swatch.style.height = "12px";
        swatch.style.borderRadius = "50%";
        swatch.style.background = swatchColour;
        swatch.style.border = "1px solid #bbb";
        // Label
        const label = document.createElement("span");
        label.textContent = `Open in: ${calName}`;
        label.style.color = isDark ? "#fff" : "#222";
        label.style.textShadow = isDark ? "0 1px 2px #000" : "";
        // Compose
        item.appendChild(swatch);
        item.appendChild(label);
        // Click handler: simulate click on the event
        item.onclick = (evt) => {
          evt.stopPropagation();
          menu.remove();
          ev.style.visibility = "visible";
          ev.click();
          setTimeout(() => {
            if (ev !== eventToKeep) ev.style.visibility = "hidden";
          }, 100);
        };
        menu.appendChild(item);
      });
      document.body.appendChild(menu);
      // Remove menu on click elsewhere
      const removeMenu = (evt) => {
        if (!menu.contains(evt.target)) {
          menu.remove();
          document.removeEventListener("mousedown", removeMenu, true);
        }
      };
      setTimeout(() => {
        document.addEventListener("mousedown", removeMenu, true);
      }, 0);
    };
  }
  // --- End: Add dropdown icon for merged events ---

  if (eventToKeep.style.backgroundColor || eventToKeep.style.borderColor) {
    eventToKeep.originalStyle = eventToKeep.originalStyle || {
      backgroundImage: eventToKeep.style.backgroundImage,
      backgroundSize: eventToKeep.style.backgroundSize,
      left: eventToKeep.style.left,
      right: eventToKeep.style.right,
      visibility: eventToKeep.style.visibility,
      width: eventToKeep.style.width,
      border: eventToKeep.style.border,
      borderColor: eventToKeep.style.borderColor,
      textShadow: eventToKeep.style.textShadow,
    };
    eventToKeep.style.backgroundImage = stripesGradient(colors, 10, 45);
    eventToKeep.style.backgroundSize = "initial";
    eventToKeep.style.left = Math.min(...positions.map((s) => s.left)) + "px";
    eventToKeep.style.right = Math.min(...positions.map((s) => s.right)) + "px";
    eventToKeep.style.visibility = "visible";
    eventToKeep.style.width = null;
    eventToKeep.style.border = "solid 1px #FFF";

    // Clear setting color for declined events
    eventToKeep.querySelector('[aria-hidden="true"]').style.color = null;

    const computedSpanStyle = window.getComputedStyle(
      eventToKeep.querySelector("span")
    );
    if (computedSpanStyle.color == "rgb(255, 255, 255)") {
      eventToKeep.style.textShadow = "0px 0px 2px black";
    } else {
      eventToKeep.style.textShadow = "0px 0px 2px white";
    }

    events.forEach((event) => {
      event.style.visibility = "hidden";
    });
  } else {
    const dots = eventToKeep.querySelector('[role="button"] div:first-child');
    const dot = dots.querySelector("div");
    dot.style.backgroundImage = stripesGradient(colors, 4, 90);
    dot.style.width = colors.length * 4 + "px";
    dot.style.borderWidth = 0;
    dot.style.height = "8px";

    events.forEach((event) => {
      event.style.visibility = "hidden";
    });
  }
};

const resetMergedEvents = (events) => {
  events.forEach((event) => {
    for (let k in event.originalStyle) {
      event.style[k] = event.originalStyle[k];
    }
    event.style.visibility = "visible";
  });
};

const merge = (mainCalender) => {
  const eventSets = {};
  const days = mainCalender.querySelectorAll('[role="gridcell"]');
  days.forEach((day, index) => {
    const events = Array.from(
      day.querySelectorAll(
        '[data-eventid][role="button"], [data-eventid] [role="button"]'
      )
    );
    events.forEach((event) => {
      const eventTitleEls = event.querySelectorAll('[aria-hidden="true"]');
      if (!eventTitleEls.length) {
        return;
      }
      let eventKey = Array.from(eventTitleEls)
        .map((el) => el.textContent)
        .join("")
        .replace(/\\s+/g, "");
      eventKey = index + eventKey + event.style.height;
      eventSets[eventKey] = eventSets[eventKey] || [];
      eventSets[eventKey].push(event);
    });
  });

  Object.values(eventSets).forEach((events) => {
    if (events.length > 1) {
      mergeEventElements(events);
    } else {
      resetMergedEvents(events);
    }
  });
};

const init = (mutationsList) => {
  mutationsList
    ?.map((mutation) => mutation.addedNodes[0] || mutation.target)
    .filter((node) =>
      node.matches?.('[role="main"], [role="dialog"], [role="grid"]')
    )
    .map(merge);
};

setTimeout(async () => {
  const storage = await chrome.storage.local.get("disabled");
  console.log(`Event merge is ${storage.disabled ? "disabled" : "enabled"}`);
  if (!storage.disabled) {
    const observer = new MutationObserver(init);
    observer.observe(document.querySelector("body"), {
      childList: true,
      subtree: true,
      attributes: true,
    });
  }

  chrome.storage.onChanged.addListener(() => window.location.reload());
}, 10);
