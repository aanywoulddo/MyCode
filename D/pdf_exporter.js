// Gemini Toolbox - Enhanced PDF Export System
// Based on the dedicated Gemini to PDF extension

window.PDFExporter = class PDFExporter {
    constructor() {
        this.isExportDropdownOpen = false;
        this.isSettingsPopupOpen = false;
        this.selectedMessageCount = 0;
        this.exportSettings = {
            fileName: "gemini-conversation",
            format: "pdf",
            pdfTheme: "light",
            orientation: "portrait",
            compression: true,
            uiTheme: "light"
        };
        
        this.loadingSpinnerSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" width="18" height="18" style="shape-rendering: auto; display: block; background: transparent;" xmlns:xlink="http://www.w3.org/1999/xlink"><g><circle cx="50" cy="50" fill="none" stroke="currentColor" stroke-width="10" r="35" stroke-dasharray="164.93361431346415 56.97787143782138"><animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" values="0 50 50;360 50 50" keyTimes="0;1"></animateTransform></circle><g></g></g></svg>';
        
        this.checkmarkSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
        
        this.defaultIconSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="save-button-icon" width="18" height="18"><path d="M17 3H5C3.89 3 3 3.9 3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm2 16H5V5h11.17L19 7.83V19zm-7-7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM6 6h9v4H6z"></path></svg>';
    }

    init() {
        this.loadInitialExportSettings();
    }

    loadInitialExportSettings() {
        try {
            const saved = localStorage.getItem("gemini-exporter-settings");
            if (saved) {
                const settings = JSON.parse(saved);
                Object.keys(this.exportSettings).forEach(key => {
                    if (settings.hasOwnProperty(key)) {
                        if (key === "format" && !["pdf", "html", "md", "json", "txt", "csv"].includes(settings[key])) {
                            console.warn(`[PDF Exporter] Invalid format "${settings[key]}". Using default "${this.exportSettings.format}".`);
                        } else if (key === "pdfTheme" && !["auto", "light", "dark"].includes(settings[key])) {
                            console.warn(`[PDF Exporter] Invalid pdfTheme "${settings[key]}". Using default "${this.exportSettings.pdfTheme}".`);
                        } else if (key === "uiTheme" && !["auto", "light", "dark"].includes(settings[key])) {
                            console.warn(`[PDF Exporter] Invalid uiTheme "${settings[key]}". Using default "${this.exportSettings.uiTheme}".`);
                        } else if (key === "orientation" && !["portrait", "landscape"].includes(settings[key])) {
                            console.warn(`[PDF Exporter] Invalid orientation "${settings[key]}". Using default "${this.exportSettings.orientation}".`);
                        } else if (key === "compression" && typeof settings[key] !== "boolean") {
                            console.warn(`[PDF Exporter] Invalid compression value "${settings[key]}". Using default "${this.exportSettings.compression}".`);
                        } else {
                            this.exportSettings[key] = settings[key];
                        }
                    }
                });
                console.log("[PDF Exporter] Initial exporter settings loaded:", this.exportSettings);
            } else {
                console.log("[PDF Exporter] No saved settings found, using defaults:", this.exportSettings);
                this.saveExportSettings();
            }
        } catch (error) {
            console.error("[PDF Exporter] Failed to load initial exporter settings:", error);
        }
    }

    saveExportSettings() {
        try {
            localStorage.setItem("gemini-exporter-settings", JSON.stringify(this.exportSettings));
            console.log("[PDF Exporter] Exporter settings saved:", this.exportSettings);
        } catch (error) {
            console.error("[PDF Exporter] Failed to save exporter settings:", error);
        }
    }

    isDarkModeActive() {
        if (document.body.classList.contains("dark-theme")) {
            return true;
        }
        
        const bgColor = window.getComputedStyle(document.body).backgroundColor;
        if (bgColor) {
            const rgb = bgColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
                const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
                return brightness < 128;
            }
        }
        return false;
    }

    getCurrentTheme() {
        return this.exportSettings.uiTheme === "auto" ? 
            (this.isDarkModeActive() ? "dark" : "light") : 
            this.exportSettings.uiTheme;
    }

    getFormattedTimestamp() {
        const now = new Date();
        return `${now.toISOString().split('T')[0]}-${now.toTimeString().split(' ')[0].replace(/:/g, '-')}`;
    }

    generateFilename(baseName, format) {
        const timestamp = this.getFormattedTimestamp();
        return `${baseName.replace(/[^a-z0-9_\-]/gi, '_') || 'gemini-conversation'}-${timestamp}.${format}`;
    }

    downloadData(content, filename, mimeType) {
        try {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log(`[PDF Exporter] Successfully initiated download for ${filename}`);
        } catch (error) {
            console.error(`[PDF Exporter] Error creating download for ${filename}:`, error);
            alert(`Failed to initiate download for ${filename}. See console for details.`);
        }
    }

    async scrollToTopAndWait(options = {}) {
        const { loadWaitTimeout = 2000, maxTotalTime = 30000, maxScrollAttempts = 100 } = options;
        
        console.log("[PDF Exporter] Starting robust scroll to top...");
        
        return new Promise(async (resolve, reject) => {
            let scroller;
            try {
                scroller = this.getScrollHost();
                if (!scroller) {
                    throw new Error("Scroll container returned null.");
                }
                
                const scrollableElement = scroller === document.documentElement ? document.body : scroller;
                if (scrollableElement.scrollHeight <= scrollableElement.clientHeight) {
                    console.log("[PDF Exporter] Scroller content doesn't exceed its height. No scrolling needed.");
                    return resolve();
                }
            } catch (error) {
                console.error(`[PDF Exporter] Error finding scroll container: ${error.message}`);
                return reject(new Error("Scroll container lookup failed. Cannot scroll."));
            }

            const startTime = Date.now();
            let scrollAttempts = 0;
            const messageSelector = 'div.conversation-container';
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            
            const scrollTarget = scroller === document.documentElement ? window : scroller;
            const scrollableElement = scroller === document.documentElement ? document.body : scroller;

            while (scrollAttempts < maxScrollAttempts) {
                if (Date.now() - startTime > maxTotalTime) {
                    console.warn(`[PDF Exporter] Scroll timeout reached after ${maxTotalTime}ms.`);
                    return reject(new Error(`Scroll process timed out after ${maxTotalTime}ms.`));
                }

                const currentMessageCount = scroller.querySelectorAll(messageSelector).length;
                const currentScrollTop = scrollTarget === window ? window.scrollY : scrollTarget.scrollTop;
                
                console.log(`[PDF Exporter] Scroll attempt ${scrollAttempts + 1}: Current messages: ${currentMessageCount}, ScrollTop: ${currentScrollTop}`);

                if (currentScrollTop === 0 && scrollAttempts > 0) {
                    console.log("[PDF Exporter] Reached scrollTop 0. Checking for final loads...");
                    await delay(loadWaitTimeout);
                    
                    const finalMessageCount = scroller.querySelectorAll(messageSelector).length;
                    if (finalMessageCount === currentMessageCount) {
                        console.log("[PDF Exporter] ScrollTop is 0 and no new messages loaded after wait. Scrolling complete.");
                        return resolve();
                    }
                    console.log(`[PDF Exporter] Messages loaded after reaching top (${currentMessageCount} -> ${finalMessageCount}). Continuing check.`);
                }

                if (scrollTarget === window) {
                    window.scrollTo(0, 0);
                } else {
                    scrollTarget.scrollTop = 0;
                    scrollTarget.dispatchEvent(new Event('scroll'));
                }
                console.log("[PDF Exporter] Scrolled to top (scrollTop set to 0).");

                let newMessagesLoaded = false;
                const waitStartTime = Date.now();
                
                while (Date.now() - waitStartTime < loadWaitTimeout) {
                    const newMessageCount = scroller.querySelectorAll(messageSelector).length;
                    if (newMessageCount > currentMessageCount) {
                        console.log(`[PDF Exporter] New messages loaded (${currentMessageCount} -> ${newMessageCount}).`);
                        newMessagesLoaded = true;
                        break;
                    }
                    
                    const newScrollTop = scrollTarget === window ? window.scrollY : scrollTarget.scrollTop;
                    if (newScrollTop > 5 && currentScrollTop === 0) {
                        console.warn(`[PDF Exporter] Scroll position changed unexpectedly after scroll attempt (${newScrollTop}). Waiting might be interrupted.`);
                    }
                    
                    await delay(100);
                }

                if (!newMessagesLoaded) {
                    const finalScrollTop = scrollTarget === window ? window.scrollY : scrollTarget.scrollTop;
                    if (finalScrollTop === 0) {
                        console.log("[PDF Exporter] Scrolled, waited, no new messages loaded, and still at scrollTop 0. Assuming end of history.");
                        return resolve();
                    }
                    console.warn(`[PDF Exporter] Scrolled, waited, no new messages, but scrollTop is now ${finalScrollTop}. Continuing loop cautiously.`);
                }

                scrollAttempts++;
                await delay(50);
            }

            console.warn(`[PDF Exporter] Reached max scroll attempts (${maxScrollAttempts}). Finishing scroll process.`);
            resolve();
        });
    }

    getScrollHost() {
        let scroller = document.querySelector('#chat-history[data-test-id="chat-history-container"]');
        if (scroller) {
            console.log("[PDF Exporter] Found scroll container by specific ID/data-test-id");
            return scroller;
        }

        scroller = document.querySelector("infinite-scroller.chat-history");
        if (scroller) {
            console.log("[PDF Exporter] Found scroll container by custom element name + class");
            return scroller;
        }

        scroller = document.querySelector(".chat-history-scroll-container");
        if (scroller) {
            console.log("[PDF Exporter] Found scroll container by common class name");
            return scroller;
        }

        const mainArea = document.querySelector("main .conversation-area");
        if (mainArea) {
            const divs = mainArea.querySelectorAll("div");
            for (const div of divs) {
                const style = window.getComputedStyle(div);
                if ((style.overflowY === "auto" || style.overflowY === "scroll") && div.clientHeight > 300) {
                    console.log("[PDF Exporter] Found potential scroll container by computed style within main area");
                    return div;
                }
            }
        }

        scroller = document.querySelector("infinite-scroller");
        if (scroller) {
            console.warn("[PDF Exporter] Found scroll container by 'infinite-scroller' tag name (fallback).");
            return scroller;
        }

        console.error("[PDF Exporter] All specific scroll container selectors failed. Falling back to documentElement. Scrolling might not work correctly.");
        return document.documentElement;
    }

    extractConversationElements() {
        const messages = [];
        let scroller;
        
        try {
            scroller = this.getScrollHost();
            if (!scroller) {
                throw new Error("Scroller element not found.");
            }
        } catch (error) {
            console.error("[PDF Exporter] Could not find chat history scroller for extraction:", error);
            return messages;
        }

        const containers = scroller.querySelectorAll("div.conversation-container");
        console.log(`[PDF Exporter] Found ${containers.length} conversation containers within scroller.`);

        containers.forEach(container => {
            const userElement = container.querySelector("user-query, user-query-content");
            const assistantElement = container.querySelector("message-content");

            let question = "";
            const userQueryLine = userElement?.querySelector(".query-text-line");
            if (userQueryLine) {
                question = userQueryLine.innerHTML.trim();
            } else if (userElement) {
                const cloned = userElement.cloneNode(true);
                cloned.querySelectorAll("mat-icon, .icon-button").forEach(el => el.remove());
                question = cloned.innerHTML.trim();
            }

            let answer = "";
            const assistantContent = assistantElement?.querySelector(".markdown-main-panel, .output-content .markdown, .output-content");
            if (assistantContent) {
                answer = assistantContent.innerHTML.trim();
            } else if (assistantElement) {
                const cloned = assistantElement.cloneNode(true);
                cloned.querySelectorAll("message-actions, mat-icon-button, .icon-button, response-actions").forEach(el => el.remove());
                answer = cloned.innerHTML.trim();
            }

            if (question || answer) {
                const questionDiv = document.createElement('div');
                questionDiv.innerHTML = question;
                questionDiv.querySelectorAll(".gemini-export-checkbox-container").forEach(el => el.remove());

                const answerDiv = document.createElement('div');
                answerDiv.innerHTML = answer;
                answerDiv.querySelectorAll(".gemini-export-checkbox-container").forEach(el => el.remove());

                messages.push({
                    question: questionDiv.innerHTML || null,
                    answer: answerDiv.innerHTML || null
                });
            }
        });

        return messages;
    }

    showExportModal() {
        console.log("[PDF Exporter] Showing export modal");
        this.showExportDropdown();
    }

    showExportDropdown() {
        const isDark = this.getCurrentTheme() === "dark";
        
        // Create dropdown modal
        const modal = document.createElement('div');
        modal.id = 'pdf-export-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: 'Google Sans', sans-serif;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: ${isDark ? '#303134' : '#fff'};
            border-radius: 8px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            color: ${isDark ? '#e8eaed' : '#202124'};
            box-shadow: 0 4px 15px ${isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.15)'};
        `;

        modalContent.innerHTML = `
            <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 500;">Export Options</h2>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Export Format:</label>
                <select id="export-format-select" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid ${isDark ? '#5f6368' : '#dadce0'}; background: ${isDark ? '#202124' : '#fff'}; color: ${isDark ? '#e8eaed' : '#202124'};">
                    <option value="pdf" ${this.exportSettings.format === 'pdf' ? 'selected' : ''}>PDF</option>
                    <option value="html" ${this.exportSettings.format === 'html' ? 'selected' : ''}>HTML</option>
                    <option value="md" ${this.exportSettings.format === 'md' ? 'selected' : ''}>Markdown</option>
                    <option value="json" ${this.exportSettings.format === 'json' ? 'selected' : ''}>JSON</option>
                    <option value="txt" ${this.exportSettings.format === 'txt' ? 'selected' : ''}>Text</option>
                    <option value="csv" ${this.exportSettings.format === 'csv' ? 'selected' : ''}>CSV</option>
                </select>
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">File Name:</label>
                <input type="text" id="export-filename" value="${this.exportSettings.fileName}" placeholder="gemini-conversation" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid ${isDark ? '#5f6368' : '#dadce0'}; background: ${isDark ? '#202124' : '#fff'}; color: ${isDark ? '#e8eaed' : '#202124'};">
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                <button id="cancel-export" style="padding: 8px 16px; border: 1px solid ${isDark ? '#5f6368' : '#dadce0'}; background: transparent; color: ${isDark ? '#e8eaed' : '#5f6368'}; border-radius: 4px; cursor: pointer;">Cancel</button>
                <button id="start-export" style="padding: 8px 16px; border: none; background: #1a73e8; color: white; border-radius: 4px; cursor: pointer;">Export</button>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('#cancel-export').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#start-export').addEventListener('click', () => {
            this.performExport(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Update settings when changed
        modal.querySelector('#export-format-select').addEventListener('change', (e) => {
            this.exportSettings.format = e.target.value;
        });

        modal.querySelector('#export-filename').addEventListener('input', (e) => {
            this.exportSettings.fileName = e.target.value.trim();
        });
    }

    async performExport(modal) {
        const format = this.exportSettings.format;
        const fileName = this.exportSettings.fileName || 'gemini-conversation';
        
        const exportButton = modal.querySelector('#start-export');
        const originalContent = exportButton.innerHTML;
        
        try {
            // Show loading state
            exportButton.innerHTML = `${this.loadingSpinnerSVG} Exporting...`;
            exportButton.disabled = true;

            // Scroll to top to ensure all content is loaded
            await this.scrollToTopAndWait();

            // Extract conversation content
            const conversation = this.extractConversationElements();
            
            if (!conversation || conversation.length === 0) {
                throw new Error("No conversation content found to export");
            }

            console.log(`[PDF Exporter] Extracted ${conversation.length} message pairs. Exporting as ${format.toUpperCase()}.`);

            // Perform export based on format
            switch (format) {
                case 'pdf':
                    await this.generatePDF(conversation);
                    break;
                case 'html':
                    this.downloadAsHTML(conversation, fileName);
                    break;
                case 'md':
                    this.downloadAsMarkdown(conversation, fileName);
                    break;
                case 'json':
                    this.downloadAsJSON(conversation, fileName);
                    break;
                case 'txt':
                    this.downloadAsTXT(conversation, fileName);
                    break;
                case 'csv':
                    this.downloadAsCSV(conversation, fileName);
                    break;
                default:
                    throw new Error(`Unknown export format: ${format}`);
            }

            // Show success state
            exportButton.innerHTML = `${this.checkmarkSVG} Exported!`;
            
            // Save settings
            this.saveExportSettings();
            
            // Close modal after delay
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 1500);

        } catch (error) {
            console.error('[PDF Exporter] Export failed:', error);
            alert(`Export failed: ${error.message}`);
            
            // Reset button state
            exportButton.innerHTML = originalContent;
            exportButton.disabled = false;
        }
    }

    // Export format methods will be implemented in the next part...
    
    downloadAsHTML(conversation, fileName) {
        const filename = this.generateFilename(fileName, 'html');
        let theme = 'light';
        if (this.exportSettings.pdfTheme === 'dark' || (this.exportSettings.pdfTheme === 'auto' && document.body.classList.contains('dark-theme'))) {
            theme = 'dark';
        }
        
        console.log(`[PDF Exporter] Exporting HTML with theme: ${theme}`);
        const htmlContent = this.formatConversationHTML(conversation, theme);
        this.downloadData(htmlContent, filename, 'text/html;charset=utf-8');
    }

    formatConversationHTML(conversation, theme = 'light') {
        const isDark = theme === 'dark';
        const bgPrimary = isDark ? '#131314' : '#FFFFFF';
        const textPrimary = isDark ? '#e8eaed' : '#1f1f1f';
        const bgSecondary = isDark ? 'rgba(255, 255, 255, 0.03)' : '#F7F7F7';
        const textSecondary = isDark ? '#9aa0a6' : '#5f6368';
        const borderColor = isDark ? '#282829' : '#EFEFEF';
        const linkColor = isDark ? '#8ab4f8' : '#1a73e8';

        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.exportSettings.fileName || 'Gemini Conversation'}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto+Mono&display=swap');
        html { background-color: ${bgPrimary}; }
        body { 
            font-family: 'Google Sans', sans-serif, Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: ${bgPrimary}; 
            color: ${textPrimary};
            font-size: 10pt;
            line-height: 1.4;
        }
        .conversation-wrapper { max-width: 800px; margin: 0 auto; }
        .export-header h1 {
            font-size: 16pt;
            font-weight: 500;
            color: ${textPrimary};
            margin-bottom: 4px;
        }
        .export-header .timestamp {
            font-size: 8pt;
            font-style: italic;
            color: ${textSecondary};
            margin-bottom: 16px;
        }
        .export-header hr {
            border: none;
            border-top: 1px solid ${borderColor};
            margin-bottom: 16px;
        }
        .message-pair { 
            margin-bottom: 16px; 
            border: 1px solid ${borderColor}; 
            border-radius: 8px; 
            overflow: hidden; 
        }
        .message-part { 
            padding: 8px;
        }
        .message-part.question { background-color: ${bgSecondary}; }
        .message-part.answer { background-color: ${bgPrimary}; }
        
        .speaker-label {
            font-size: 10pt;
            font-weight: bold;
            color: ${textPrimary};
            margin: 0 0 4px 0;
        }
        .content { 
            min-width: 0; 
            word-wrap: break-word; 
            color: inherit;
            font-size: 10pt;
            line-height: 1.4;
        }
        .content * { max-width: 100%; box-sizing: border-box; }
        .content p { margin: 0.5em 0; }
        .content ul, .content ol { padding-left: 25px; margin: 0.5em 0; }
        .content li { margin-bottom: 5px; }
        .content strong, .content b { font-weight: bold; }
        .content em, .content i { font-style: italic; }
        
        a { color: ${linkColor}; text-decoration: none; }
        a:hover { text-decoration: underline; }
        img { height: auto; border-radius: 4px; margin: 5px 0; }
        sources-carousel-inline, sources-carousel, source-footnote { display: none !important; }
    </style>
