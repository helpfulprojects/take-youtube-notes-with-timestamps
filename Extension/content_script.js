browser.runtime.onMessage.addListener((request) => {
  if (request.action === "getTime") {
    return Promise.resolve({
      time: document.querySelector("video").currentTime,
    });
  } else if (request.action === "setTime") {
    document.querySelector("video").currentTime = parseFloat(request.value);
  }
});
