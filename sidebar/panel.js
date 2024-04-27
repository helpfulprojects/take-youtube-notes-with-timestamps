let myWindowId;
const currentMarkingHtml = document.querySelector("#currentMark");
const markingsHtml = document.querySelector("#markings");
let markings = [];
let previousInputLength = 0;
const INVALID_START_TIME = -1;
let timeStartWritingMarking = INVALID_START_TIME;

markingsHtml.addEventListener("mousedown", (event) => {
  if (event.which === 1 && event.target.className === "title") {
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
currentMarkingHtml.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    if (
      currentMarkingHtml.value === "" ||
      timeStartWritingMarking === INVALID_START_TIME
    )
      return;
    markings.push({
      title: currentMarkingHtml.value,
      time: timeStartWritingMarking,
    });
    markings.sort(function (x, y) {
      if (x.time < y.time) {
        return -1;
      }
      if (x.time > y.time) {
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

function updateLocalStorage() {
  browser.tabs.query({ windowId: myWindowId, active: true }).then((tabs) => {
    let contentToStore = {};
    contentToStore[tabs[0].url] = JSON.stringify(markings);
    browser.storage.local.set(contentToStore);
  });
}

function updateTimeStarted() {
  browser.tabs.query({ windowId: myWindowId, active: true }).then((tabs) => {
    browser.tabs
      .sendMessage(tabs[0].id, { action: "getTime" })
      .then((response) => {
        console.log("Got response", response);
        timeStartWritingMarking = parseFloat(response.time);
      });
  });
}

function setVideoTime(seconds) {
  browser.tabs.query({ windowId: myWindowId, active: true }).then((tabs) => {
    browser.tabs.sendMessage(tabs[0].id, { action: "setTime", value: seconds });
  });
}

function createMarking(value, seconds) {
  const marking = document.createElement("li");
  const time = document.createElement("p");
  time.className = "time";
  let date = new Date(0);
  date.setSeconds(seconds);
  let formatedSeconds = date.toISOString().substring(11, 19);
  time.innerText = formatedSeconds + ": ";
  const title = document.createElement("p");
  title.className = "title";
  title.innerText = value;
  title.dataset.time = seconds;
  marking.appendChild(time);
  marking.appendChild(title);
  return marking;
}

function updateContent() {
  browser.tabs
    .query({ windowId: myWindowId, active: true })
    .then((tabs) => {
      return browser.storage.local.get(tabs[0].url);
    })
    .then((storedInfo) => {
      markingsHtml.innerHTML = "";
      if (!storedInfo[Object.keys(storedInfo)[0]]) return;
      markings = JSON.parse(storedInfo[Object.keys(storedInfo)[0]]);
      updateMarkingsHtml();
    });
}

function updateMarkingsHtml() {
  markingsHtml.innerHTML = "";
  markings.forEach((marking) => {
    const markingHtml = createMarking(marking.title, marking.time);
    markingsHtml.appendChild(markingHtml);
  });
}

browser.tabs.onActivated.addListener(updateContent);

browser.tabs.onUpdated.addListener(updateContent);

browser.windows.getCurrent({ populate: true }).then((windowInfo) => {
  myWindowId = windowInfo.id;
  updateContent();
});
