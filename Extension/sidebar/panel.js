let myWindowId;
const currentMark = document.querySelector("#currentMark");
const markings = document.querySelector("#markings");

currentMark.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    if (currentMark.value === "") return;
    const marking = createMarking(currentMark.value);
    markings.appendChild(marking);
    currentMark.value = "";
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
