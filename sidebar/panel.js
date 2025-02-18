let myWindowId;
const currentMarkingHtml = document.querySelector("#currentMark");
const markingsHtml = document.querySelector("#markings");
const progressContainer = document.querySelector("#progressContainer");
const importNotes = document.querySelector("#importNotes");
const exportBtn = document.querySelector("#exportBtn");
const importBtn = document.querySelector("#importBtn");
const copyBtn = document.querySelector("#copyBtn");
let markings = [];
let previousInputLength = 0;
const INVALID_START_TIME = -1;
let timeStartWritingMarking = INVALID_START_TIME;
let currentVideoTime;

let previousTabId;
let previousVideoId;

importNotes.addEventListener("change", (event) => {
  if (importNotes.files.length == 1) {
    var reader = new FileReader();
    reader.readAsText(importNotes.files[0], "UTF-8");
    reader.onload = function (evt) {
      let importJson = JSON.parse(evt.target.result);
      browser.storage.local.set(importJson);
    };
  }
});

exportBtn.addEventListener("mousedown", (event) => {
  browser.storage.local.get().then((res) => {
    var dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res));
    var dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "notesTimestampsExtensionData.json");
    dlAnchorElem.click();
  });
});
importBtn.addEventListener("mousedown", (event) => {
  importNotes.click();
});
copyBtn.addEventListener("mousedown", async (event) => {
  let id = currentMarkingHtml.value;
  let storedInfo = await browser.storage.local.get(id);
  if (!storedInfo[Object.keys(storedInfo)[0]]) return;
  let shouldCopy = confirm(
    "Are you sure you want to copy: " +
      storedInfo[Object.keys(storedInfo)[0]].slice(0, 2000)
  );
  if (!shouldCopy) return;
  markingsHtml.innerHTML = "";
  markings = [];
  markings = JSON.parse(storedInfo[Object.keys(storedInfo)[0]]);
  updateMarkingsHtml();
  updateLocalStorage();
});

markingsHtml.addEventListener("mousedown", (event) => {
  if (event.which === 1 && event.target.classList.contains("title")) {
    let time = parseFloat(event.target.dataset.time);
    markings.forEach((marking) => {
      if (marking.time == time) {
        if (event.ctrlKey) {
          let shouldDelete = confirm(
            "Are you sure you want to delete: " + marking.title
          );
          if (!shouldDelete) return;
          markings = markings.filter((marking) => marking.time != time);
        } else if (event.shiftKey) {
          let newTitle = prompt("New title for: " + marking.title);
          if (newTitle) {
            marking.title = newTitle;
          }
        } else {
          let newTime = Math.max(0, marking.time - 5);
          setVideoTime(newTime);
        }
        updateMarkingsHtml();
        updateLocalStorage();
      }
    });
    return;
  } else if (
    event.which === 1 &&
    event.target.className === "canExplainCheckbox"
  ) {
    event.preventDefault();
    event.target.checked = !event.target.checked;
    let canExplain = event.target.checked;
    let time = parseFloat(event.target.dataset.time);
    markings.forEach((marking) => {
      if (marking.time == time) {
        marking.canExplain = canExplain;
      }
    });
    updateMarkingsHtml();
    updateLocalStorage();
  }
});

currentMarkingHtml.addEventListener("keydown", (event) => {
  let keycode = event.keyCode;
  let valid =
    (keycode > 47 && keycode < 58) || // number keys
    keycode == 32 ||
    keycode == 13 || // spacebar & return key(s) (if you want to allow carriage returns)
    (keycode > 64 && keycode < 91) || // letter keys
    (keycode > 95 && keycode < 112) || // numpad keys
    (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
    (keycode > 218 && keycode < 223); // [\]' (in order)
  let selectionLength = event.target.value.substring(
    event.target.selectionStart,
    event.target.selectionEnd
  ).length;
  if (
    (event.target.value.length === 0 && valid) ||
    (event.target.value.length == selectionLength && valid)
  ) {
    updateTimeStarted();
  }
});
function arraySorting(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[0].value < arr[i].value) {
      return 1;
    }
  }
  return -1;
}
currentMarkingHtml.addEventListener("keyup", async (event) => {
  if (event.key === "Enter") {
    if (
      currentMarkingHtml.value === "" ||
      timeStartWritingMarking === INVALID_START_TIME
    )
      return;
    if (arraySorting(markings) > 0) {
      markings = markings.reverse();
    }
    markings.unshift({
      canExplain: false,
      title: currentMarkingHtml.value,
      time: timeStartWritingMarking,
    });
    markings.sort(function (x, y) {
      if (x.time > y.time) {
        return -1;
      }
      if (x.time < y.time) {
        return 1;
      }
      return 0;
    });
    updateMarkingsHtml();
    updateLocalStorage();
    currentMarkingHtml.value = "";
    timeStartWritingMarking = INVALID_START_TIME;
  }
});

