// Gemini Folders - REFACTORED injector.js
(function() {
    'use strict';

    // --- CONSTANTS AND STATE ---
    const INJECTOR_HOST_ID = 'gemini-folders-injector-host';
    const STORAGE_KEY = 'geminiFoldersData';

    // Selectors for the deletion logic, adapted from the source extension
    const DELETE_BUTTON_SELECTORS = ['button[data-test-id="delete-button"]', 'button[aria-label*="delete"]', 'button:contains("Delete")', "button.delete-btn"];
    const CONFIRM_BUTTON_SELECTORS = ['button[data-test-id="confirm-button"]', 'button:contains("Delete")', 'button:contains("Confirm")', 'button[aria-label*="confirm"]', "button.confirm-btn"];
    const ACTIONS_MENU_SELECTORS = ['button[data-test-id="actions-menu-button"]', 'button[aria-label*="actions"]', 'button[aria-label*="menu"]', "button.menu-button", "button.actions-button"];
    const OVERLAY_CONTAINER_SELECTORS = ["div.cdk-overlay-container", '[role="dialog"]', ".modal-container", ".overlay-container"];

    let hostElement = null;
    let shadow = null;
    let currentTheme = 'light';
    let isModalOpen = false;
    let promptLibraryInstance;
    let voiceDownloadInstance;

    // State object to hold dynamic data, similar to the target's storage module.
    let state = {
        folders: [],
        settings: {
            hideFolderedChats: false
        },
        selectedItems: [],
        modalType: null, // e.g., 'MANAGE_FOLDERS', 'ADD_FOLDER'
    };

    // --- ORIGINAL UTILITY FUNCTIONS (Unchanged) ---
    function generateUUID() {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
    function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    // --- NEW HELPER FUNCTIONS (for Bulk Delete) ---
    function delayMs(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function findElement(selectors, parent = document) {
        if (!parent) return null;
        for (const selector of selectors) {
            try {
                const element = parent.querySelector(selector);
                if (element) return element;
            } catch (e) {
                console.warn(`[Gemini Toolbox] Invalid selector "${selector}":`, e);
            }
        }
        return null;
    }

    function waitForElement(selectors, parent = document, timeout = 7000) {
        return new Promise((resolve, reject) => {
            const element = findElement(selectors, parent);
            // Check if element is not only present but also visible and interactive
            if (element && element.offsetParent !== null && !element.disabled) {
                return resolve(element);
            }

            let elapsedTime = 0;
            const interval = 150;
            const timer = setInterval(() => {
                elapsedTime += interval;
                const foundElement = findElement(selectors, parent);
                if (foundElement && foundElement.offsetParent !== null && !foundElement.disabled) {
                    clearInterval(timer);
                    resolve(foundElement);
                } else if (elapsedTime >= timeout) {
                    clearInterval(timer);
                    console.error(`[Gemini Toolbox] Element not actionable within ${timeout}ms. Tried selectors:`, selectors);
                    reject(new Error(`Element not actionable within ${timeout}ms`));
                }
            }, interval);
        });
    }


    async function loadData() {
        try {
            const result = await chrome.storage.local.get(STORAGE_KEY);
            // Initialize with default structure if it doesn't exist
            state.folders = result[STORAGE_KEY]?.folders || [];
            state.settings = result[STORAGE_KEY]?.settings || { hideFolderedChats: false };
        } catch (error) {
            console.error("Gemini Folders: Error loading data", error);
            state.folders = [];
            state.settings = { hideFolderedChats: false };
        }
    }

    async function saveData() {
        try {
            // Only save the necessary parts of the state
            const dataToSave = { 
                folders: state.folders,
                settings: state.settings 
            };
            await chrome.storage.local.set({ [STORAGE_KEY]: dataToSave });
        } catch (error) {
            console.error("Gemini Folders: Error saving data", error);
        }
    }
    
    function getChatIdFromElement(chatElement) {
        if (!chatElement) return null;
        const jslog = chatElement.getAttribute('jslog');
        if (jslog) {
            const match = jslog.match(/BardVeMetadataKey:\[[^\]]*\["([^"]+)"/);
            if (match && match[1]) {
                return match[1];
            }
        }
        const testId = chatElement.getAttribute('data-test-id');
        if (testId && testId.startsWith('conversation_c_')) {
            return testId.substring('conversation_'.length);
        }
        return null;
    }

    function getAllConversationElements() {
        return Array.from(document.querySelectorAll('conversations-list div[data-test-id="conversation"]'));
    }

    function getTextColorForBackground(hexColor) {
        if (!hexColor || hexColor.length < 7) return 'var(--gf-text-primary)'; // Default if invalid

        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        // Formula for perceived brightness (YIQ)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        // Return black for light backgrounds, white for dark backgrounds
        return brightness > 155 ? '#000000' : '#FFFFFF';
    }

    // --- THEME & STYLING (Slightly modified to use a single CSS block) ---
    function detectTheme() {
        const body = document.body;
        if (body.classList.contains('dark-theme') || body.classList.contains('dark_mode_toggled')) return 'dark';
        const htmlTheme = document.documentElement.getAttribute('data-theme');
        if (htmlTheme === 'dark') return 'dark';
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

    function createGlobalStyles() {
        if (!shadow) return;
        const styleElement = document.createElement('style');
        // REFACTORED: We'll use a single, large CSS block that contains all styles
        // for the modals, lists, buttons, etc., mimicking the target UI.
        styleElement.textContent = `
            :host { 
                /* Light Theme */
                --gf-bg-primary-light: #FFFFFF;
                --gf-text-primary-light: #202124;
                --gf-danger-light: #d93025;
                --gf-border-light: #dadce0;
                --gf-hover-light: #f1f3f4;
                --gf-blue-light: #1a73e8;
                --gf-bg-secondary-light: #f0f4f9;
                --gf-border-color-light: #dadce0;
                --gf-text-primary-light: #1f1f1f;
                --gf-text-secondary-light: #5f6368;
                --gf-accent-primary-light: #1a73e8;
                --gf-accent-danger-light: #d93025;
                --gf-bg-input-light: #ffffff;

                /* Dark Theme */
                --gf-bg-primary-dark: #131314;
                --gf-bg-secondary-dark: #2d2d2f;
                --gf-border-color-dark: #5f6368;
                --gf-text-primary-dark: #e3e3e3;
                --gf-text-secondary-dark: #9aa0a6;
                --gf-accent-primary-dark: #8ab4f8;
                --gf-accent-danger-dark: #f28b82;
                --gf-bg-input-dark: #2d2d2f;

                /* Default to dark theme from screenshot */
                --gf-text-primary: var(--gf-text-primary-dark);
                --gf-text-secondary: #969ba1;
                --gf-bg-primary: var(--gf-bg-primary-dark);
                --gf-hover-bg: var(--gf-hover-dark);
                --gf-border-color: var(--gf-border-dark);
                --gf-danger: var(--gf-danger-dark);
                --gf-blue-accent: var(--gf-blue-dark);
            }
            .sidebar-tab { 
                display: flex; align-items: center; gap: 12px;
                padding: 10px; margin: 4px 0; border-radius: 8px;
                cursor: pointer; font-size: 14px; color: var(--gf-text-primary);
                position: relative;
            }
            .sidebar-tab:hover { background-color: var(--gf-hover-bg); }

            /* Gemini Toolbox Button and Dropdown */
            .toolbox-button {
                display: flex; align-items: center; gap: 8px;
                width: 100%; padding: 0; border: none; background: none;
                cursor: pointer; font-size: 14px; color: var(--gf-text-primary);
            }
            .toolbox-button:hover { background-color: var(--gf-hover-bg); }

            .dropdown-arrow {
                margin-left: auto;
                transition: transform 0.2s ease;
            }
            .dropdown-arrow.rotated {
                transform: rotate(180deg);
            }

            .toolbox-dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background-color: var(--gf-bg-primary);
                border: 1px solid var(--gf-border-color);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 1000;
                overflow: hidden;
            }

            .dropdown-item {
                display: flex; align-items: center; gap: 8px;
                padding: 12px; cursor: pointer;
                color: var(--gf-text-primary);
                font-size: 14px;
                transition: background-color 0.2s ease;
            }
            .dropdown-item:hover {
                background-color: var(--gf-hover-bg);
            }

            /* Modal Backdrop */
            .infi-chatgpt-modal {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background-color: rgba(0,0,0,0.65); z-index: 9999;
                display: flex; align-items: center; justify-content: center;
            }
            /* Modal Content Box */
            .modal-content {
                width: 600px;
                background-color: var(--gf-bg-primary);
                border-radius: 12px; border: 1px solid var(--gf-border-color);
                box-shadow: 0 5px 20px rgba(0,0,0,0.4);
                color: var(--gf-text-primary);
                display: flex; flex-direction: column;
                max-height: 80vh;
            }
            .modal-header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 20px;
            }
            .modal-header h2 { margin: 0; font-size: 20px; font-weight: 500; }
            .modal-body { 
                padding: 0 20px 20px 20px; 
                display: flex; flex-direction: column;
                flex-grow: 1;
                overflow-y: hidden;
            }
             .infi-chatgpt-manageTabs-content {
                display: flex; flex-direction: column;
                height: 100%;
            }
            #folder-list-container {
                flex-grow: 1;
                overflow-y: auto;
                margin-top: 16px;
            }
             .infi-chatgpt-manageTabs-buttonsContainer {
                margin-top: auto; /* Pushes to the bottom */
                padding-top: 16px;
                text-align: right;
            }
            /* Buttons */
            .button {
                border: none; border-radius: 6px; padding: 8px 14px;
                font-size: 14px; cursor: pointer;
            }
            .primary { background-color: #8AB4F8; color: #202124; }
            .secondary { background-color: var(--gf-hover-bg); color: var(--gf-text-primary); }
            .danger { background-color: var(--gf-danger); color: #202124; }
            .icon-btn { background: none; border: none; cursor: pointer; color: var(--gf-text-secondary); }

            /* Form & List Styles */
            input[type="text"], input[type="search"] {
                width: 100%;
                padding: 8px 12px;
                background-color: var(--gf-bg-input);
                border: 1px solid var(--gf-border-color);
                color: var(--gf-text-primary);
                border-radius: 6px;
                box-sizing: border-box; /* Important */
                font-size: 14px;
            }
            .list-item {
                display: flex; align-items: center; gap: 10px;
                padding: 8px; border-radius: 6px; margin-bottom: 4px;
            }
            .list-item:hover { background-color: var(--gf-hover-bg); }
            .list-item .item-title {
                flex-grow: 1;
                cursor: pointer;
            }

            .list-item .item-controls {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--gf-text-secondary);
            }
            
            .list-item .add-subfolder-btn {
                opacity: 0;
                transition: opacity 0.2s ease-in-out;
            }
            
            .list-item:hover .add-subfolder-btn {
                opacity: 1;
            }

            .icon-btn {
                background: none;
                border: none;
                cursor: pointer;
                color: var(--gf-text-secondary);
            }

            /* --- NEW: Bulk Delete Modal Specific Styles --- */
            #bulk-delete-list {
                margin-top: 16px;
                max-height: 400px;
                overflow-y: auto;
                padding-right: 10px; /* For scrollbar */
            }
            .bulk-delete-item {
                display: flex;
                align-items: center;
                padding: 8px;
                border-radius: 6px;
                margin-bottom: 4px;
            }
             .bulk-delete-item:hover {
                background-color: var(--gf-hover-bg);
            }
            .bulk-delete-item input[type="checkbox"] {
                margin-right: 12px;
                width: 18px;
                height: 18px;
            }
            .bulk-delete-item label {
                font-size: 14px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
             #bulk-delete-controls {
                padding-top: 16px;
                border-top: 1px solid var(--gf-border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #bulk-delete-select-all-container {
                display: flex;
                align-items: center;
            }
             #bulk-delete-status {
                font-size: 14px;
                color: var(--gf-text-secondary);
            }

            .light-theme {
                --gf-bg-primary: var(--gf-bg-primary-light);
                --gf-text-primary: var(--gf-text-primary-light);
                --gf-text-secondary: var(--gf-text-secondary-light);
                --gf-accent-primary: var(--gf-accent-primary-light);
                --gf-accent-danger: var(--gf-accent-danger-light);
                --gf-bg-input: var(--gf-bg-input-light);
            }
            .dark-theme {
                --gf-bg-primary: var(--gf-bg-primary-dark);
                --gf-bg-secondary: var(--gf-bg-secondary-dark);
                --gf-border-color: var(--gf-border-color-dark);
                --gf-text-primary: var(--gf-text-primary-dark);
                --gf-text-secondary: var(--gf-text-secondary-dark);
                --gf-accent-primary: var(--gf-accent-primary-dark);
                --gf-accent-danger: var(--gf-accent-danger-dark);
                --gf-bg-input: var(--gf-bg-input-dark);
            }
            .dark-theme .danger {
                background-color: var(--gf-accent-danger-dark);
                color: #202124;
            }
        `;
        shadow.appendChild(styleElement);
        applyThemeStyles();
    }

    function applyThemeStyles() {
        if (!hostElement) return;
        currentTheme = detectTheme();
        const isDark = currentTheme === 'dark';

        hostElement.style.setProperty('--gf-bg-primary', isDark ? 'var(--gf-bg-primary-dark)' : 'var(--gf-bg-primary-light)');
        hostElement.style.setProperty('--gf-text-primary', isDark ? 'var(--gf-text-primary-dark)' : 'var(--gf-text-primary-light)');
        hostElement.style.setProperty('--gf-danger', isDark ? 'var(--gf-danger-dark)' : 'var(--gf-danger-light)');
        hostElement.style.setProperty('--gf-border-color', isDark ? 'var(--gf-border-dark)' : 'var(--gf-border-light)');
        hostElement.style.setProperty('--gf-hover-bg', isDark ? 'var(--gf-hover-dark)' : 'var(--gf-hover-light)');
        hostElement.style.setProperty('--gf-blue-accent', isDark ? 'var(--gf-blue-dark)' : 'var(--gf-blue-light)');
        hostElement.style.setProperty('--gf-text-secondary', isDark ? 'var(--gf-text-secondary-dark)' : 'var(--gf-text-secondary-light)');
        hostElement.style.setProperty('--gf-accent-primary', isDark ? 'var(--gf-accent-primary-dark)' : 'var(--gf-accent-primary-light)');
        hostElement.style.setProperty('--gf-accent-danger', isDark ? 'var(--gf-accent-danger-dark)' : 'var(--gf-accent-danger-light)');
        hostElement.style.setProperty('--gf-bg-input', isDark ? 'var(--gf-bg-input-dark)' : 'var(--gf-bg-input-light)');
    }

    // --- NEW: UI COMPONENT GENERATION (HTML Templates) ---
    // These functions replicate the HTML structure from our target UI analysis.

    function getSidebarTabHTML() {
        return `
            <div id="gemini-toolbox-container" class="sidebar-tab">
                <div id="gemini-toolbox-btn" class="toolbox-button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                    <span>Gemini Toolbox</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="dropdown-arrow">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div id="gemini-toolbox-dropdown" class="toolbox-dropdown" style="display: none;">
                    <div id="manage-folders-link" class="dropdown-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Manage Folders</span>
                    </div>
                    <div id="prompt-library-link" class="dropdown-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 19.5A2.5 2.5 0 0 1 1.5 17V7A2.5 2.5 0 0 1 4 4.5h16A2.5 2.5 0 0 1 22.5 7v10a2.5 2.5 0 0 1-2.5 2.5H4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M8 10h8M8 14h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Prompt Library</span>
                    </div>
                    <div id="word-counter-link" class="dropdown-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
                            <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
                            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2"/>
                            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2"/>
                            <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <span>Word Counter</span>
                    </div>
                    <div id="voice-download-link" class="dropdown-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" stroke-width="2"/>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" stroke-width="2"/>
                            <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" stroke-width="2"/>
                            <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <span>Voice Download</span>
                    </div>
                    <div id="bulk-delete-link" class="dropdown-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0v12m4-12v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Bulk Delete</span>
                    </div>
                </div>
            </div>
        `;
    }

    function getManageFoldersModalHTML() {
        const folderTreeHTML = renderFolderTree(null, 0);

        function renderFolderTree(parentId, level) {
            let html = '';
            const children = state.folders.filter(f => f.parentId === parentId);
    
            children.forEach(folder => {
                html += `
                    <div class="list-item" data-folder-id="${folder.id}" style="margin-left: ${level * 20}px;">
                        <span class="folder-icon"></span>
                        <span class="item-title">${folder.name}</span>
                        <div class="item-controls">
                            <span>(${folder.chatIds?.length || 0})</span>
                             <button class="icon-btn add-chats-btn" data-folder-id="${folder.id}" title="Add Chats">+</button>
                             <button class="icon-btn add-subfolder-btn" data-parent-id="${folder.id}" title="Add Subfolder">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-folder-plus"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
                            </button>
                             <button class="icon-btn delete-folder-btn" data-folder-id="${folder.id}" title="Delete Folder">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                        </div>
                    </div>
                `;
                // Recursive call for children
                html += renderFolderTree(folder.id, level + 1);
            });
            return html;
        }
    
        return `
            <div class="modal-header">
                <h2>Manage Folders</h2>
                <button class="icon-btn" id="close-modal-btn">×</button>
            </div>
            <div class="modal-body">
                <div class="infi-chatgpt-manageTabs-content">
                    <div style="display: flex; gap: 8px;">
                        <button class="button primary" id="add-folder-btn">Add Folder</button>
                        <input type="search" id="search-folders-input" placeholder="Search folders..." style="flex-grow: 1;">
                </div>
                <div id="folder-list-container">
                        ${renderFolderTree(null, 0)}
                </div>
                    <div class="infi-chatgpt-manageTabs-buttonsContainer">
                         <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                            <label for="hide-foldered-toggle">Hide Foldered Chats</label>
                            <input type="checkbox" id="hide-foldered-toggle" ${state.settings.hideFolderedChats ? 'checked' : ''} />
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    function getFolderItemHTML(folder) {
        const selected = state.selectedItems.includes(folder.id);
        return `
            <div class="list-item folder-item" data-id="${folder.id}">
                <input type="checkbox" class="item-checkbox" data-id="${folder.id}" ${selected ? 'checked' : ''}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span class="item-title">${folder.name}</span>
                <span class="item-count" style="margin-left: auto; color: var(--gf-text-secondary);">(${folder.chatIds.length})</span>
                <button class="add-chats-btn icon-btn" data-folder-id="${folder.id}" title="Add chats to folder">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
            </div>
        `;
    }

    function getAddFolderModalHTML(isEdit = false, folderName = '') {
        const title = isEdit ? 'Edit Folder Name' : 'Add New Folder';
        const buttonText = isEdit ? 'Save Changes' : 'Create Folder';
        return `
            <form id="add-folder-form" style="display: flex; flex-direction: column; gap: 16px;">
                <input type="text" id="folder-name-input" value="${folderName}" placeholder="Enter folder name" required>
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button type="button" id="cancel-folder-btn" class="button secondary">Cancel</button>
                    <button type="button" id="save-folder-btn" class="button primary">${buttonText}</button>
                </div>
            </form>
        `;
    }
    
    function getConfirmDeleteModalHTML() {
        return `<p>Are you sure you want to delete this folder and all its contents? This action cannot be undone.</p>`;
    }

    function getBulkDeleteModalHTML() {
        // Recursive function to render deletable tree
        function renderDeletableTree(parentId, level) {
            let html = '';
            const children = state.folders.filter(f => f.parentId === parentId);
            
            children.forEach(folder => {
                const chatCount = folder.chatIds?.length || 0;
                html += `
                    <div class="bulk-delete-item" style="margin-left: ${level * 20}px;">
                        <input type="checkbox" id="del-folder-${folder.id}" class="bulk-delete-checkbox" data-type="folder" data-id="${folder.id}">
                        <label for="del-folder-${folder.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
                                <path d="M10 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            ${folder.name} (${chatCount} chats)
                        </label>
                    </div>
                `;
                
                // Recursively render subfolders
                html += renderDeletableTree(folder.id, level + 1);
            });
            
            return html;
        }

        // Render folder tree
        const folderTreeHTML = renderDeletableTree(null, 0);
        
        // Get unassigned chats
        const assignedChatIds = new Set();
        state.folders.forEach(folder => {
            folder.chatIds?.forEach(chatId => assignedChatIds.add(chatId));
        });
        
        const conversations = getAllConversationElements();
        const unassignedChatsHTML = conversations.map((conv, index) => {
            const titleElement = conv.querySelector('.conversation-title');
            const title = titleElement ? titleElement.textContent.trim() : `Conversation ${index + 1}`;
            const chatId = getChatIdFromElement(conv) || `chat-index-${index}`;
            
            // Only include unassigned chats
            if (chatId && assignedChatIds.has(chatId)) {
                return '';
            }
            
        return `
                <div class="bulk-delete-item">
                    <input type="checkbox" id="del-check-${chatId}" class="bulk-delete-checkbox" data-type="chat" data-chat-id="${chatId}">
                    <label for="del-check-${chatId}">${title}</label>
                </div>
            `;
        }).filter(html => html !== '').join('');

        const listHTML = folderTreeHTML + (unassignedChatsHTML ? `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gf-border-color);">
                <h4 style="margin: 0 0 8px 0; color: var(--gf-text-secondary);">Unassigned Chats</h4>
                ${unassignedChatsHTML}
            </div>
        ` : '');

        return `
            <div id="bulk-delete-list">
                ${listHTML || '<p>No folders or conversations found.</p>'}
            </div>
            <div id="bulk-delete-controls">
                <div id="bulk-delete-select-all-container">
                    <input type="checkbox" id="bulk-delete-select-all">
                    <label for="bulk-delete-select-all" style="margin-left: 8px;">Select All</label>
                </div>
                <span id="bulk-delete-status"></span>
                <button id="start-bulk-delete-btn" class="button danger">Start Bulk Delete</button>
            </div>
        `;
    }

    // --- NEW: HTML Generator for the Add Chats Modal ---
    function getAddChatsModalHTML(folder, unassignedChats) {
        let chatListHTML = '';
        if (unassignedChats.length > 0) {
            chatListHTML = unassignedChats.map(chat => `
                <div class="list-item chat-item">
                    <input type="checkbox" class="chat-select-checkbox" data-chat-id="${chat.id}">
                    <span class="item-title">${chat.title}</span>
                </div>
            `).join('');
        } else {
            chatListHTML = '<p style="color: var(--gf-text-secondary); text-align: center; margin-top: 20px;">No available chats to add.</p>';
        }

        return `
            <div id="add-chats-list-container" style="max-height: 40vh; overflow-y: auto;">
                ${chatListHTML}
            </div>
            <div class="modal-buttons">
                <button type="button" id="cancel-add-chats" class="button secondary">Cancel</button>
                <button type="button" id="save-add-chats" class="button primary">Add Selected</button>
            </div>
        `;
    }

    // --- NEW: MODAL MANAGEMENT SYSTEM ---

    function openModal(id, title, contentHTML, width = 600) {
        if (isModalOpen) {
            closeModal();
        }

        hostElement = document.createElement('div');
        hostElement.id = INJECTOR_HOST_ID;
        document.body.appendChild(hostElement);
        shadow = hostElement.attachShadow({ mode: 'open' });
        
        const modalContainer = document.createElement('div');
        modalContainer.className = 'infi-chatgpt-modal';
        modalContainer.id = id;

        let finalHTML = contentHTML;

        // Check if the provided HTML already contains a header.
        // This is a simple check; could be made more robust.
        if (!contentHTML.includes('modal-header')) {
             finalHTML = `
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="icon-btn" id="close-modal-btn">×</button>
                </div>
                <div class="modal-body">
                    ${contentHTML}
            </div>
        `;
        }
        
        modalContainer.innerHTML = `
            <div class="modal-content" style="width: ${width}px;">
               ${finalHTML}
            </div>
        `;

        shadow.appendChild(modalContainer);
        createGlobalStyles(); // Apply styles AFTER content is added
        
        const closeBtn = shadow.getElementById('close-modal-btn');
        if(closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        isModalOpen = true;
    }

    function closeModal() {
        const modal = shadow.querySelector('.infi-chatgpt-modal');
        if (modal) {
            modal.remove();
        }
        isModalOpen = false;
        state.modalType = null;
    }

    // --- NEW & REFACTORED: LOGIC CONTROLLERS ---

    async function renderFolderList() {
        const listContainer = shadow.getElementById('folder-list-container');
        if (!listContainer) return;
        
        listContainer.innerHTML = '';
        const folders = state.folders;
        
        if (folders.length === 0) {
            listContainer.innerHTML = `<p>No folders yet. Click "Add Folder" to create one.</p>`;
            return;
        }

        folders.forEach(folder => {
            const itemHTML = getFolderItemHTML(folder);
            listContainer.innerHTML += itemHTML;
        });

        // Attach event listeners to newly rendered items
        attachFolderItemListeners();
    }
    
    function attachFolderItemListeners() {
        shadow.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('click', handleFolderItemClick);
        });
        shadow.querySelectorAll('.item-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', handleCheckboxChange);
        });
        // --- NEW: Attach listener for the new Add Chats button ---
        shadow.querySelectorAll('.add-chats-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent folder navigation click
                const folderId = e.currentTarget.dataset.folderId;
                showAddChatsModal(folderId);
            });
        });
    }
    
    function handleFolderItemClick(e) {
        if (e.target.type === 'checkbox') return; // Don't trigger if checkbox was clicked
        const folderId = e.currentTarget.dataset.id;
        // --- REPLACED CONSOLE.LOG WITH ACTUAL NAVIGATION ---
        showManageSingleFolderModal(folderId);
    }

    function handleCheckboxChange(e) {
        const folderId = e.target.dataset.folderId;
        if (e.target.checked) {
            if (!state.selectedItems.includes(folderId)) {
                state.selectedItems.push(folderId);
            }
        } else {
            state.selectedItems = state.selectedItems.filter(id => id !== folderId);
        }
        updateRemoveButtonState();
    }
    
    function updateRemoveButtonState() {
        const removeBtn = shadow.querySelector('#remove-selected-btn');
        if (removeBtn) {
            removeBtn.disabled = state.selectedItems.length === 0;
        }
    }
    

    async function handleManageFoldersLogic() {
        const modalContent = shadow.querySelector('.modal-content');
        if (!modalContent) return;

        // Using event delegation on the modal content
        modalContent.addEventListener('click', (e) => {
            const target = e.target;

            if (target.closest('#close-modal-btn')) {
                closeModal();
            } else if (target.closest('#add-folder-btn')) {
                showAddFolderModal();
            } else if (target.closest('.add-subfolder-btn')) {
                const parentId = target.closest('.add-subfolder-btn').dataset.parentId;
                showAddFolderModal(false, null, parentId);
            } else if (target.closest('.add-chats-btn')) {
                const folderId = target.closest('.add-chats-btn').dataset.folderId;
                showAddChatsModal(folderId);
            } else if (target.closest('.delete-folder-btn')) {
                const folderId = target.closest('.delete-folder-btn').dataset.folderId;
                showConfirmDeleteModal(folderId);
            } else if (target.closest('#remove-selected-btn')) {
                showConfirmDeleteModal();
            } else if (target.closest('.item-title')) {
                const folderId = target.closest('.list-item').dataset.folderId;
                showManageSingleFolderModal(folderId);
            }
        });

        modalContent.addEventListener('change', (e) => {
            if (e.target.classList.contains('folder-checkbox')) {
                handleCheckboxChange(e);
            } else if (e.target.matches('#hide-foldered-toggle')) {
                state.settings.hideFolderedChats = e.target.checked;
                saveData();
                updateChatVisibility();
            }
        });

        const searchInput = shadow.querySelector('#search-folders-input');
        if (searchInput) {
        searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const folderItems = shadow.querySelectorAll('.list-item');
                folderItems.forEach(item => {
                const title = item.querySelector('.item-title').textContent.toLowerCase();
                    item.style.display = title.includes(searchTerm) ? 'flex' : 'none';
            });
        });
        }
        updateRemoveButtonState();
    }


    function handleAddFolderLogic(isEdit = false, folderId = null, parentId = null) {
        const form = shadow.querySelector('#add-folder-form');
        const input = shadow.querySelector('#folder-name-input');
        const saveBtn = shadow.querySelector('#save-folder-btn');
        const cancelBtn = shadow.querySelector('#cancel-folder-btn');

        if (!form || !input || !saveBtn || !cancelBtn) return;

        const handleFormSubmit = (e) => {
            e.preventDefault(); // Prevent default form submission which violates CSP
            e.stopPropagation(); // Stop the event from bubbling up

            const folderName = input.value.trim();
            if (!folderName) return;

            if (isEdit) {
                const folder = state.folders.find(f => f.id === folderId);
                if (folder) {
                    folder.name = folderName;
                }
            } else {
                state.folders.push({
                    id: generateUUID(),
                    name: folderName,
                    chatIds: [],
                    parentId: parentId || null // Use the passed parentId
                });
            }
            saveData();
            closeModal();
            showManageFoldersModal(); // Refresh main modal
        };

        form.addEventListener('submit', handleFormSubmit);
        saveBtn.addEventListener('click', handleFormSubmit);
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        });
        input.focus();
    }
    

    function handleAddChatsLogic(folderId) {
        const saveBtn = shadow.getElementById('save-add-chats');
        const cancelBtn = shadow.getElementById('cancel-add-chats');

        saveBtn.addEventListener('click', async () => {
            const selectedCheckboxes = shadow.querySelectorAll('.chat-select-checkbox:checked');
            const chatIdsToAdd = Array.from(selectedCheckboxes).map(cb => cb.dataset.chatId);

            if (chatIdsToAdd.length > 0) {
                const folder = state.folders.find(f => f.id === folderId);
                if (folder) {
                    const newChatIds = chatIdsToAdd.filter(id => !folder.chatIds.includes(id));
                    folder.chatIds.push(...newChatIds);
                    await saveData();
                }
            }
            closeModal();
            showManageFoldersModal(); // Re-open the main modal to show updates
        });

        cancelBtn.addEventListener('click', () => {
            closeModal();
            showManageFoldersModal(); // Go back to the main modal
        });
    }

    // --- NEW: Utility to find chats not yet in a folder ---
    async function getUnassignedChats() {
        // This function will find all chats that are not currently in ANY folder.
        const allChatElements = getAllConversationElements();
        const allChatIdsAndTitles = allChatElements.map(el => ({
            id: getChatIdFromElement(el),
            title: el.textContent.trim()
        }));

        const assignedChatIds = new Set();
        state.folders.forEach(folder => {
            folder.chatIds.forEach(chatId => assignedChatIds.add(chatId));
        });

        return allChatIdsAndTitles.filter(chat => chat.id && !assignedChatIds.has(chat.id));
    }

    // --- NEW: Get all chat IDs in a folder and its subfolders ---
    function getAllChatIdsInFolder(folderId) {
        const result = [];
        const folder = state.folders.find(f => f.id === folderId);
        
        if (folder && folder.chatIds) {
            result.push(...folder.chatIds);
        }
        
        // Recursively get chat IDs from subfolders
        const subfolders = state.folders.filter(f => f.parentId === folderId);
        subfolders.forEach(subfolder => {
            result.push(...getAllChatIdsInFolder(subfolder.id));
        });
        
        return result;
    }

    // --- NEW: Remove folders and their descendants from state ---
    function removeFolders(folderIds) {
        const foldersToRemove = new Set(folderIds);
        
        // Recursively add all descendant folders
        function addDescendants(parentId) {
            const children = state.folders.filter(f => f.parentId === parentId);
            children.forEach(child => {
                foldersToRemove.add(child.id);
                addDescendants(child.id);
            });
        }
        
        folderIds.forEach(folderId => {
            addDescendants(folderId);
        });
        
        // Filter out all folders to be removed
        state.folders = state.folders.filter(f => !foldersToRemove.has(f.id));
    }

    // --- NEW: MODAL TRIGGER FUNCTIONS ---

    function showManageFoldersModal() {
        openModal('manage-folders-modal', 'Manage Folders', getManageFoldersModalHTML());
        handleManageFoldersLogic();
    }
    
    function showAddFolderModal(isEdit = false, folderId = null, parentId = null) {
        const folder = isEdit ? state.folders.find(f => f.id === folderId) : null;
        const modalTitle = isEdit ? 'Edit Folder' : (parentId ? 'Add Subfolder' : 'Add Folder');
        openModal(
            'add-folder-modal',
             modalTitle,
             getAddFolderModalHTML(isEdit, folder ? folder.name : ''),
             400
        );
        handleAddFolderLogic(isEdit, folderId, parentId);
    }
    
    // --- NEW: Trigger for the Add Chats Modal ---
    async function showAddChatsModal(folderId) {
        const folder = state.folders.find(f => f.id === folderId);
        if (!folder) return;

        const unassignedChats = await getUnassignedChats();

        openModal(
            'add-chats-modal',
            `Add Chats to "${folder.name}"`,
            getAddChatsModalHTML(folder, unassignedChats),
            500
        );
        handleAddChatsLogic(folderId);
    }
    
    // --- NEW: Trigger for Single Folder View ---
    function showManageSingleFolderModal(folderId) {
        const folder = state.folders.find(f => f.id === folderId);
        if (!folder) return;

        openModal(
            'manage-single-folder-modal',
            `Manage "${folder.name}"`,
            getManageSingleFolderModalHTML(folder),
            500
        );
        handleManageSingleFolderLogic(folderId);
    }

    function showConfirmDeleteModal(folderId) {
        openModal(
            'confirm-delete-modal',
            'Confirm Deletion',
            getConfirmDeleteModalHTML(),
            400
        );

        const confirmBtn = shadow.querySelector('#confirm-delete-btn');
        const cancelBtn = shadow.querySelector('#cancel-delete-btn');

        confirmBtn.addEventListener('click', () => {
            const foldersToDelete = new Set([folderId]);

            // Recursive function to find all children
            function getAllChildFolderIds(parentId) {
                const children = state.folders.filter(f => f.parentId === parentId);
                children.forEach(child => {
                    foldersToDelete.add(child.id);
                    getAllChildFolderIds(child.id);
                });
            }

            // Populate the set with all nested children
            getAllChildFolderIds(folderId);

            // Filter out the folders to be deleted
            state.folders = state.folders.filter(f => !foldersToDelete.has(f.id));
            
            saveData();
            closeModal();
            showManageFoldersModal();
        });

        cancelBtn.addEventListener('click', closeModal);
    }

    function showBulkDeleteModal() {
        openModal(
            'bulk-delete-modal',
            'Bulk Delete',
            getBulkDeleteModalHTML(),
            500
        );
        handleBulkDeleteLogic(); // Attach listeners after modal is created
    }

    // --- NEW: Core Bulk Deletion Logic ---
    async function deleteSingleConversation(conversationItem, abortSignal) {
        try {
            if (abortSignal?.aborted) throw new Error("Operation aborted by user.");

            // Following the original working logic from C/scripts/delete-conversations.js
            // The conversation item is the parent element, we need to find the next sibling
            // that contains the actions menu
            const actionsWrapper = conversationItem.nextElementSibling;
            if (!actionsWrapper) {
                throw new Error("Actions wrapper (sibling to conversation item) not found.");
            }

            // Look for the three-dot menu button in the actions wrapper
            let menuButton = findElement(ACTIONS_MENU_SELECTORS, actionsWrapper);
            if (!menuButton) {
                // Fallback: try to find any button in the wrapper
                menuButton = actionsWrapper.querySelector("button");
            }
            
            if (!menuButton) {
                throw new Error("Three-dot button not found in actions wrapper.");
            }
            
            menuButton.click();
            await delayMs(150); // Wait for menu to open
            if (abortSignal?.aborted) throw new Error("Operation aborted by user.");

            // The menu appears in a global overlay container
            const overlayContainer = findElement(OVERLAY_CONTAINER_SELECTORS);
            if (!overlayContainer) {
                throw new Error("Overlay container for delete menu not found.");
            }

            // Wait for and click the main delete button inside the menu
            const deleteButton = await waitForElement(DELETE_BUTTON_SELECTORS, overlayContainer, 7000);
            if (!deleteButton) {
                throw new Error("Delete button not found in menu");
            }
            deleteButton.click();
            await delayMs(150); // Wait for confirmation dialog
            if (abortSignal?.aborted) throw new Error("Operation aborted by user.");

            // Wait for and click the final confirmation button in the dialog
            const confirmButton = await waitForElement(CONFIRM_BUTTON_SELECTORS, overlayContainer, 7000);
            if (!confirmButton) {
                throw new Error("Confirm button not found in dialog");
            }
            confirmButton.click();

            // Wait for the conversation element to be removed from the DOM
            await waitForElementToDisappear(conversationItem, 15000);

            return { status: 'success' };
        } catch (error) {
            if (error.message.includes("aborted")) {
                console.log("Deletion cancelled by user.");
            } else {
                console.error("Error during single conversation deletion:", error, "on item:", conversationItem);
            }
            // Attempt to close any lingering modals by pressing Escape
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true });
            document.body.dispatchEvent(escapeEvent);
            await delayMs(100);
            return { status: 'error', error: error.message };
        }
    }

    // Helper function to wait for element to disappear (similar to original)
    function waitForElementToDisappear(element, timeout = 15000) {
        return new Promise((resolve, reject) => {
            if (!element || !document.body.contains(element)) {
                return resolve();
            }
            
            let elapsedTime = 0;
            const interval = 100;
            const timer = setInterval(() => {
                elapsedTime += interval;
                if (!document.body.contains(element) || element.offsetParent === null) {
                    clearInterval(timer);
                    resolve();
                } else if (elapsedTime >= timeout) {
                    clearInterval(timer);
                    console.error("Element did not disappear within timeout:", element);
                    reject(new Error("Element did not disappear within timeout."));
                }
            }, interval);
        });
    }


    function updateChatVisibility() {
        const allChatElements = getAllConversationElements();
        const assignedChatIds = new Set();
        
        if (state.settings.hideFolderedChats) {
            state.folders.forEach(folder => {
                folder.chatIds.forEach(chatId => assignedChatIds.add(chatId));
            });
        }

        allChatElements.forEach(el => {
            const chatId = getChatIdFromElement(el);
            if (chatId && assignedChatIds.has(chatId)) {
                el.style.display = 'none';
            } else {
                el.style.display = '';
            }
        });
    }

    function getManageSingleFolderModalHTML(folder) {
        const chatListHTML = folder.chatIds.map(chatId => {
            const chatElement = getAllConversationElements().find(el => getChatIdFromElement(el) === chatId);
            const title = chatElement ? chatElement.textContent.trim() : 'Chat not found';
            return `
                <div class="list-item chat-item" data-chat-id="${chatId}">
                    <span class="item-title">${title}</span>
                    <button class="icon-btn remove-from-folder-btn" data-chat-id="${chatId}" title="Remove from folder">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x-circle"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    </button>
                </div>
            `;
        }).join('');

        return `
            <div class="modal-header">
                <button class="icon-btn" id="back-to-folders-btn">← Back</button>
                <h2>${folder.name}</h2>
                <button class="icon-btn" id="close-modal-btn">×</button>
                </div>
            <div class="modal-body">
                ${chatListHTML || '<p>No chats in this folder yet.</p>'}
            </div>
        `;
    }


    function handleManageSingleFolderLogic(folderId) {
        const modalContent = shadow.querySelector('.modal-content');
        if (!modalContent) return;

        modalContent.addEventListener('click', (e) => {
            if (e.target.closest('#back-to-folders-btn')) {
                closeModal();
                showManageFoldersModal();
            } else if (e.target.closest('#close-modal-btn')) {
                closeModal();
            } else if (e.target.closest('.remove-from-folder-btn')) {
                const chatId = e.target.closest('.remove-from-folder-btn').dataset.chatId;
                const folder = state.folders.find(f => f.id === folderId);
                if (folder) {
                    folder.chatIds = folder.chatIds.filter(id => id !== chatId);
                    saveData();
                    updateChatVisibility(); // Update visibility after removing
                    // Refresh the modal
                    closeModal();
                    showManageSingleFolderModal(folderId);
                }
            } else if (e.target.closest('.chat-item')) {
                const chatId = e.target.closest('.chat-item').dataset.chatId;
                const chatElement = getAllConversationElements().find(el => getChatIdFromElement(el) === chatId);
                if (chatElement) {
                    chatElement.click();
                    closeModal();
                } else {
                    alert('Could not find the chat element to click.');
                }
            }
        });
    }

    // --- NEW: Bulk Delete Modal Event Handling ---
    function handleBulkDeleteLogic() {
        const modal = shadow.getElementById('bulk-delete-modal');
        if (!modal) return;

        const selectAllCheckbox = modal.querySelector('#bulk-delete-select-all');
        const allCheckboxes = modal.querySelectorAll('.bulk-delete-checkbox');
        const startButton = modal.querySelector('#start-bulk-delete-btn');
        const statusEl = modal.querySelector('#bulk-delete-status');

        if (!selectAllCheckbox || !startButton || !statusEl) {
            console.error("Bulk delete modal elements not found.");
            return;
        }

        // --- Event Listener for "Select All" ---
        selectAllCheckbox.addEventListener('change', () => {
            allCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });

        // --- Event Listener for "Start Bulk Delete" button ---
        startButton.addEventListener('click', async () => {
            const selectedCheckboxes = Array.from(allCheckboxes).filter(cb => cb.checked);
            
            if (selectedCheckboxes.length === 0) {
                statusEl.textContent = "No items selected.";
                return;
            }

            // --- NEW: Gather selections and create master chat ID list ---
            const selectedChatIds = [];
            const selectedFolderIds = [];
            
            selectedCheckboxes.forEach(checkbox => {
                if (checkbox.dataset.type === 'folder') {
                    selectedFolderIds.push(checkbox.dataset.id);
                } else if (checkbox.dataset.type === 'chat') {
                    selectedChatIds.push(checkbox.dataset.chatId);
                }
            });

            // Create master set of all chat IDs to delete
            const allChatIdsToDelete = new Set(selectedChatIds);
            
            // Add all chat IDs from selected folders and their subfolders
            selectedFolderIds.forEach(folderId => {
                const chatIds = getAllChatIdsInFolder(folderId);
                chatIds.forEach(chatId => allChatIdsToDelete.add(chatId));
            });

            const totalToDelete = allChatIdsToDelete.size;
            
            if (totalToDelete === 0) {
                statusEl.textContent = "No chats to delete.";
                return;
            }

            // --- NEW: Ensure all chats are visible before deletion ---
            const allConversations = getAllConversationElements();
            allChatIdsToDelete.forEach(chatId => {
                const chatElement = allConversations.find(el => getChatIdFromElement(el) === chatId);
                if (chatElement && chatElement.style.display === 'none') {
                    chatElement.style.display = '';
                }
            });

            // --- Set up and show the full-screen overlay ---
            closeModal(); // Close the small modal first
            createBulkDeleteOverlayStyles();
            const overlayWrapper = document.createElement('div');
            overlayWrapper.innerHTML = getBulkDeleteOverlayHTML();
            shadow.appendChild(overlayWrapper);
            
            const overlay = shadow.getElementById('gemini-delete-all-overlay');
            const overlayMessage = overlay.querySelector('.message');
            const progressStatus = overlay.querySelector('#progress-status');
            const progressCounter = overlay.querySelector('#progress-counter');
            const progressBarInner = overlay.querySelector('.progress-bar-inner');
            const cancelButton = overlay.querySelector('.cancel-button');
            const spinner = overlay.querySelector('.spinner');
            const completionTick = overlay.querySelector('.completion-tick');
            
            let wasCancelled = false;
            const cancellationController = new AbortController();

            cancelButton.addEventListener('click', () => {
                wasCancelled = true;
                cancellationController.abort();
                overlayMessage.textContent = 'Cancelling...';
            });

            // --- Execute deletion loop ---
            let deletedCount = 0;
            let errorCount = 0;
            const chatIdsArray = Array.from(allChatIdsToDelete);

            for (let i = 0; i < chatIdsArray.length; i++) {
                if (wasCancelled) break;

                const chatId = chatIdsArray[i];

                // Update overlay progress
                progressStatus.textContent = `Deleting chat ${i + 1} of ${totalToDelete}...`;
                progressCounter.textContent = `${i} / ${totalToDelete}`;
                progressBarInner.style.width = `${(i / totalToDelete) * 100}%`;
                
                const conversationElement = allConversations.find(el => getChatIdFromElement(el) === chatId);

                if (conversationElement) {
                    const result = await deleteSingleConversation(conversationElement, cancellationController.signal);
                    if (result.status === 'success') {
                        deletedCount++;
                    } else {
                        errorCount++;
                    }
                } else {
                    console.warn(`Could not find conversation element for chat ID: ${chatId}`);
                    errorCount++;
                }

                await delayMs(250);
            }

            // --- Remove selected folders from state ---
            if (selectedFolderIds.length > 0) {
                removeFolders(selectedFolderIds);
                await saveData();
            }
            
            // --- Finalize and hide overlay ---
            spinner.style.display = 'none';
            completionTick.style.display = 'block';
            progressBarInner.style.width = '100%';
            progressCounter.textContent = `${deletedCount} / ${totalToDelete}`;

            if (wasCancelled) {
                overlayMessage.textContent = 'Deletion cancelled.';
            } else if (errorCount > 0) {
                overlayMessage.textContent = `Finished. Deleted ${deletedCount}, failed ${errorCount}.`;
            } else {
                overlayMessage.textContent = 'All selected items deleted!';
            }
            
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.addEventListener('transitionend', () => {
                    overlay.remove();
                }, { once: true });
            }, 3000);
        });
    }

    // --- NEW: Full-screen Loading Overlay Logic (from extension C) ---
    
    function getBulkDeleteOverlayHTML() {
        return `
            <div id="gemini-delete-all-overlay" class="visible">
                <div class="spinner"></div>
                <svg class="completion-tick" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle class="tick-circle" cx="26" cy="26" r="25" fill="none"/>
                    <path class="tick-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
                <div class="message">Deleting...</div>
                <div class="progress-container">
                    <div class="progress-text">
                        <span id="progress-status">Starting...</span>
                        <span id="progress-counter">0 / 0</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-bar-inner"></div>
                    </div>
                </div>
                <button class="cancel-button">Cancel</button>
            </div>
        `;
    }

    function createBulkDeleteOverlayStyles() {
        if (shadow.getElementById("gemini-delete-all-overlay-styles")) return;

        const theme = {
            isDark: document.body.classList.contains('dark-theme'),
            // Simplified theme colors, can be expanded if needed
            backgroundColor: 'var(--gf-bg-primary)',
            textColor: 'var(--gf-text-primary)',
            secondaryTextColor: 'var(--gf-text-secondary)',
            accentColor: 'var(--gf-accent-primary)',
            progressTrackColor: 'rgba(128, 128, 128, 0.2)',
            successColor: '#34a853', // Standard green
        };

        const css = `
          #gemini-delete-all-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background-color: var(--gf-bg-primary);
            z-index: 2147483647; display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            font-family: 'Google Sans', Roboto, Arial, sans-serif; color: ${theme.textColor}; text-align: center;
            opacity: 1; transition: opacity 0.3s ease-in-out;
          }
          #gemini-delete-all-overlay.hidden { opacity: 0; pointer-events: none; }
          #gemini-delete-all-overlay .spinner {
            display: block;
            border: 3px solid ${theme.progressTrackColor}; border-top: 3px solid ${theme.accentColor};
            border-radius: 50%; width: 50px; height: 50px;
            animation: spin 0.8s linear infinite; margin-bottom: 25px;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          
          #gemini-delete-all-overlay .completion-tick {
            display: none; width: 60px; height: 60px;
            border-radius: 50%;
            stroke-width: 5; stroke: ${theme.successColor};
            stroke-miterlimit: 10;
            animation: draw-tick-container 0.5s ease-out forwards;
            margin-bottom: 20px;
          }
          #gemini-delete-all-overlay .completion-tick .tick-path {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
            animation: draw-tick-path 0.5s 0.2s ease-out forwards;
          }
          @keyframes draw-tick-container {
            0% { opacity: 0; transform: scale(0.5); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes draw-tick-path {
            to { stroke-dashoffset: 0; }
          }
          #gemini-delete-all-overlay .message { font-size: 20px; font-weight: 500; margin-bottom: 8px; }
          
          #gemini-delete-all-overlay .progress-container {
            display: flex; flex-direction: column; align-items: center;
            width: 300px; margin: 10px 0;
          }
          #gemini-delete-all-overlay .progress-text { 
            font-size: 14px; color: ${theme.secondaryTextColor}; 
            margin-bottom: 8px; width: 100%;
            display: flex; justify-content: space-between;
          }
          
          #gemini-delete-all-overlay .progress-bar {
            width: 100%; height: 4px; background-color: ${theme.progressTrackColor};
            border-radius: 4px; overflow: hidden;
          }
          #gemini-delete-all-overlay .progress-bar-inner {
            height: 100%; width: 0%;
            background-color: ${theme.accentColor};
            transition: width 0.25s ease-out;
            border-radius: 4px;
          }
          
          #gemini-delete-all-overlay .cancel-button {
            margin-top: 16px; color: ${theme.secondaryTextColor};
            font-size: 14px; background: none; border: 1px solid ${theme.secondaryTextColor};
            padding: 8px 16px; cursor: pointer;
            font-family: 'Google Sans', Roboto, Arial, sans-serif;
            border-radius: 4px; transition: background-color 0.15s;
          }
          #gemini-delete-all-overlay .cancel-button:hover {
            background-color: rgba(128, 128, 128, 0.2);
          }
        `;
        const styleEl = document.createElement("style");
        styleEl.id = "gemini-delete-all-overlay-styles";
        styleEl.textContent = css;
        shadow.appendChild(styleEl);
    }

    async function injectPromptLibraryResources() {
        async function fetchWebAccessibleResource(resourcePath) {
            try {
                const url = chrome.runtime.getURL(resourcePath);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${resourcePath}: ${response.status}`);
                }
                return await response.text();
            } catch (error) {
                console.error(`Error fetching web accessible resource ${resourcePath}:`, error);
                return null;
            }
        }

        // Wait for both HTML and CSS to be loaded
        const [htmlContent, cssContent] = await Promise.all([
            fetchWebAccessibleResource('prompt_library.html'),
            fetchWebAccessibleResource('prompt_library.css')
        ]);

        if (htmlContent) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            shadow.appendChild(tempDiv.firstElementChild);
        }

        if (cssContent) {
            const styleElement = document.createElement('style');
            styleElement.textContent = cssContent;
            shadow.appendChild(styleElement);
        }
    }

    // --- WORD COUNTER FUNCTIONALITY ---
    let wordCounterInstance = null;

    async function initializeWordCounter() {
        // Destroy existing instance if it exists
        if (wordCounterInstance) {
            wordCounterInstance.destroy();
            wordCounterInstance = null;
        }

        // Create new instance - WordCounter is already loaded as a content script
        try {
            if (typeof WordCounter !== 'undefined') {
                wordCounterInstance = new WordCounter(shadow);
                console.log('Word counter initialized successfully');
            } else {
                console.error('WordCounter class not found');
            }
        } catch (error) {
            console.error('Error initializing word counter:', error);
        }
    }

    // --- VOICE DOWNLOAD FUNCTIONALITY ---
    
    async function initializeVoiceDownload() {
        if (!voiceDownloadInstance && window.VoiceDownload) {
            try {
                voiceDownloadInstance = new window.VoiceDownload(shadow);
                console.log('Voice download initialized successfully');
            } catch (error) {
                console.error('Error initializing voice download:', error);
            }
        }
        if (voiceDownloadInstance) {
            voiceDownloadInstance.show();
        }
    }

    // --- REFACTORED: INITIALIZATION ---

    async function init() {
        if (document.getElementById(INJECTOR_HOST_ID)) return;
        await delay(500);

        // Find a more stable insertion point, like the recent conversations list container.
        const recentConversationsList = document.querySelector('conversations-list');
        if (recentConversationsList && !document.getElementById(INJECTOR_HOST_ID)) {
            hostElement = document.createElement('div');
            hostElement.id = INJECTOR_HOST_ID;
            shadow = hostElement.attachShadow({ mode: 'open' });
            
            createGlobalStyles();
            
            // Inject the main "Folders" tab
            const sidebarTabHTML = getSidebarTabHTML();
            shadow.innerHTML += sidebarTabHTML;
            
            // Prepend our UI host to the conversation list
            recentConversationsList.prepend(hostElement);
            
            // Add event listeners for the new dropdown functionality
            const toolboxBtn = shadow.getElementById('gemini-toolbox-btn');
            const toolboxDropdown = shadow.getElementById('gemini-toolbox-dropdown');
            const manageFoldersLink = shadow.getElementById('manage-folders-link');
            const bulkDeleteLink = shadow.getElementById('bulk-delete-link');
            const promptLibraryLink = shadow.getElementById('prompt-library-link');
            const wordCounterLink = shadow.getElementById('word-counter-link');
            const voiceDownloadLink = shadow.getElementById('voice-download-link');
            const dropdownArrow = shadow.querySelector('.dropdown-arrow');
            
            // Toggle dropdown on toolbox button click
            toolboxBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = toolboxDropdown.style.display !== 'none';
                toolboxDropdown.style.display = isVisible ? 'none' : 'block';
                dropdownArrow.classList.toggle('rotated', !isVisible);
            });
            
            // Handle manage folders link click
            manageFoldersLink.addEventListener('click', (e) => {
                e.stopPropagation();
                showManageFoldersModal();
                toolboxDropdown.style.display = 'none';
                dropdownArrow.classList.remove('rotated');
            });

            // Handle bulk delete link click
            bulkDeleteLink.addEventListener('click', (e) => {
                e.stopPropagation();
                showBulkDeleteModal();
                toolboxDropdown.style.display = 'none';
                dropdownArrow.classList.remove('rotated');
            });

            // Handle prompt library link click
            promptLibraryLink.addEventListener('click', (e) => {
                e.stopPropagation();
                if (promptLibraryInstance) {
                    promptLibraryInstance.show();
                }
                toolboxDropdown.style.display = 'none';
                dropdownArrow.classList.remove('rotated');
            });

            // Handle word counter link click
            wordCounterLink.addEventListener('click', (e) => {
                e.stopPropagation();
                initializeWordCounter();
                toolboxDropdown.style.display = 'none';
                dropdownArrow.classList.remove('rotated');
            });

            // Handle voice download link click
            voiceDownloadLink.addEventListener('click', (e) => {
                e.stopPropagation();
                initializeVoiceDownload();
                toolboxDropdown.style.display = 'none';
                dropdownArrow.classList.remove('rotated');
            });

            // Implement click outside to close functionality
            document.addEventListener('click', (e) => {
                const toolboxContainer = shadow.getElementById('gemini-toolbox-container');
                if (toolboxContainer && !toolboxContainer.contains(e.target)) {
                    toolboxDropdown.style.display = 'none';
                    dropdownArrow.classList.remove('rotated');
                }
            });

            await loadData();
            await injectPromptLibraryResources(); // Inject prompt library resources

            // Initialize PromptLibrary after HTML is loaded
            if (typeof PromptLibrary !== 'undefined') {
                promptLibraryInstance = new PromptLibrary(shadow);
                // Initialize event listeners now that HTML is loaded
                promptLibraryInstance.initializeEventListeners();
            } else {
                // Retry if the script hasn't loaded yet
                setTimeout(() => {
                    if (typeof PromptLibrary !== 'undefined') {
                        promptLibraryInstance = new PromptLibrary(shadow);
                        promptLibraryInstance.initializeEventListeners();
                    }
                }, 500);
            }

            // Initialize VoiceDownload feature
            if (typeof VoiceDownload !== 'undefined') {
                try {
                    voiceDownloadInstance = new VoiceDownload(shadow);
                    console.log('Voice download auto-initialized successfully');
                } catch (error) {
                    console.error('Error auto-initializing voice download:', error);
                }
            } else {
                // Retry if the script hasn't loaded yet
                setTimeout(() => {
                    if (typeof VoiceDownload !== 'undefined') {
                        try {
                            voiceDownloadInstance = new VoiceDownload(shadow);
                            console.log('Voice download auto-initialized successfully (delayed)');
                        } catch (error) {
                            console.error('Error auto-initializing voice download (delayed):', error);
                        }
                    }
                }, 500);
            }
        }
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                if (document.querySelector('conversations-list') && !document.getElementById(INJECTOR_HOST_ID)) {
                    init();
                    // No need to break; let it run to catch theme changes etc.
                }
                 // Add theme change observation
                const newTheme = detectTheme();
                if (newTheme !== currentTheme) {
                    applyThemeStyles();
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    
    // Initial check
    init();

})(); 