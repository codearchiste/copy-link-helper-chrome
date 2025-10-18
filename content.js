chrome.runtime.onMessage.addListener(async (msg) => {
  if (!msg.action) return;

  function extractLinksFromSelection() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return [];
    const container = document.createElement("div");
    for (let i = 0; i < selection.rangeCount; i++) {
      container.appendChild(selection.getRangeAt(i).cloneContents());
    }
    return Array.from(container.querySelectorAll("a")).map(a => ({
      text: a.textContent.trim(),
      url: a.href
    }));
  }

  let output = "";
  const links = extractLinksFromSelection();

  switch (msg.action) {
    case "copy_text":
      output = window.getSelection().toString();
      break;
    case "copy_links_plain":
      output = links.map(l => `${l.text} - ${l.url}`).join("\n");
      break;
    case "copy_links_md":
      output = links.map(l => `- [${l.text}](${l.url})`).join("\n");
      break;
    case "copy_links_html":
      output = "<ul>\n" + links.map(l => `  <li><a href="${l.url}">${l.text}</a></li>`).join("\n") + "\n</ul>";
      break;
  }

  if (output) {
    try {
      await navigator.clipboard.writeText(output);
      chrome.runtime.sendMessage({ notify: "Copied to clipboard!" });
    } catch (err) {
      chrome.runtime.sendMessage({ notify: "Clipboard write failed!" });
      console.error(err);
    }
  }
});
