browser.runtime.onMessage.addListener((request) => {
  console.log("Message from the sidebar:");
  console.log(request.greeting);
  return Promise.resolve({ response: "Hi from content script" });
});
