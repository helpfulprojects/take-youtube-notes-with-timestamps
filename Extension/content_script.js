browser.runtime.onMessage.addListener((request) => {
  if (request.action === "getTime") {
    return Promise.resolve({
      time: document.querySelector("video").currentTime,
    });
  }
});
