function onVideoTimeUpdate(evt) {
  console.log("EXT sending time", evt.target.currentTime);
  browser.runtime.sendMessage({
    action: "syncTime",
    value: evt.target.currentTime,
  });
}

browser.runtime.onMessage.addListener((request) => {
  if (request.action === "getTime") {
    return Promise.resolve({
      time: document.querySelector("video").currentTime,
    });
  } else if (request.action === "setTime") {
    document.querySelector("video").currentTime = parseFloat(request.value);
  } else if (request.action === "sendTimeUpdates") {
    document
      .querySelector("video")
      .addEventListener("timeupdate", onVideoTimeUpdate);
  } else if (request.action === "stopTimeUpdates") {
    document
      .querySelector("video")
      .removeEventListener("timeupdate", onVideoTimeUpdate);
  }
});
