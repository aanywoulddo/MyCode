class PromptLibrary {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
        this.prompts = [
            // Marketing
            { title: 'Marketing Copy', content: 'Write a catchy marketing slogan for a new coffee brand.', category: 'marketing' },
            { title: 'Product Description', content: 'Create a compelling product description for [product name] that highlights its key features and benefits.', category: 'marketing' },
            { title: 'Social Media Post', content: 'Write an engaging social media post about [topic] that encourages interaction and shares.', category: 'marketing' },
            { title: 'Email Marketing', content: 'Create a persuasive email marketing campaign for [product/service] targeting [audience].', category: 'marketing' },
            
            // Sales
            { title: 'Sales Email', content: 'Draft a follow-up email to a potential client who has shown interest in our product.', category: 'sales' },
            { title: 'Sales Pitch', content: 'Create a compelling 2-minute sales pitch for [product/service] addressing common objections.', category: 'sales' },
            { title: 'Cold Outreach', content: 'Write a professional cold outreach message for [target audience] about [product/service].', category: 'sales' },
            
            // Coding
            { title: 'Code Generation', content: 'Generate a Python function to calculate the factorial of a number.', category: 'coding' },
            { title: 'Code Review', content: 'Review this code and suggest improvements for performance, readability, and best practices: [paste code here]', category: 'coding' },
            { title: 'Bug Fix', content: 'Help me debug this code. Here\'s the error I\'m getting: [error message] and here\'s the code: [paste code]', category: 'coding' },
            { title: 'API Documentation', content: 'Create comprehensive API documentation for this function: [paste function]', category: 'coding' },
            { title: 'Unit Tests', content: 'Write unit tests for this function: [paste function]', category: 'coding' },
            
            // Creative
            { title: 'Creative Writing', content: 'Write a short story about a robot who discovers music.', category: 'creative' },
            { title: 'Blog Post', content: 'Write a comprehensive blog post about [topic] that is engaging and informative.', category: 'creative' },
            { title: 'Video Script', content: 'Create a script for a 5-minute video explaining [topic] to [target audience].', category: 'creative' },
            { title: 'Content Ideas', content: 'Generate 10 creative content ideas for [topic/industry] that would engage [target audience].', category: 'creative' },
            
            // Personal Development
            { title: 'Goal Setting', content: 'Help me create a SMART goal framework for achieving [specific objective] within [timeframe].', category: 'personal_development' },
            { title: 'Career Advice', content: 'Provide career advice for someone looking to transition from [current role] to [desired role].', category: 'personal_development' },
            { title: 'Learning Plan', content: 'Create a structured learning plan to master [skill/topic] in [timeframe].', category: 'personal_development' },
            { title: 'Resume Review', content: 'Review and improve this resume for a [target position]: [paste resume]', category: 'personal_development' },
            
            // Customer Service
            { title: 'Customer Support', content: 'Write a helpful customer support response for a client who [describe issue].', category: 'customer_service' },
            { title: 'Complaint Response', content: 'Draft a professional response to this customer complaint: [paste complaint]', category: 'customer_service' },
            { title: 'FAQ Creation', content: 'Create comprehensive FAQ answers for common questions about [product/service].', category: 'customer_service' },
            
            // SEO
            { title: 'SEO Content', content: 'Write SEO-optimized content about [topic] targeting the keyword "[keyword]".', category: 'seo' },
            { title: 'Meta Descriptions', content: 'Create compelling meta descriptions for pages about [topic] that are under 160 characters.', category: 'seo' },
            { title: 'Keyword Research', content: 'Suggest relevant keywords and search terms for content about [topic].', category: 'seo' },
            
            // Engineering
            { title: 'Technical Documentation', content: 'Write technical documentation for [system/process] that explains how it works and how to use it.', category: 'engineering' },
            { title: 'Architecture Design', content: 'Help me design a system architecture for [project description] considering scalability and performance.', category: 'engineering' },
            { title: 'Requirements Analysis', content: 'Analyze these requirements and identify potential issues or improvements: [paste requirements]', category: 'engineering' },
            
            // Education
            { title: 'Lesson Plan', content: 'Create a lesson plan for teaching [topic] to [target audience/grade level].', category: 'education' },
            { title: 'Study Guide', content: 'Create a comprehensive study guide for [subject/topic] covering key concepts and practice questions.', category: 'education' },
            { title: 'Quiz Generator', content: 'Generate a quiz with 10 questions about [topic] with multiple choice answers.', category: 'education' },
            
            // Finance
            { title: 'Budget Analysis', content: 'Help me analyze this budget and suggest optimizations: [paste budget details]', category: 'finance' },
            { title: 'Investment Advice', content: 'Provide general investment guidance for someone with [financial situation] and [risk tolerance].', category: 'finance' },
            { title: 'Financial Planning', content: 'Create a basic financial plan for achieving [financial goal] within [timeframe].', category: 'finance' },
        ];
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const closeButton = this.shadowRoot.querySelector('.close-button');
        const searchBar = this.shadowRoot.getElementById('search-bar');
        const categoryFilter = this.shadowRoot.getElementById('category-filter');

        if (closeButton) {
            closeButton.onclick = () => this.hide();
        }

        if (searchBar) {
            searchBar.onkeyup = () => this.filterPrompts();
        }

        if (categoryFilter) {
            categoryFilter.onchange = () => this.filterPrompts();
        }

        const modal = this.shadowRoot.getElementById('prompt-library-modal');
        window.onclick = (event) => {
            if (event.target == modal) {
                this.hide();
            }
        }
    }

    show() {
        const modal = this.shadowRoot.getElementById('prompt-library-modal');
        modal.style.display = 'block';
        this.loadPrompts();
    }

    hide() {
        const modal = this.shadowRoot.getElementById('prompt-library-modal');
        modal.style.display = 'none';
    }

    loadPrompts(filteredPrompts = this.prompts) {
        const promptList = this.shadowRoot.getElementById('prompt-list');
        promptList.innerHTML = ''; 

        filteredPrompts.forEach(prompt => {
            const promptElement = document.createElement('div');
            promptElement.className = 'prompt-item';
            promptElement.setAttribute('data-category', prompt.category);
            promptElement.innerHTML = `
                <div class="title">${prompt.title}</div>
                <div class="content">${prompt.content}</div>
            `;
            promptElement.addEventListener('click', () => this.usePrompt(prompt.content));
            promptList.appendChild(promptElement);
        });
    }

    usePrompt(content) {
        // Try multiple selectors for different Gemini UI versions
        const selectors = [
            '.ql-editor.textarea.new-input-ui',  // Primary selector from provided HTML
            '.ql-editor[contenteditable="true"]', // Backup selector
            'rich-textarea .ql-editor',          // Another variation
            'div[contenteditable="true"][role="textbox"]', // Generic contenteditable textbox
            'textarea' // Fallback for older versions
        ];

        let geminiInput = null;
        
        // Try each selector until we find the input
        for (const selector of selectors) {
            geminiInput = document.querySelector(selector);
            if (geminiInput) {
                console.log(`Found Gemini input using selector: ${selector}`);
                break;
            }
        }

        if (geminiInput) {
            // Handle different input types
            if (geminiInput.tagName.toLowerCase() === 'textarea') {
                // Traditional textarea
                geminiInput.value = content;
                geminiInput.focus();
            } else if (geminiInput.contentEditable === 'true') {
                // Contenteditable div (Quill editor)
                geminiInput.innerHTML = `<p>${content}</p>`;
                geminiInput.focus();
                
                // Trigger input events to notify the application
                const inputEvent = new Event('input', { bubbles: true });
                const changeEvent = new Event('change', { bubbles: true });
                geminiInput.dispatchEvent(inputEvent);
                geminiInput.dispatchEvent(changeEvent);
                
                // Place cursor at the end
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(geminiInput);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            
            this.hide();
        } else {
            console.error('Could not find Gemini input field. Available selectors tried:', selectors);
            // Show user-friendly error
            alert('Could not find the chat input field. Please make sure you are on the Gemini chat page.');
        }
    }

    filterPrompts() {
        const searchTerm = this.shadowRoot.getElementById('search-bar').value.toLowerCase();
        const category = this.shadowRoot.getElementById('category-filter').value;

        const filtered = this.prompts.filter(prompt => {
            const matchesSearch = prompt.title.toLowerCase().includes(searchTerm) || prompt.content.toLowerCase().includes(searchTerm);
            const matchesCategory = category === 'all' || prompt.category === category;
            return matchesSearch && matchesCategory;
        });

        this.loadPrompts(filtered);
    }
} 