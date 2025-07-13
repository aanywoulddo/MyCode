// Gemini Toolbox - chat_exporter.js

class ChatExporter {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
        this.originalURL = window.location.href;
    }

    /**
     * Shows a modal to select the export format for a given chat.
     * @param {string} chatId The ID of the chat to export.
     * @param {string} chatTitle The title of the chat.
     */
    showFormatSelection(chatId, chatTitle) {
        let modal = document.createElement('div');
        modal.id = 'format-selection-modal';
        modal.className = 'gemini-modal-backdrop';
        modal.innerHTML = `
            <div class="gemini-modal-content" style="max-width: 400px;">
                <div class="gemini-modal-header">
                    <h2 style="font-size: 18px;">Export "${chatTitle}"</h2>
                    <button class="gemini-modal-close-btn">&times;</button>
                </div>
                <div class="gemini-modal-body format-selector">
                    <button data-format="pdf" class="format-btn">PDF</button>
                    <button data-format="html" class="format-btn">HTML</button>
                    <button data-format="md" class="format-btn">Markdown</button>
                    <button data-format="txt" class="format-btn">Text</button>
                    <button data-format="json" class="format-btn">JSON</button>
                </div>
            </div>
        `;
        this.shadowRoot.appendChild(modal);

        modal.querySelector('.gemini-modal-close-btn').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        modal.querySelectorAll('.format-btn').forEach(btn => {
            btn.onclick = () => {
                const format = btn.dataset.format;
                modal.remove();
                this.startExportProcess(chatId, chatTitle, format);
            };
        });
    }

    /**
     * Orchestrates the entire export process.
     */
    async startExportProcess(chatId, chatTitle, format) {
        this.showOverlay("Navigating to chat...");
        this.originalURL = window.location.href; // Save current URL

        // Clean the chat ID - remove 'c_' prefix if it exists
        const cleanChatId = chatId.startsWith('c_') ? chatId.substring(2) : chatId;

        // Navigate to the target chat page using the correct URL format
        window.location.href = `https://gemini.google.com/app/${cleanChatId}`;

        try {
            // Wait for the conversation to be loaded on the new page
            await this.waitForElement('message-content', document, 20000);
            await this.delay(2000); // Extra delay for content rendering

            this.updateOverlay("Loading full conversation...");
            await this.scrollToTopAndWait({
                loadWaitTimeout: 3000,
                maxTotalTime: 45000,
                maxScrollAttempts: 150
            });

            this.updateOverlay("Extracting content...");
            const conversation = this.extractConversationElements();
            if (!conversation || conversation.length === 0) {
                throw new Error("No content could be extracted from the chat. The page may not have finished loading, or the chat format has changed.");
            }

            this.updateOverlay(`Generating ${format.toUpperCase()} file...`);
            const fileNameBase = chatTitle.replace(/[^a-z0-9_\-]/gi, '_') || "gemini-conversation";

            switch (format) {
                case 'pdf':
                    await this.generatePDF(conversation, fileNameBase);
                    break;
                case 'html':
                    this.downloadAsHTML(conversation, fileNameBase);
                    break;
                case 'md':
                    this.downloadAsMarkdown(conversation, fileNameBase);
                    break;
                case 'txt':
                    this.downloadAsTXT(conversation, fileNameBase);
                    break;
                case 'json':
                    this.downloadAsJSON(conversation, fileNameBase);
                    break;
            }

            this.updateOverlay("Export successful!", true);
        } catch (error) {
            console.error("Gemini Exporter Error:", error);
            this.updateOverlay(`Error: ${error.message}`, true, true);
        } finally {
            // After a delay, navigate back to the original page
            setTimeout(() => {
                this.hideOverlay();
                if (window.location.href !== this.originalURL) {
                    window.location.href = this.originalURL;
                }
            }, 3000);
        }
    }
    
    // --- UI HELPER METHODS ---

    showOverlay(message) {
        let overlay = this.shadowRoot.querySelector('#exporter-overlay');
        if (overlay) overlay.remove();

        overlay = document.createElement('div');
        overlay.id = 'exporter-overlay';
        overlay.innerHTML = `
            <div class="exporter-overlay-content">
                <div class="exporter-spinner"></div>
                <div class="exporter-message">${message}</div>
            </div>
        `;
        this.shadowRoot.appendChild(overlay);
    }

    updateOverlay(message, isFinal = false, isError = false) {
        const overlay = this.shadowRoot.querySelector('#exporter-overlay');
        if (!overlay) return;

        overlay.querySelector('.exporter-message').textContent = message;

        if (isFinal) {
            const spinner = overlay.querySelector('.exporter-spinner');
            spinner.style.borderTopColor = isError ? '#d93025' : '#34a853';
            spinner.style.animation = 'none';
        }
    }

    hideOverlay() {
        const overlay = this.shadowRoot.querySelector('#exporter-overlay');
        if (overlay) overlay.remove();
    }

    // --- CORE EXPORT LOGIC ---
    
    delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    waitForElement(selector, parent = document, timeout = 7000) {
        return new Promise((resolve, reject) => {
            const element = parent.querySelector(selector);
            if (element) {
                console.log(`[Gemini Exporter] Element '${selector}' found immediately`);
                return resolve(element);
            }
            
            console.log(`[Gemini Exporter] Waiting for element '${selector}' (timeout: ${timeout}ms)`);
            const observer = new MutationObserver(() => {
                const element = parent.querySelector(selector);
                if (element) {
                    console.log(`[Gemini Exporter] Element '${selector}' found after waiting`);
                    observer.disconnect();
                    resolve(element);
                }
            });
            observer.observe(parent, { childList: true, subtree: true });
            setTimeout(() => {
                observer.disconnect();
                console.error(`[Gemini Exporter] Element '${selector}' not found within ${timeout}ms`);
                reject(new Error(`Element "${selector}" not found after ${timeout}ms`));
            }, timeout);
        });
    }

    getScrollHost() {
        let scrollHost = document.querySelector('#chat-history[data-test-id="chat-history-container"]');
        if (scrollHost) {
            console.log("[Gemini Exporter] Found scroll container by specific ID/data-test-id");
            return scrollHost;
        }
        
        scrollHost = document.querySelector("infinite-scroller.chat-history");
        if (scrollHost) {
            console.log("[Gemini Exporter] Found scroll container by custom element name + class");
            return scrollHost;
        }
        
        scrollHost = document.querySelector(".chat-history-scroll-container");
        if (scrollHost) {
            console.log("[Gemini Exporter] Found scroll container by common class name");
            return scrollHost;
        }
        
        // Check within main conversation area
        const mainArea = document.querySelector("main .conversation-area");
        if (mainArea) {
            const divs = mainArea.querySelectorAll("div");
            for (const div of divs) {
                const computedStyle = window.getComputedStyle(div);
                if ((computedStyle.overflowY === 'auto' || computedStyle.overflowY === 'scroll') && 
                    div.clientHeight > 300) {
                    console.log("[Gemini Exporter] Found potential scroll container by computed style within main area");
                    return div;
                }
            }
        }
        
        scrollHost = document.querySelector("infinite-scroller");
        if (scrollHost) {
            console.warn("[Gemini Exporter] Found scroll container by 'infinite-scroller' tag name (fallback).");
            return scrollHost;
        }
        
        console.error("[Gemini Exporter] All specific scroll container selectors failed. Falling back to documentElement.");
        return document.documentElement;
    }

    async scrollToTopAndWait(options = {}) {
        const {
            loadWaitTimeout = 2000,
            maxTotalTime = 30000,
            maxScrollAttempts = 100
        } = options;

        console.log("[Gemini Exporter] Starting robust scroll to top...");
        return new Promise(async (resolve, reject) => {
            let scroller;
            try {
                scroller = this.getScrollHost();
                if (!scroller) {
                    throw new Error("Scroll container returned null.");
                }
                
                const scrollContent = scroller === document.documentElement ? document.body : scroller;
                if (scrollContent.scrollHeight <= scrollContent.clientHeight) {
                    console.log("[Gemini Exporter] Scroller content doesn't exceed its height. No scrolling needed.");
                    return resolve();
                }
            } catch (error) {
                console.error(`[Gemini Exporter] Error finding scroll container: ${error.message}`);
                return reject(new Error("Scroll container lookup failed. Cannot scroll."));
            }

            const startTime = Date.now();
            let scrollAttempts = 0;
            const conversationSelector = 'div.conversation-container';
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            const scrollTarget = scroller === document.documentElement ? window : scroller;

            while (scrollAttempts < maxScrollAttempts) {
                if (Date.now() - startTime > maxTotalTime) {
                    console.warn(`[Gemini Exporter] Scroll timeout reached after ${maxTotalTime}ms.`);
                    return reject(new Error(`Scroll process timed out after ${maxTotalTime}ms.`));
                }

                const messagesBeforeScroll = scroller.querySelectorAll(conversationSelector).length;
                const scrollTopBefore = scrollTarget === window ? window.scrollY : scrollTarget.scrollTop;
                
                console.log(`[Gemini Exporter] Scroll attempt ${scrollAttempts + 1}: Current messages: ${messagesBeforeScroll}, ScrollTop: ${scrollTopBefore}`);

                if (scrollTopBefore === 0 && scrollAttempts > 0) {
                    console.log("[Gemini Exporter] Reached scrollTop 0. Checking for final loads...");
                    await delay(loadWaitTimeout);
                    const messagesAfterWait = scroller.querySelectorAll(conversationSelector).length;
                    if (messagesAfterWait === messagesBeforeScroll) {
                        console.log("[Gemini Exporter] ScrollTop is 0 and no new messages loaded after wait. Scrolling complete.");
                        return resolve();
                    }
                    console.log(`[Gemini Exporter] Messages loaded after reaching top (${messagesBeforeScroll} -> ${messagesAfterWait}). Continuing check.`);
                }

                // Scroll to top
                if (scrollTarget === window) {
                    window.scrollTo(0, 0);
                } else {
                    scrollTarget.scrollTop = 0;
                    scrollTarget.dispatchEvent(new Event('scroll'));
                }
                console.log("[Gemini Exporter] Scrolled to top (scrollTop set to 0).");

                // Wait for new messages to load
                let messagesLoaded = false;
                const waitStartTime = Date.now();
                while (Date.now() - waitStartTime < loadWaitTimeout) {
                    const messagesAfterScroll = scroller.querySelectorAll(conversationSelector).length;
                    if (messagesAfterScroll > messagesBeforeScroll) {
                        console.log(`[Gemini Exporter] New messages loaded (${messagesBeforeScroll} -> ${messagesAfterScroll}).`);
                        messagesLoaded = true;
                        break;
                    }
                    
                    const currentScrollTop = scrollTarget === window ? window.scrollY : scrollTarget.scrollTop;
                    if (currentScrollTop > 5 && scrollTopBefore === 0) {
                        console.warn(`[Gemini Exporter] Scroll position changed unexpectedly after scroll attempt (${currentScrollTop}).`);
                    }
                    
                    await delay(100);
                }

                if (!messagesLoaded) {
                    const finalScrollTop = scrollTarget === window ? window.scrollY : scrollTarget.scrollTop;
                    if (finalScrollTop === 0) {
                        console.log("[Gemini Exporter] Scrolled, waited, no new messages loaded, and still at scrollTop 0. Assuming end of history.");
                        return resolve();
                    }
                    console.warn(`[Gemini Exporter] Scrolled, waited, no new messages, but scrollTop is now ${finalScrollTop}. Continuing loop cautiously.`);
                }

                scrollAttempts++;
                await delay(50);
            }

            console.warn(`[Gemini Exporter] Reached max scroll attempts (${maxScrollAttempts}). Finishing scroll process.`);
            resolve();
        });
    }

    extractConversationElements() {
        const conversationPairs = [];
        let scroller;
        
        try {
            scroller = this.getScrollHost();
            if (!scroller) {
                throw new Error("Scroller element not found.");
            }
        } catch (error) {
            console.error("[Gemini Exporter] Could not find chat history scroller for extraction:", error);
            return conversationPairs;
        }

        const conversationContainers = scroller.querySelectorAll('div.conversation-container');
        console.log(`[Gemini Exporter] Found ${conversationContainers.length} conversation containers within scroller.`);

        conversationContainers.forEach(container => {
            const userQueryEl = container.querySelector('user-query, user-query-content');
            const modelResponseEl = container.querySelector('message-content');

            let questionHTML = '';
            // Try to get user query text
            const queryTextLine = userQueryEl?.querySelector('.query-text-line');
            if (queryTextLine) {
                questionHTML = queryTextLine.innerHTML.trim();
            } else if (userQueryEl) {
                const clonedUserEl = userQueryEl.cloneNode(true);
                clonedUserEl.querySelectorAll('mat-icon, .icon-button').forEach(el => el.remove());
                questionHTML = clonedUserEl.innerHTML.trim();
            }

            let answerHTML = '';
            // Try to get model response
            const responseContent = modelResponseEl?.querySelector('.markdown-main-panel, .output-content .markdown, .output-content');
            if (responseContent) {
                answerHTML = responseContent.innerHTML.trim();
            } else if (modelResponseEl) {
                const clonedResponseEl = modelResponseEl.cloneNode(true);
                clonedResponseEl.querySelectorAll('message-actions, mat-icon-button, .icon-button, response-actions').forEach(el => el.remove());
                answerHTML = clonedResponseEl.innerHTML.trim();
            }

            if (questionHTML || answerHTML) {
                // Clean up any checkbox containers that might be present
                const tempQuestionDiv = document.createElement('div');
                tempQuestionDiv.innerHTML = questionHTML;
                tempQuestionDiv.querySelectorAll('.gemini-export-checkbox-container').forEach(el => el.remove());
                
                const tempAnswerDiv = document.createElement('div');
                tempAnswerDiv.innerHTML = answerHTML;
                tempAnswerDiv.querySelectorAll('.gemini-export-checkbox-container').forEach(el => el.remove());
                
                conversationPairs.push({ 
                    question: tempQuestionDiv.innerHTML || null, 
                    answer: tempAnswerDiv.innerHTML || null 
                });
            }
        });

        return conversationPairs;
    }
    
    generateFilename(base, ext) {
        const timestamp = new Date().toISOString().split('T')[0];
        return `${base}-${timestamp}.${ext}`;
    }

    downloadData(data, filename, type) {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        chrome.runtime.sendMessage({
            action: 'downloadFile',
            url: url,
            filename: filename
        }, () => URL.revokeObjectURL(url));
    }

    convertHtmlToMarkdown(html) {
        if (!html) return "";
        let markdown = html;
        // Basic conversions; a more robust library might be needed for complex cases
        markdown = markdown.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
        markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
        markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
        markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*');
        markdown = markdown.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n');
        markdown = markdown.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n');
        markdown = markdown.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n');
        markdown = markdown.replace(/<li>(.*?)<\/li>/gi, '* $1\n');
        markdown = markdown.replace(/<pre><code>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n');
        markdown = markdown.replace(/<code>(.*?)<\/code>/gi, '`$1`');
        // Strip remaining tags
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = markdown;
        return tempDiv.textContent || tempDiv.innerText || '';
    }

    formatConversationHTML(conversation, title, theme = 'light') {
        const isDark = theme === 'dark';
        const styles = `
            body { font-family: sans-serif; margin: 0; padding: 2em; background-color: ${isDark ? '#131314' : '#fff'}; color: ${isDark ? '#e3e3e3' : '#202124'}; }
            .wrapper { max-width: 800px; margin: auto; }
            h1 { font-size: 24px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
            .pair { margin-bottom: 2em; }
            .question, .answer { padding: 1em; border-radius: 8px; }
            .question { background-color: ${isDark ? '#1e1e1f' : '#f0f4f9'}; }
            .answer { background-color: ${isDark ? '#2a2a2c' : '#f8f9fa'}; margin-top: 1em; }
            .label { font-weight: bold; margin-bottom: 0.5em; color: ${isDark ? '#8ab4f8' : '#1a73e8'}; }
            code-block, pre { background-color: ${isDark ? '#202124' : '#e8eaed'} !important; padding: 1em; border-radius: 8px; overflow-x: auto; font-family: monospace; }
        `;
        let body = `<h1>${title}</h1><p><i>Exported on: ${new Date().toLocaleString()}</i></p>`;
        conversation.forEach(c => {
            body += '<div class="pair">';
            if (c.question) body += `<div class="question"><div class="label">User</div><div>${c.question}</div></div>`;
            if (c.answer) body += `<div class="answer"><div class="label">Gemini</div><div>${c.answer}</div></div>`;
            body += '</div>';
        });

        return `<!DOCTYPE html><html><head><title>${title}</title><style>${styles}</style></head><body><div class="wrapper">${body}</div></body></html>`;
    }

    async generatePDF(conversation, fileNameBase) {
        const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        const htmlContent = this.formatConversationHTML(conversation, fileNameBase, theme);
        const fileName = this.generateFilename(fileNameBase, 'pdf');
        
        // Use the html2pdf library already included in your extension
        if (typeof html2pdf === 'undefined') {
            throw new Error('html2pdf.js is not loaded.');
        }

        const opt = {
            margin: 0.5,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: theme === 'dark' ? '#131314' : '#ffffff' },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        // html2pdf returns a promise-like object
        await html2pdf().from(htmlContent).set(opt).save();
    }

    downloadAsHTML(conversation, fileNameBase) {
        const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        const htmlContent = this.formatConversationHTML(conversation, fileNameBase, theme);
        const fileName = this.generateFilename(fileNameBase, 'html');
        this.downloadData(htmlContent, fileName, 'text/html;charset=utf-8');
    }
    
    downloadAsMarkdown(conversation, fileNameBase) {
        let content = `# ${fileNameBase}\n\n---\n\n`;
        conversation.forEach(c => {
            if (c.question) content += `**User:**\n${this.convertHtmlToMarkdown(c.question)}\n\n`;
            if (c.answer) content += `**Gemini:**\n${this.convertHtmlToMarkdown(c.answer)}\n\n`;
            content += '---\n\n';
        });
        const fileName = this.generateFilename(fileNameBase, 'md');
        this.downloadData(content, fileName, 'text/markdown;charset=utf-8');
    }

    downloadAsTXT(conversation, fileNameBase) {
        let content = `${fileNameBase}\n\n`;
        const tempDiv = document.createElement('div');
        conversation.forEach(c => {
            if (c.question) {
                tempDiv.innerHTML = c.question;
                content += `User:\n${tempDiv.textContent || tempDiv.innerText}\n\n`;
            }
            if (c.answer) {
                tempDiv.innerHTML = c.answer;
                content += `Gemini:\n${tempDiv.textContent || tempDiv.innerText}\n\n`;
            }
            content += '----------------------------------------\n\n';
        });
        const fileName = this.generateFilename(fileNameBase, 'txt');
        this.downloadData(content, fileName, 'text/plain;charset=utf-8');
    }

    downloadAsJSON(conversation, fileNameBase) {
        const data = {
            title: fileNameBase,
            exportedAt: new Date().toISOString(),
            conversation: conversation
        };
        const fileName = this.generateFilename(fileNameBase, 'json');
        this.downloadData(JSON.stringify(data, null, 2), fileName, 'application/json;charset=utf-8');
    }
}