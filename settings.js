console.log("Settings popup loaded")

// Default settings
const DEFAULT_SETTINGS = {
  keyboard: "arabic-pc",
  shortcut: "shift",
  undo: "F4",
}

function debug(message, data = null) {
  const debugMsg = `[Correct It Settings] ${message}`
  console.log(debugMsg, data || "")
}

// Load saved settings when the popup opens
document.addEventListener("DOMContentLoaded", function () {
  debug("Loading settings...")
  chrome.storage.sync.get(DEFAULT_SETTINGS, function (settings) {
    document.getElementById("keyboard").value = settings.keyboard
    document.getElementById("shortcut").value = settings.shortcut
    document.getElementById("undo").value = settings.undo
    debug("Settings loaded:", settings)
  })
})

// Save settings when the save button is clicked
document.getElementById("save").addEventListener("click", function () {
  const settings = {
    keyboard: document.getElementById("keyboard").value,
    shortcut: document.getElementById("shortcut").value,
    undo: document.getElementById("undo").value,
  }

  debug("Saving settings:", settings)
  chrome.storage.sync.set(settings, function () {
    const status = document.getElementById("status")
    status.style.display = "block"
    debug("Settings saved successfully")
    setTimeout(() => {
      status.style.display = "none"
    }, 2000)
  })
})
