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

        // Navigate to the target chat page
        window.location.href = `https://gemini.google.com/c/${chatId}`;

        try {
            // Wait for the conversation to be loaded on the new page
            await this.waitForElement('message-content', document, 15000);
            await this.delay(1000); // Extra delay for content rendering

            this.updateOverlay("Loading full conversation...");
            await this.scrollToTopAndWait();

            this.updateOverlay("Extracting content...");
            const conversation = this.extractConversationElements();
            if (!conversation || conversation.length === 0) {
                throw new Error("No content could be extracted from the chat.");
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
            if (element) return resolve(element);
            const observer = new MutationObserver(() => {
                const element = parent.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element "${selector}" not found after ${timeout}ms`));
            }, timeout);
        });
    }

    getScrollHost() {
        const selectors = [
            '#chat-history[data-test-id="chat-history-container"]',
            'main .conversation-area div[style*="overflow: auto"]',
            'main'
        ];
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) return el;
        }
        return document.documentElement;
    }

    async scrollToTopAndWait(timeout = 20000) {
        const scroller = this.getScrollHost();
        const isWindow = scroller === document.documentElement;
        let lastHeight = -1;
        let attempts = 0;
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const currentHeight = isWindow ? document.body.scrollHeight : scroller.scrollHeight;
            if (currentHeight === lastHeight) {
                attempts++;
            } else {
                attempts = 0;
            }

            if (attempts >= 5) { // If height hasn't changed for 5 checks, assume we're done
                console.log("Scrolling complete, height stabilized.");
                return;
            }
            
            lastHeight = currentHeight;
            (isWindow ? window : scroller).scrollTo(0, 0);
            await this.delay(200); // Wait for content to potentially load
        }
        console.warn("Scroll to top timed out.");
    }

    extractConversationElements() {
        const conversationPairs = [];
        const messageContainers = document.querySelectorAll('div.conversation-container');
        messageContainers.forEach(container => {
            const userQueryEl = container.querySelector('user-query');
            const modelResponseEl = container.querySelector('message-content');

            const questionHTML = userQueryEl?.querySelector('.query-text-line')?.innerHTML.trim() || null;
            const answerHTML = modelResponseEl?.querySelector('.markdown-main-panel, .output-content .markdown')?.innerHTML.trim() || null;

            if (questionHTML || answerHTML) {
                conversationPairs.push({ question: questionHTML, answer: answerHTML });
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