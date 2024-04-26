let myWindowId;
const currentMark = document.querySelector("#currentMark");
const markings = document.querySelector("#markings");
let markingsToAdd = [];

currentMark.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    if (currentMark.value === "") return;
    const marking = createMarking(currentMark.value);
    markingsToAdd.push(marking);
    currentMark.value = "";
    browser.tabs.query({ windowId: myWindowId, active: true }).then((tabs) => {
      browser.tabs
        .sendMessage(tabs[0].id, { greeting: "Hi from background script" })
        .then((response) => {
          console.log("Message from the content script:");
          console.log(response.response);
        });
    });
  }
});

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
