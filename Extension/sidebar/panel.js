let myWindowId;
const currentMark = document.querySelector("#currentMark");
const markings = document.querySelector("#markings");
let markingsToAdd = [];
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
    console.log(timeStartWritingMarking);
    const marking = createMarking(currentMark.value);
    markingsToAdd.push(marking);
    currentMark.value = "";
    timeStartWritingMarking = INVALID_START_TIME;
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

function createMarking(value) {
  const marking = document.createElement("li");
  marking.innerText = value;
  return marking;
}

function updateContent() {
  browser.tabs
    .query({ windowId: myWindowId, active: true })
    .then((tabs) => {
      return browser.storage.local.get(tabs[0].url);
    })
    .then((storedInfo) => {
      //contentBox.innerText = storedInfo[Object.keys(storedInfo)[0]];
    });
}

browser.tabs.onActivated.addListener(updateContent);

browser.tabs.onUpdated.addListener(updateContent);

browser.windows.getCurrent({ populate: true }).then((windowInfo) => {
  myWindowId = windowInfo.id;
  updateContent();
});
