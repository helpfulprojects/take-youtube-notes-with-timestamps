let myWindowId;
const currentMark = document.querySelector("#currentMark");
const markingsHtml = document.querySelector("#markings");
let markings = [];
let previousInputLength = 0;
const INVALID_START_TIME = -1;
let timeStartWritingMarking = INVALID_START_TIME;

markingsHtml.addEventListener("mousedown", (event) => {
  if (event.which === 1 && event.target.tagName === "BUTTON") {
    let time = parseFloat(event.target.dataset.time);
    markings = markings.filter((marking) => marking.time != time);
    updateMarkingsHtml();
    updateLocalStorage();
  }
});

currentMark.addEventListener("keydown", (event) => {
  previousInputLength = event.target.value.length;
});
currentMark.addEventListener("keyup", (event) => {
  const startWritingMarking =
    event.target.value.length === 1 && previousInputLength == 0;
  if (startWritingMarking) {
    updateTimeStarted();
  }
  if (event.key === "Enter") {
    if (
      currentMark.value === "" ||
      timeStartWritingMarking === INVALID_START_TIME
    )
      return;
    markings.push({ title: currentMark.value, time: timeStartWritingMarking });
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
    currentMark.value = "";
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

function createMarking(value, seconds) {
  const btnDelete = document.createElement("button");
  btnDelete.innerText = "X";
  btnDelete.dataset.time = seconds;
  const btnEdit = document.createElement("button");
  btnEdit.innerText = "Edit";
  btnEdit.dataset.time = seconds;
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
  marking.appendChild(btnDelete);
  marking.appendChild(btnEdit);
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
