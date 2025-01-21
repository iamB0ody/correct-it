let lastKeyPress = 0
const DOUBLE_PRESS_DELAY = 300 // milliseconds
let settings = null
let undoStack = []

// Debug function
function debug(message, data = null) {
  const debugMsg = `[Correct It Debug] ${message}`
  console.log(debugMsg, data || "")
}

document.addEventListener("DOMContentLoaded", function () {})

// Load settings
chrome.storage.sync.get(
  {
    keyboard: "arabic-pc",
    shortcut: "shift",
    undo: "F4",
  },
  function (loadedSettings) {
    settings = loadedSettings
  }
)

// Listen for settings changes
chrome.storage.onChanged.addListener(function (changes) {
  for (let key in changes) {
    if (settings) {
      settings[key] = changes[key].newValue
    }
  }
})

// Track last key press for each key type
let lastShiftPress = 0
let lastCtrlPress = 0
let lastAltPress = 0

document.addEventListener("keydown", function (event) {
  // Handle reverse shortcut
  if (settings) {
    const currentTime = new Date().getTime()

    // Check for Shift or Command (Meta) key based on settings
    const isShortcutKey = (settings.shortcut === "shift" && event.key === "Shift") || (settings.shortcut === "ctrl" && event.key === "Control") || (settings.shortcut === "alt" && event.key === "Alt")

    if (isShortcutKey) {
      let lastPress
      switch (event.key) {
        case "Shift":
          lastPress = lastShiftPress
          break
        case "Control":
          lastPress = lastCtrlPress
          break
        case "Alt":
          lastPress = lastAltPress
          break
      }

      if (currentTime - lastPress <= DOUBLE_PRESS_DELAY) {
        handleTextReversal()
      }

      // Update the last press time
      switch (event.key) {
        case "Shift":
          lastShiftPress = currentTime
          break
        case "Control":
          lastCtrlPress = currentTime
          break
        case "Alt":
          lastAltPress = currentTime
          break
      }
    }

    // Handle undo shortcut
    if (event.key === settings.undo) {
      handleUndo()
    }
  }
})

function handleTextReversal() {
  const activeElement = document.activeElement

  if (isTextInput(activeElement)) {
    // Save current state for undo
    undoStack.push({
      element: activeElement,
      value: activeElement.value,
      selectionStart: activeElement.selectionStart,
      selectionEnd: activeElement.selectionEnd,
    })

    const start = activeElement.selectionStart
    const end = activeElement.selectionEnd

    if (start === end) {
      // No selection - reverse entire text
      activeElement.value = reverseText(activeElement.value, settings.keyboard)
    } else {
      // Reverse selected text only
      const before = activeElement.value.substring(0, start)
      const selected = activeElement.value.substring(start, end)
      const after = activeElement.value.substring(end)

      activeElement.value = before + reverseText(selected, settings.keyboard) + after
      activeElement.setSelectionRange(start, end)
    }

    activeElement.dispatchEvent(new Event("input", { bubbles: true }))
  }
}

function handleUndo() {
  if (undoStack.length > 0) {
    const lastState = undoStack.pop()
    if (lastState.element === document.activeElement) {
      lastState.element.value = lastState.value
      lastState.element.setSelectionRange(lastState.selectionStart, lastState.selectionEnd)
      lastState.element.dispatchEvent(new Event("input", { bubbles: true }))
    }
  }
}

function isTextInput(element) {
  if (!element) return false

  const tagName = element.tagName.toLowerCase()
  const type = element.type ? element.type.toLowerCase() : ""

  return (tagName === "input" && (type === "text" || type === "search" || type === "tel" || type === "url" || type === "email" || type === "password")) || tagName === "textarea"
}

function reverseText(text, keyboard) {
  // Base Mac Arabic keyboard layout
  const macBaseLayout = {
    // Mac Arabic keyboard layout
    ض: "q",
    ص: "w",
    ث: "e",
    ق: "r",
    ف: "t",
    غ: "y",
    ع: "u",
    ه: "i",
    خ: "o",
    ح: "p",
    ج: "[",
    د: "v",
    ش: "a",
    س: "s",
    ي: "d",
    ب: "f",
    ل: "g",
    ا: "h",
    ت: "j",
    ن: "k",
    م: "l",
    ك: ";",
    ط: "]",
    ئ: "z",
    ء: "x",
    ؤ: "c",
    ر: "n",
    ز: "b",
    و: "m",
    ة: ",",
    ".": ".",
    ظ: "/",
    لا: "'",
    " ": " ",
    ",": ",",
    "?": "?",
    "!": "!",
  }

  // Different keyboard layout mappings
  const keyboardMaps = {
    "arabic-pc": {
      // Windows Arabic keyboard layout
      ض: "q",
      ص: "w",
      ث: "e",
      ق: "r",
      ف: "t",
      غ: "y",
      ع: "u",
      ه: "i",
      خ: "o",
      ح: "p",
      ج: "[",
      د: "]",
      ش: "a",
      س: "s",
      ي: "d",
      ب: "f",
      ل: "g",
      ا: "h",
      ت: "j",
      ن: "k",
      م: "l",
      ك: ";",
      ط: "'",
      ئ: "z",
      ء: "x",
      ؤ: "c",
      ر: "v",
      لا: "b",
      ى: "n",
      ة: "m",
      و: ",",
      ز: ".",
      ظ: "/",
      " ": " ",
      ",": ",",
      ".": ".",
      "?": "?",
      "!": "!",
    },
    "arabic-mac": { ...macBaseLayout },
    "arabic-mac-102": {
      ...macBaseLayout,
      // Additional keys for 102-key layout
      "|": "|",
      "\\": "\\",
      "{": "{",
      "}": "}",
    },
    "arabic-mac-87": {
      ...macBaseLayout,
      // Any specific modifications for 87-key layout
    },
  }

  // Get the appropriate keyboard mapping based on settings
  const keyboardMap = keyboardMaps[keyboard] || keyboardMaps["arabic-pc"]

  // Create reverse mapping (English to Arabic)
  const reverseMap = Object.fromEntries(Object.entries(keyboardMap).map(([ar, en]) => [en, ar]))

  // Detect if text is primarily Arabic
  const isArabic = /[\u0600-\u06FF]/.test(text)

  if (isArabic) {
    // Convert from wrong Arabic to intended English
    return text
      .split("")
      .map((char) => {
        return keyboardMap[char] || char
      })
      .join("")
  } else {
    // Convert from wrong English to intended Arabic
    let result = text.toLowerCase()
    return result
      .split("")
      .map((char) => {
        return reverseMap[char] || char
      })
      .join("")
  }
}