function getVideoId(url) {
  let video_id = url;
  if (url.includes("file://")) {
    video_id = url.replace(/^.*[\\/]/, "");
  } else if (url.includes("v=") && url.includes("www.youtube.com")) {
    video_id = url.split("v=")[1];
    let ampersandPosition = video_id.indexOf("&");
    if (ampersandPosition != -1) {
      video_id = video_id.substring(0, ampersandPosition);
    }
  } else if (
    url.includes("coaching.healthygamer.gg") &&
    url.includes("lessons")
  ) {
    video_id = url.split("/").slice(-1)[0];
  }
  return video_id;
}

function updateLocalStorage() {
  browser.tabs.query({ windowId: myWindowId, active: true }).then((tabs) => {
    let contentToStore = {};
    let url = tabs[0].url;
    let videoId = getVideoId(url);
    contentToStore[videoId] = JSON.stringify(markings);
    browser.storage.local.set(contentToStore);
  });
}

function updateTimeStarted() {
  browser.tabs.query({ windowId: myWindowId, active: true }).then((tabs) => {
    browser.tabs
      .sendMessage(tabs[0].id, { action: "getTime" })
      .then((response) => {
        timeStartWritingMarking = parseFloat(response.time);
      });
  });
}

function setVideoTime(seconds) {
  browser.tabs.query({ windowId: myWindowId, active: true }).then((tabs) => {
    browser.tabs.sendMessage(tabs[0].id, { action: "setTime", value: seconds });
  });
}

function createMarking(value, seconds, canExplain) {
  var checkbox = document.createElement("INPUT");
  checkbox.checked = canExplain;
  checkbox.setAttribute("type", "checkbox");
  checkbox.className = "canExplainCheckbox";
  checkbox.dataset.time = seconds;
  const marking = document.createElement("li");
  const time = document.createElement("p");
  time.className = "time";
  let date = new Date(0);
  date.setSeconds(seconds);
  let formatedSeconds = date.toISOString().substring(11, 19);
  time.innerText = formatedSeconds + ": ";
  const title = document.createElement("p");
  if (currentVideoTime && seconds > currentVideoTime) {
    title.className = "title dimmed";
  } else {
    title.className = "title";
  }
  title.innerText = value;
  title.dataset.time = seconds;
  marking.appendChild(checkbox);
  marking.appendChild(time);
  marking.appendChild(title);
  return marking;
}

async function startTabVideoListen(tabId) {
  try {
    await browser.tabs.sendMessage(tabId, {
      action: "sendTimeUpdates",
    });
  } catch (e) {}
}

async function endTabVideoListen(tabId) {
  try {
    await browser.tabs.sendMessage(tabId, {
      action: "stopTimeUpdates",
    });
  } catch (e) {}
}

async function updateContent() {
  console.log("update content");
  let tabs = await browser.tabs.query({
    windowId: myWindowId,
    active: true,
    status: "complete",
  });
  if (tabs.length == 0) {
    return;
  }
  let currentTabId = tabs[0].id;
  if (previousTabId != currentTabId) {
    await endTabVideoListen(previousTabId);
    await startTabVideoListen(currentTabId);
    previousTabId = currentTabId;
  }
  let url = tabs[0].url;
  let videoId = getVideoId(url);
  if (videoId === "") {
    markings = [];
    updateMarkingsHtml();
    return;
  }
  if (previousVideoId != videoId) {
    await startTabVideoListen(currentTabId);
    previousVideoId = videoId;
  }
  let storedInfo = await browser.storage.local.get(videoId);
  markingsHtml.innerHTML = "";
  markings = [];
  if (!storedInfo[Object.keys(storedInfo)[0]]) return;
  markings = JSON.parse(storedInfo[Object.keys(storedInfo)[0]]);
  updateMarkingsHtml();
}

function updateMarkingsHtml() {
  progressContainer.innerHTML = "";
  const progressHtml = document.createElement("progress");
  progressHtml.setAttribute("max", markings.length);
  let learnedNotes = 0;
  markings.forEach((marking) => {
    if (marking.canExplain) {
      learnedNotes++;
    }
  });
  progressHtml.setAttribute("value", learnedNotes);
  //progressContainer.appendChild(progressHtml);
  markingsHtml.innerHTML = "";
  markings.forEach((marking) => {
    const markingHtml = createMarking(
      marking.title,
      marking.time,
      marking.canExplain
    );
    markingsHtml.appendChild(markingHtml);
  });
}

browser.tabs.onActivated.addListener(updateContent);

browser.tabs.onUpdated.addListener(updateContent);

browser.windows.getCurrent({ populate: true }).then((windowInfo) => {
  myWindowId = windowInfo.id;
  updateContent();
});

browser.runtime.onMessage.addListener(handleMessage);

function handleMessage(request, sender, sendResponse) {
  if (request.action === "syncTime") {
    currentVideoTime = parseFloat(request.value);
    updateMarkingsHtml();
  }
}
