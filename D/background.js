// Gemini Toolbox - background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'downloadFile') {
        chrome.downloads.download({
            url: request.url,
            filename: request.filename,
            saveAs: false // Set to true if you want to prompt the user for the save location
        }).then(downloadId => {
            console.log("Download started with ID:", downloadId);
            sendResponse({status: "success"});
        }).catch(err => {
            console.error("Download failed:", err);
            sendResponse({status: "error", message: err.message});
        });
        
        // Return true to indicate you wish to send a response asynchronously
        return true;
    }
});