</head>
<body>
    <div class="conversation-wrapper">
        <div class="export-header">
        <h1>${this.exportSettings.fileName || 'Gemini Conversation'}</h1>
            <p class="timestamp">Exported on: ${new Date().toLocaleString()}</p>
            <hr>
        </div>
`;

        conversation.forEach(msg => {
            html += '<div class="message-pair">\n';
            
            if (msg.question) {
                html += `    <div class="message-part question">
        <p class="speaker-label user-label"><strong>User</strong></p>
        <div class="content">${msg.question}</div>
    </div>
`;
            }
            
            if (msg.answer) {
                const borderStyle = msg.question ? `border-top: 1px solid ${borderColor};` : '';
                html += `    <div class="message-part answer" style="${borderStyle}">
        <p class="speaker-label gemini-label"><strong>Gemini</strong></p>
        <div class="content">${msg.answer}</div>
    </div>
`;
            }
            
            html += '</div>\n';
        });

        html += `
    </div>
</body>
</html>`;

        return html;
    }

    downloadAsMarkdown(conversation, fileName) {
        const filename = this.generateFilename(fileName, 'md');
        let markdown = `# ${fileName || 'Gemini Conversation'}\nExported on: ${new Date().toLocaleString()}\n\n---\n\n`;
        
        conversation.forEach(msg => {
            if (msg.question) {
                markdown += `**You:**\n${this.convertHtmlToMarkdown(msg.question)}\n\n`;
            }
            if (msg.answer) {
                markdown += `**Gemini:**\n${this.convertHtmlToMarkdown(msg.answer)}\n\n`;
            }
            markdown += '---\n\n';
        });
        
        this.downloadData(markdown, filename, 'text/markdown;charset=utf-8');
    }

    convertHtmlToMarkdown(html) {
        if (!html) return '';
        
        let markdown = html;
        const tempDiv = document.createElement('div');
        
        function processElement(element) {
            if (!element || typeof element.nodeName !== 'string') return '';
            
            let result = '';
            switch (element.nodeName) {
                case '#text':
                    result = (element.textContent || '').replace(/([*_~])/g, '\\$1');
                    break;
                case 'P':
                    result = getInnerContent(element) + '\n\n';
                    break;
                case 'H1':
                    result = '# ' + getInnerContent(element) + '\n\n';
                    break;
                case 'H2':
                    result = '## ' + getInnerContent(element) + '\n\n';
                    break;
                case 'H3':
                    result = '### ' + getInnerContent(element) + '\n\n';
                    break;
                case 'STRONG':
                case 'B':
                    result = '**' + getInnerContent(element) + '**';
                    break;
                case 'EM':
                case 'I':
                    result = '*' + getInnerContent(element) + '*';
                    break;
                case 'CODE':
                    result = element.closest('pre, code-block') ? 
                        (element.textContent || '') : 
                        '`' + element.textContent + '`';
                    break;
                case 'PRE':
                    result = '```\n' + (element.textContent || '') + '\n```\n\n';
                    break;
                default:
                    result = getInnerContent(element);
            }
            return result;
        }
        
        function getInnerContent(element) {
            if (!element || !element.childNodes) return '';
            return Array.from(element.childNodes).map(processElement).join('');
        }
        
        tempDiv.innerHTML = html;
        tempDiv.querySelectorAll('div.code-block-decoration, sources-carousel-inline, sources-carousel, source-footnote').forEach(el => el.remove());
        
        markdown = getInnerContent(tempDiv);
        markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
        
        return markdown;
    }

    downloadAsJSON(conversation, fileName) {
        const filename = this.generateFilename(fileName, 'json');
        const jsonData = {
            title: fileName || 'Gemini Conversation',
            exportedAt: new Date().toISOString(),
            conversation: conversation.map(msg => ({
                question: msg.question || null,
                answer: msg.answer || null
            }))
        };
        
        this.downloadData(JSON.stringify(jsonData, null, 2), filename, 'application/json;charset=utf-8');
    }

    downloadAsTXT(conversation, fileName) {
        const filename = this.generateFilename(fileName, 'txt');
        let text = `${fileName || 'Gemini Conversation'}\n`;
        text += `Exported on: ${new Date().toLocaleString()}\n\n`;
        text += '-----------------------------------------------------\n\n';
        
        const stripHtml = (html) => {
            if (!html) return '';
            const div = document.createElement('div');
            div.innerHTML = html;
            div.querySelectorAll('.gemini-export-checkbox-container, style, script, sources-carousel-inline, sources-carousel, source-footnote').forEach(el => el.remove());
            return (div.textContent || div.innerText || '').trim();
        };
        
        conversation.forEach(msg => {
            if (msg.question) {
                text += `User:\n${stripHtml(msg.question)}\n\n`;
            }
            if (msg.answer) {
                text += `Gemini:\n${stripHtml(msg.answer)}\n\n`;
            }
            text += '-----------------------------------------------------\n\n';
        });
        
        this.downloadData(text, filename, 'text/plain;charset=utf-8');
    }

    downloadAsCSV(conversation, fileName) {
        const filename = this.generateFilename(fileName, 'csv');
        
        const stripHtml = (html) => {
            if (!html) return '';
            const div = document.createElement('div');
            div.innerHTML = html;
            div.querySelectorAll('.gemini-export-checkbox-container, style, script, sources-carousel-inline, sources-carousel, source-footnote').forEach(el => el.remove());
            return (div.textContent || div.innerText || '').trim();
        };
        
        const escapeCSV = (value) => {
            if (value == null) return '';
            let str = value.toString();
            str = str.replace(/"/g, '""');
            if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                str = `"${str}"`;
            }
            return str;
        };
        
        let csv = 'Timestamp,Speaker,Content\n';
        
        conversation.forEach((msg, index) => {
            const timestamp = new Date().toISOString();
            
            if (msg.question) {
                const speaker = 'User';
                const content = stripHtml(msg.question);
                csv += `${escapeCSV(timestamp)},${escapeCSV(speaker)},${escapeCSV(content)}\n`;
            }
            
            if (msg.answer) {
                const speaker = 'Gemini';
                const content = stripHtml(msg.answer);
                csv += `${escapeCSV(timestamp)},${escapeCSV(speaker)},${escapeCSV(content)}\n`;
            }
        });
        
        this.downloadData(csv, filename, 'text/csv;charset=utf-8');
    }

    // PDF generation will be continued in next part due to length...
    async generatePDF(conversation) {
        if (typeof html2pdf === 'undefined') {
            throw new Error('PDF generation library (html2pdf) is not available. Please wait a moment or reload the page.');
        }

        let theme = 'light';
        if (this.exportSettings.pdfTheme === 'dark' || (this.exportSettings.pdfTheme === 'auto' && document.body.classList.contains('dark-theme'))) {
            theme = 'dark';
        }
        
        const isDark = theme === 'dark';
        console.log(`[PDF Exporter] Starting PDF generation process (Theme: ${theme})`);

        return new Promise((resolve, reject) => {
            // Create temporary container for PDF rendering
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.zIndex = '-1';
            
            const bgPrimary = isDark ? '#131314' : '#FFFFFF';
            const textPrimary = isDark ? '#e8eaed' : '#1f1f1f';
            
            container.style.backgroundColor = bgPrimary;
            container.style.color = textPrimary;
            container.style.fontFamily = "'Google Sans', sans-serif, Arial, sans-serif";
            container.style.fontSize = '10pt';
            container.style.lineHeight = '1.4';

            // Add PDF-specific styles
            const style = document.createElement('style');
            style.textContent = this.getPDFStyles(isDark);
            container.appendChild(style);

            const wrapper = document.createElement('div');
            wrapper.className = 'pdf-render-wrapper';
            container.appendChild(wrapper);

            // Clean HTML content for PDF
            const cleanContent = (html) => {
                if (!html) return '';
                try {
                    const div = document.createElement('div');
                    div.innerHTML = html;
                    
                    // Remove unwanted elements
                    ['sources-carousel-inline', 'sources-carousel', 'source-footnote', '.code-block-decoration .buttons', '.gemini-export-checkbox-container'].forEach(selector => {
                        div.querySelectorAll(selector).forEach(el => el.remove());
                    });
                    
                    // Remove jslog attributes
                    div.querySelectorAll('[jslog]').forEach(el => el.removeAttribute('jslog'));
                    
                    return div.innerHTML;
                } catch (error) {
                    console.error('[PDF Exporter] Error cleaning HTML content:', error);
                    return html;
                }
            };

            // Create header
            const header = document.createElement('div');
            header.className = 'export-header';
            
            const title = document.createElement('h1');
            title.textContent = this.exportSettings.fileName || 'Gemini Conversation';
            header.appendChild(title);
            
            const timestamp = document.createElement('p');
            timestamp.className = 'timestamp';
            timestamp.textContent = `Exported on: ${new Date().toLocaleString()}`;
            header.appendChild(timestamp);
            
            const hr = document.createElement('hr');
            header.appendChild(hr);
            
            wrapper.appendChild(header);

            // Add conversation content
            conversation.forEach(msg => {
                const messagePair = document.createElement('div');
                messagePair.className = 'message-pair';
                
                if (msg.question) {
                    const questionDiv = document.createElement('div');
                    questionDiv.className = 'message-part question';
                    
                    const questionLabel = document.createElement('p');
                    questionLabel.className = 'speaker-label user-label';
                    questionLabel.innerHTML = '<strong>User</strong>';
                    
                    const questionContent = document.createElement('div');
                    questionContent.className = 'content';
                    questionContent.innerHTML = cleanContent(msg.question);
                    
                    questionDiv.appendChild(questionLabel);
                    questionDiv.appendChild(questionContent);
                    messagePair.appendChild(questionDiv);
                }
                
                if (msg.answer) {
                    const answerDiv = document.createElement('div');
                    answerDiv.className = 'message-part answer';
                    if (msg.question) {
                        answerDiv.style.borderTop = `1px solid ${isDark ? '#282829' : '#EFEFEF'}`;
                    }
                    
                    const answerLabel = document.createElement('p');
                    answerLabel.className = 'speaker-label gemini-label';
                    answerLabel.innerHTML = '<strong>Gemini</strong>';
                    
                    const answerContent = document.createElement('div');
                    answerContent.className = 'content';
                    answerContent.innerHTML = cleanContent(msg.answer);
                    
                    answerDiv.appendChild(answerLabel);
                    answerDiv.appendChild(answerContent);
                    messagePair.appendChild(answerDiv);
                }
                
                if (messagePair.querySelector('.content')?.innerHTML.trim()) {
                    wrapper.appendChild(messagePair);
                }
            });

            if (!wrapper.querySelector('.message-pair')) {
                const error = 'No content found to generate PDF.';
                console.warn('[PDF Exporter]', error);
                container.parentNode === document.body && document.body.removeChild(container);
                return reject(new Error(error));
            }

            document.body.appendChild(container);
            console.log('[PDF Exporter] PDF content container added to body for rendering.');

            const filename = this.generateFilename(this.exportSettings.fileName, 'pdf');
            
            const options = {
                margin: 0,
                filename: filename,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { 
                    scale: 2, 
                    useCORS: true, 
                    backgroundColor: bgPrimary,
                    logging: false,
                    letterRendering: true
                },
                jsPDF: { 
                    unit: 'pt', 
                    format: 'a4', 
                    orientation: this.exportSettings.orientation,
                    compress: this.exportSettings.compression
                },
                pagebreak: { mode: ['css', 'avoid-all', 'legacy'] }
            };

            console.log('[PDF Exporter] html2pdf options:', options);

            setTimeout(() => {
                html2pdf()
                    .from(wrapper)
                    .set(options)
                    .save()
                    .then(() => {
                        console.log('[PDF Exporter] PDF download initiated.');
                        resolve();
                    })
                    .catch(error => {
                        console.error('[PDF Exporter] PDF generation failed:', error);
                        if (error && error.message && /CORS/.test(error.message)) {
                            reject(new Error(`PDF Generation Error: Failed to load some content (like images) due to security restrictions (CORS). Try exporting as HTML for full fidelity.\n\nDetails: ${error.message}`));
                        } else {
                            reject(new Error(`PDF Generation Error: ${error.message || 'Unknown error'}`));
                        }
                    })
                    .finally(() => {
                        if (container.parentNode === document.body) {
                            document.body.removeChild(container);
                            console.log('[PDF Exporter] Temporary PDF container removed from body.');
                        }
                    });
            }, 150);
        });
    }

    getPDFStyles(isDark) {
        const bgPrimary = isDark ? '#131314' : '#FFFFFF';
        const textPrimary = isDark ? '#e8eaed' : '#1f1f1f';
        const bgSecondary = isDark ? 'rgba(255, 255, 255, 0.03)' : '#F7F7F7';
        const textSecondary = isDark ? '#9aa0a6' : '#5f6368';
        const borderColor = isDark ? '#282829' : '#EFEFEF';
        
        return `
            @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap');
            .pdf-render-wrapper * { box-sizing: border-box; font-family: inherit; color: inherit; line-height: inherit; }
            .pdf-render-wrapper {
                background-color: ${bgPrimary} !important; 
                color: ${textPrimary} !important;
                font-size: 10pt; 
                line-height: 1.4;
                padding: 20pt;
                margin: 0; width: 100%; box-sizing: border-box;
            }
            .pdf-render-wrapper .export-header h1 {
                font-size: 16pt;
                font-weight: 500;
                color: ${textPrimary};
                margin-bottom: 4pt;
            }
            .pdf-render-wrapper .export-header .timestamp {
                font-size: 8pt;
                font-style: italic;
                color: ${textSecondary};
                margin-bottom: 16pt;
            }
            .pdf-render-wrapper .export-header hr {
                border: none;
                border-top: 1px solid ${borderColor};
                margin-bottom: 16pt;
            }
            .pdf-render-wrapper .message-pair { 
                margin-bottom: 16pt; 
                page-break-inside: avoid; 
                border: 1px solid ${borderColor}; 
                border-radius: 6pt;
                overflow: hidden; 
            }
            .pdf-render-wrapper .message-part { 
                padding: 8pt;
            }
            .pdf-render-wrapper .message-part.question { background-color: ${bgSecondary}; }
            .pdf-render-wrapper .message-part.answer { background-color: ${bgPrimary}; }
            
            .pdf-render-wrapper .speaker-label {
                font-size: 10pt;
                font-weight: bold;
                color: ${textPrimary};
                margin: 0 0 4pt 0;
            }
            .pdf-render-wrapper .content { 
                min-width: 0; word-wrap: break-word; 
                font-size: 10pt; 
                line-height: 1.4; 
            }
            .pdf-render-wrapper sources-carousel-inline, 
            .pdf-render-wrapper sources-carousel, 
            .pdf-render-wrapper source-footnote { display: none !important; }
        `;
    }
};

// Initialize the PDF exporter when the script loads
if (typeof window !== 'undefined') {
    window.pdfExporterInstance = new PDFExporter();
    window.pdfExporterInstance.init();
}