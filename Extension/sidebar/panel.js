let myWindowId;
const currentMark = document.querySelector("#currentMark");
const markingsHtml = document.querySelector("#markings");
let markings = [];
let previousInputLength = 0;
const INVALID_START_TIME = -1;
let timeStartWritingMarking = INVALID_START_TIME;
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
    updateMarkingsHtml();
    currentMark.value = "";
    timeStartWritingMarking = INVALID_START_TIME;
    browser.tabs.query({ windowId: myWindowId, active: true }).then((tabs) => {
      let contentToStore = {};
      contentToStore[tabs[0].url] = JSON.stringify(markings);
      browser.storage.local.set(contentToStore);
    });
  }
});

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
  const marking = document.createElement("li");
  const time = document.createElement("a");
  let date = new Date(0);
  date.setSeconds(seconds);
  let formatedSeconds = date.toISOString().substring(11, 19);
  time.innerText = formatedSeconds + ": ";
  const title = document.createElement("p");
  title.innerText = value;
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
