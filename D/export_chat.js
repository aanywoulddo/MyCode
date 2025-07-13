// Make ExportChat globally available
window.ExportChat = class ExportChat {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
        this.exportSettings = {
            fileName: "gemini-conversation",
            format: "pdf",
            pdfTheme: "light",
            orientation: "portrait",
            compression: true,
            uiTheme: "light"
        };
        this.isExportDropdownOpen = false;
        this.selectedMessageCount = 0;
        this.isSelectionMode = false;
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem("gemini-export-settings");
            if (saved) {
                const settings = JSON.parse(saved);
                Object.keys(this.exportSettings).forEach(key => {
                    if (settings.hasOwnProperty(key)) {
                        this.exportSettings[key] = settings[key];
                    }
                });
            }
        } catch (error) {
            console.error("Failed to load export settings:", error);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem("gemini-export-settings", JSON.stringify(this.exportSettings));
        } catch (error) {
            console.error("Failed to save export settings:", error);
        }
    }

    setupEventListeners() {
        // Event listeners will be set up when the export feature is activated
    }

    showExportModal() {
        const modalHTML = this.getExportModalHTML();
        this.openModal("export-modal", "Export Chat", modalHTML, 700);
    }

    getExportModalHTML() {
        const isDark = this.detectTheme() === 'dark';
        const themeClass = isDark ? 'dark-theme' : 'light-theme';
        
        return `
            <div class="export-modal-content ${themeClass}">
                <div class="export-section">
                    <h3>Export Options</h3>
                    <div class="export-format-grid">
                        <div class="format-option" data-format="pdf">
                            <div class="format-icon">📄</div>
                            <div class="format-info">
                                <div class="format-name">PDF</div>
                                <div class="format-desc">High-quality document</div>
                            </div>
                        </div>
                        <div class="format-option" data-format="html">
                            <div class="format-icon">🌐</div>
                            <div class="format-info">
                                <div class="format-name">HTML</div>
                                <div class="format-desc">Web page format</div>
                            </div>
                        </div>
                        <div class="format-option" data-format="md">
                            <div class="format-icon">📝</div>
                            <div class="format-info">
                                <div class="format-name">Markdown</div>
                                <div class="format-desc">Plain text with formatting</div>
                            </div>
                        </div>
                        <div class="format-option" data-format="json">
                            <div class="format-icon">📊</div>
                            <div class="format-info">
                                <div class="format-name">JSON</div>
                                <div class="format-desc">Structured data</div>
                            </div>
                        </div>
                        <div class="format-option" data-format="txt">
                            <div class="format-icon">📄</div>
                            <div class="format-info">
                                <div class="format-name">Text</div>
                                <div class="format-desc">Plain text file</div>
                            </div>
                        </div>
                        <div class="format-option" data-format="csv">
                            <div class="format-icon">📊</div>
                            <div class="format-info">
                                <div class="format-name">CSV</div>
                                <div class="format-desc">Spreadsheet format</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="export-section">
                    <h3>Settings</h3>
                    <div class="setting-group">
                        <label for="export-filename">File Name:</label>
                        <input type="text" id="export-filename" value="${this.exportSettings.fileName}" placeholder="Enter file name">
                    </div>
                    
                    <div class="setting-group">
                        <label>Theme:</label>
                        <div class="theme-options">
                            <label class="radio-option">
                                <input type="radio" name="theme" value="light" ${this.exportSettings.pdfTheme === 'light' ? 'checked' : ''}>
                                <span>Light</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="theme" value="dark" ${this.exportSettings.pdfTheme === 'dark' ? 'checked' : ''}>
                                <span>Dark</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="theme" value="auto" ${this.exportSettings.pdfTheme === 'auto' ? 'checked' : ''}>
                                <span>Auto</span>
                            </label>
                        </div>
                    </div>

                    <div class="setting-group">
                        <label>Orientation:</label>
                        <div class="orientation-options">
                            <label class="radio-option">
                                <input type="radio" name="orientation" value="portrait" ${this.exportSettings.orientation === 'portrait' ? 'checked' : ''}>
                                <span>Portrait</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="orientation" value="landscape" ${this.exportSettings.orientation === 'landscape' ? 'checked' : ''}>
                                <span>Landscape</span>
                            </label>
                        </div>
                    </div>

                    <div class="setting-group">
                        <label class="checkbox-option">
                            <input type="checkbox" id="compression-toggle" ${this.exportSettings.compression ? 'checked' : ''}>
                            <span>Enable compression (smaller file size)</span>
                        </label>
                    </div>
                </div>

                <div class="export-section">
                    <h3>Export Range</h3>
                    <div class="export-range-options">
                        <label class="radio-option">
                            <input type="radio" name="export-range" value="current" checked>
                            <span>Current conversation</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="export-range" value="selected">
                            <span>Selected messages</span>
                        </label>
                    </div>
                </div>

                <div class="export-actions">
                    <button class="btn-secondary" id="cancel-export">Cancel</button>
                    <button class="btn-primary" id="start-export">Export Chat</button>
                </div>
            </div>
        `;
    }

    openModal(id, title, contentHTML, width = 600) {
        // This will be handled by the main injector.js modal system
        // For now, we'll create a simple modal
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'export-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-container" style="max-width: ${width}px;">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="close-btn" id="close-export-modal">×</button>
                </div>
                <div class="modal-body">
                    ${contentHTML}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupModalEventListeners(modal);
    }

    setupModalEventListeners(modal) {
        // Format selection
        modal.querySelectorAll('.format-option').forEach(option => {
            option.addEventListener('click', () => {
                modal.querySelectorAll('.format-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.exportSettings.format = option.dataset.format;
            });
        });

        // Theme selection
        modal.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.exportSettings.pdfTheme = radio.value;
            });
        });

        // Orientation selection
        modal.querySelectorAll('input[name="orientation"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.exportSettings.orientation = radio.value;
            });
        });

        // Compression toggle
        const compressionToggle = modal.querySelector('#compression-toggle');
        compressionToggle.addEventListener('change', () => {
            this.exportSettings.compression = compressionToggle.checked;
        });

        // Filename input
        const filenameInput = modal.querySelector('#export-filename');
        filenameInput.addEventListener('input', () => {
            this.exportSettings.fileName = filenameInput.value.trim();
        });

        // Export button
        const exportBtn = modal.querySelector('#start-export');
        exportBtn.addEventListener('click', () => {
            this.performExport(modal);
        });

        // Cancel button
        const cancelBtn = modal.querySelector('#cancel-export');
        cancelBtn.addEventListener('click', () => {
            this.closeModal(modal);
        });

        // Close button
        const closeBtn = modal.querySelector('#close-export-modal');
        closeBtn.addEventListener('click', () => {
            this.closeModal(modal);
        });

        // Backdrop click
        const backdrop = modal.querySelector('.modal-backdrop');
        backdrop.addEventListener('click', () => {
            this.closeModal(modal);
        });

        // Set initial selected format
        const currentFormatOption = modal.querySelector(`[data-format="${this.exportSettings.format}"]`);
        if (currentFormatOption) {
            currentFormatOption.classList.add('selected');
        }
    }

    async performExport(modal) {
        const exportRange = modal.querySelector('input[name="export-range"]:checked').value;
        const exportBtn = modal.querySelector('#start-export');
        const originalText = exportBtn.textContent;

        try {
            exportBtn.textContent = 'Exporting...';
            exportBtn.disabled = true;

            let conversationData;
            if (exportRange === 'current') {
                conversationData = await this.extractCurrentConversation();
            } else {
                conversationData = await this.extractSelectedMessages();
            }

            if (!conversationData || conversationData.length === 0) {
                alert('No conversation content found to export.');
                return;
            }

            await this.exportConversation(conversationData);
            this.saveSettings();
            this.closeModal(modal);
            
            // Show success message
            this.showSuccessMessage('Export completed successfully!');

        } catch (error) {
            console.error('Export failed:', error);
            alert(`Export failed: ${error.message}`);
        } finally {
            exportBtn.textContent = originalText;
            exportBtn.disabled = false;
        }
    }

    async extractCurrentConversation() {
        // Scroll to top to load all messages
        await this.scrollToTop();
        
        const conversationElements = document.querySelectorAll('div.conversation-container');
        const conversation = [];

        conversationElements.forEach(container => {
            const userQuery = container.querySelector('user-query, user-query-content');
            const geminiResponse = container.querySelector('message-content');

            let question = '';
            let answer = '';

            if (userQuery) {
                const queryText = userQuery.querySelector('.query-text-line');
                if (queryText) {
                    question = this.cleanHTML(queryText.innerHTML);
                } else {
                    question = this.cleanHTML(userQuery.innerHTML);
                }
            }

            if (geminiResponse) {
                const responseContent = geminiResponse.querySelector('.markdown-main-panel, .output-content .markdown, .output-content');
                if (responseContent) {
                    answer = this.cleanHTML(responseContent.innerHTML);
                } else {
                    answer = this.cleanHTML(geminiResponse.innerHTML);
                }
            }

            if (question || answer) {
                conversation.push({
                    question: question || null,
                    answer: answer || null
                });
            }
        });

        return conversation;
    }

    async extractSelectedMessages() {
        // This would be implemented if we add message selection functionality
        // For now, return current conversation
        return await this.extractCurrentConversation();
    }

    async scrollToTop() {
        const scrollContainer = this.findScrollContainer();
        if (!scrollContainer) return;

        let attempts = 0;
        const maxAttempts = 50;

        while (attempts < maxAttempts) {
            const previousHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop = 0;
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (scrollContainer.scrollHeight === previousHeight) {
                break;
            }
            
            attempts++;
        }
    }

    findScrollContainer() {
        const selectors = [
            '#chat-history[data-test-id="chat-history-container"]',
            'infinite-scroller.chat-history',
            '.chat-history-scroll-container',
            'main .conversation-area'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }

        return document.documentElement;
    }

    cleanHTML(html) {
        if (!html) return '';
        
        const div = document.createElement('div');
        div.innerHTML = html;
        
        // Remove unwanted elements
        div.querySelectorAll('.gemini-export-checkbox-container, .code-block-decoration .buttons, sources-carousel-inline, sources-carousel, source-footnote').forEach(el => el.remove());
        
        return div.innerHTML.trim();
    }

    async exportConversation(conversation) {
        const filename = this.exportSettings.fileName || 'gemini-conversation';
        const timestamp = new Date().toISOString().split('T')[0] + '-' + new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
        const baseFilename = `${filename}-${timestamp}`;

        switch (this.exportSettings.format) {
            case 'pdf':
                await this.exportAsPDF(conversation, baseFilename);
                break;
            case 'html':
                this.exportAsHTML(conversation, baseFilename);
                break;
            case 'md':
                this.exportAsMarkdown(conversation, baseFilename);
                break;
            case 'json':
                this.exportAsJSON(conversation, baseFilename);
                break;
            case 'txt':
                this.exportAsText(conversation, baseFilename);
                break;
            case 'csv':
                this.exportAsCSV(conversation, baseFilename);
                break;
            default:
                throw new Error(`Unsupported format: ${this.exportSettings.format}`);
        }
    }

    async exportAsPDF(conversation, filename) {
        // For PDF export, we'll use html2pdf library if available
        if (typeof html2pdf === 'undefined') {
            // Fallback to HTML export if html2pdf is not available
            this.exportAsHTML(conversation, filename);
            return;
        }

        const htmlContent = this.generatePDFHTML(conversation);
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        document.body.appendChild(element);

        const options = {
            margin: 0,
            filename: `${filename}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { 
                scale: 2, 
                useCORS: true,
                backgroundColor: this.exportSettings.pdfTheme === 'dark' ? '#131314' : '#FFFFFF'
            },
            jsPDF: { 
                unit: 'pt', 
                format: 'a4', 
                orientation: this.exportSettings.orientation,
                compress: this.exportSettings.compression 
            }
        };

        try {
            await html2pdf().from(element).set(options).save();
        } finally {
            document.body.removeChild(element);
        }
    }

    exportAsHTML(conversation, filename) {
        const htmlContent = this.generateHTML(conversation);
        this.downloadFile(htmlContent, `${filename}.html`, 'text/html');
    }

    exportAsMarkdown(conversation, filename) {
        const markdownContent = this.generateMarkdown(conversation);
        this.downloadFile(markdownContent, `${filename}.md`, 'text/markdown');
    }

    exportAsJSON(conversation, filename) {
        const jsonContent = JSON.stringify({
            title: this.exportSettings.fileName || 'Gemini Conversation',
            exportedAt: new Date().toISOString(),
            conversation: conversation
        }, null, 2);
        this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
    }

    exportAsText(conversation, filename) {
        const textContent = this.generateText(conversation);
        this.downloadFile(textContent, `${filename}.txt`, 'text/plain');
    }

    exportAsCSV(conversation, filename) {
        const csvContent = this.generateCSV(conversation);
        this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    }

    generatePDFHTML(conversation) {
        const isDark = this.exportSettings.pdfTheme === 'dark' || 
                      (this.exportSettings.pdfTheme === 'auto' && this.detectTheme() === 'dark');
        
        const bgColor = isDark ? '#131314' : '#FFFFFF';
        const textColor = isDark ? '#e8eaed' : '#1f1f1f';
        const borderColor = isDark ? '#5f6368' : '#dadce0';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: 'Google Sans', Arial, sans-serif;
                        background-color: ${bgColor};
                        color: ${textColor};
                        margin: 0;
                        padding: 20px;
                        font-size: 12pt;
                        line-height: 1.4;
                    }
                    .conversation-wrapper {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .export-header {
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid ${borderColor};
                    }
                    .export-header h1 {
                        font-size: 18pt;
                        margin: 0 0 5px 0;
                    }
                    .export-header .timestamp {
                        font-size: 10pt;
                        color: ${isDark ? '#9aa0a6' : '#5f6368'};
                    }
                    .message-pair {
                        margin-bottom: 15px;
                        border: 1px solid ${borderColor};
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    .message-part {
                        padding: 10px;
                    }
                    .message-part.question {
                        background-color: ${isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8f9fa'};
                    }
                    .speaker-label {
                        font-weight: bold;
                        margin-bottom: 5px;
                        font-size: 11pt;
                    }
                    .content {
                        font-size: 11pt;
                        line-height: 1.4;
                    }
                    .content p {
                        margin: 0.5em 0;
                    }
                    .content code {
                        background-color: ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#f1f3f4'};
                        padding: 2px 4px;
                        border-radius: 3px;
                        font-family: 'Roboto Mono', monospace;
                    }
                    .content pre {
                        background-color: ${isDark ? '#2d2d2f' : '#f8f9fa'};
                        padding: 10px;
                        border-radius: 5px;
                        overflow-x: auto;
                        font-family: 'Roboto Mono', monospace;
                        font-size: 10pt;
                    }
                </style>
            </head>
            <body>
                <div class="conversation-wrapper">
                    <div class="export-header">
                        <h1>${this.exportSettings.fileName || 'Gemini Conversation'}</h1>
                        <div class="timestamp">Exported on: ${new Date().toLocaleString()}</div>
                    </div>
                    ${conversation.map(msg => `
                        <div class="message-pair">
                            ${msg.question ? `
                                <div class="message-part question">
                                    <div class="speaker-label">User</div>
                                    <div class="content">${msg.question}</div>
                                </div>
                            ` : ''}
                            ${msg.answer ? `
                                <div class="message-part answer">
                                    <div class="speaker-label">Gemini</div>
                                    <div class="content">${msg.answer}</div>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </body>
            </html>
        `;
    }

    generateHTML(conversation) {
        return this.generatePDFHTML(conversation);
    }

    generateMarkdown(conversation) {
        let markdown = `# ${this.exportSettings.fileName || 'Gemini Conversation'}\n\n`;
        markdown += `Exported on: ${new Date().toLocaleString()}\n\n`;
        markdown += '---\n\n';

        conversation.forEach(msg => {
            if (msg.question) {
                markdown += `**User:**\n${this.htmlToMarkdown(msg.question)}\n\n`;
            }
            if (msg.answer) {
                markdown += `**Gemini:**\n${this.htmlToMarkdown(msg.answer)}\n\n`;
            }
            markdown += '---\n\n';
        });

        return markdown;
    }

    generateText(conversation) {
        let text = `${this.exportSettings.fileName || 'Gemini Conversation'}\n`;
        text += `Exported on: ${new Date().toLocaleString()}\n\n`;
        text += '='.repeat(50) + '\n\n';

        conversation.forEach(msg => {
            if (msg.question) {
                text += `User:\n${this.htmlToText(msg.question)}\n\n`;
            }
            if (msg.answer) {
                text += `Gemini:\n${this.htmlToText(msg.answer)}\n\n`;
            }
            text += '='.repeat(50) + '\n\n';
        });

        return text;
    }

    generateCSV(conversation) {
        let csv = 'Timestamp,Speaker,Content\n';
        
        conversation.forEach(msg => {
            const timestamp = new Date().toISOString();
            
            if (msg.question) {
                csv += `"${timestamp}","User","${this.escapeCSV(this.htmlToText(msg.question))}"\n`;
            }
            if (msg.answer) {
                csv += `"${timestamp}","Gemini","${this.escapeCSV(this.htmlToText(msg.answer))}"\n`;
            }
        });

        return csv;
    }

    htmlToMarkdown(html) {
        if (!html) return '';
        
        const div = document.createElement('div');
        div.innerHTML = html;
        
        // Convert common HTML elements to Markdown
        div.querySelectorAll('strong, b').forEach(el => {
            el.outerHTML = `**${el.textContent}**`;
        });
        
        div.querySelectorAll('em, i').forEach(el => {
            el.outerHTML = `*${el.textContent}*`;
        });
        
        div.querySelectorAll('code').forEach(el => {
            if (el.parentElement.tagName === 'PRE') {
                el.outerHTML = `\`\`\`\n${el.textContent}\n\`\`\``;
            } else {
                el.outerHTML = `\`${el.textContent}\``;
            }
        });
        
        div.querySelectorAll('pre').forEach(el => {
            if (!el.querySelector('code')) {
                el.outerHTML = `\`\`\`\n${el.textContent}\n\`\`\``;
            }
        });
        
        return div.textContent || div.innerText || '';
    }

    htmlToText(html) {
        if (!html) return '';
        
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    escapeCSV(text) {
        return text.replace(/"/g, '""');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    closeModal(modal) {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }

    showSuccessMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'export-success-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: 'Google Sans', sans-serif;
            font-size: 14px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    detectTheme() {
        const body = document.body;
        if (body.classList.contains('dark-theme') || body.classList.contains('dark_mode_toggled')) {
            return 'dark';
        }
        
        const htmlTheme = document.documentElement.getAttribute('data-theme');
        if (htmlTheme === 'dark') {
            return 'dark';
        }
        
        const bodyBgColor = window.getComputedStyle(body).backgroundColor;
        if (bodyBgColor) {
            const rgb = bodyBgColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
                const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
                return brightness < 128 ? 'dark' : 'light';
            }
        }
        
        return 'light';
    }
}