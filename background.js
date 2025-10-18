chrome.runtime.onInstalled.addListener(() => {
  const items = [
    { id: "copy_text", title: "Copy Selected Text (Plain Text)" },
    { id: "copy_links_plain", title: "Copy Selected Links (Plain Text)" },
    { id: "copy_links_md", title: "Copy Selected Links (Markdown)" },
    { id: "copy_links_html", title: "Copy Selected Links (HTML)" }
  ];

  for (const item of items) {
    chrome.contextMenus.create({
      id: item.id,
      title: item.title,
      contexts: ["selection"]
    });
  }
});

async function copyToClipboard(output) {
  try {
    await navigator.clipboard.writeText(output);
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Copy Link Helper",
      message: "Copied to clipboard!"
    });
  } catch (err) {
    console.error("Clipboard write failed:", err);
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (menuId) => {
      function extractLinksFromSelection() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return [];

        const container = document.createElement("div");
        for (let i = 0; i < selection.rangeCount; i++) {
          container.appendChild(selection.getRangeAt(i).cloneContents());
        }
        return Array.from(container.querySelectorAll("a")).map((a) => ({
          text: a.textContent.trim(),
          url: a.href
        }));
      }

      const links = extractLinksFromSelection();
      let output = "";

      switch (menuId) {
        case "copy_text":
          output = window.getSelection().toString();
          break;
        case "copy_links_plain":
          output = links.map((l) => `${l.text} - ${l.url}`).join("\n");
          break;
        case "copy_links_md":
          output = links.map((l) => `- [${l.text}](${l.url})`).join("\n");
          break;
        case "copy_links_html":
          output = "<ul>\n" + links.map((l) => `  <li><a href="${l.url}">${l.text}</a></li>`).join("\n") + "\n</ul>";
          break;
      }

      if (output) navigator.clipboard.writeText(output);
      return output ? "Copied!" : "No selection";
    },
    args: [info.menuItemId]
  }).then(() => {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Copy Link Helper",
      message: "Copied successfully!"
    });
  });
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (cmd) => {
      function extractLinksFromSelection() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return [];
        const container = document.createElement("div");
        for (let i = 0; i < selection.rangeCount; i++) {
          container.appendChild(selection.getRangeAt(i).cloneContents());
        }
        return Array.from(container.querySelectorAll("a")).map((a) => ({
          text: a.textContent.trim(),
          url: a.href
        }));
      }

      const links = extractLinksFromSelection();
      let output = "";

      if (cmd === "copy_selected_text") {
        output = window.getSelection().toString();
      } else if (cmd === "copy_links_md") {
        output = links.map((l) => `- [${l.text}](${l.url})`).join("\n");
      } else if (cmd === "copy_links_html") {
        output = "<ul>\n" + links.map((l) => `  <li><a href=\"${l.url}\">${l.text}</a></li>`).join("\n") + "\n</ul>";
      } else if (cmd === "copy_links_plain") {
        output = links.map((l) => `${l.text} - ${l.url}`).join("\n");
      }

      if (output) navigator.clipboard.writeText(output);
      return output ? "Copied!" : "No selection";
    },
    args: [command]
  }).then(() => {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.notify) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "Copy Link Helper",
          message: msg.notify
        });
      }
    });
  });
});
