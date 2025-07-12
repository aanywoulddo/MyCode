class PromptLibrary {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
        this.prompts = [
            { title: 'Marketing Copy', content: 'Write a catchy marketing slogan for a new coffee brand.', category: 'marketing' },
            { title: 'Sales Email', content: 'Draft a follow-up email to a potential client who has shown interest in our product.', category: 'sales' },
            { title: 'Code Generation', content: 'Generate a Python function to calculate the factorial of a number.', category: 'coding' },
            { title: 'Creative Writing', content: 'Write a short story about a robot who discovers music.', category: 'creative' },
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
            promptElement.innerHTML = `
                <div class="title">${prompt.title}</div>
                <div class="content">${prompt.content}</div>
            `;
            promptElement.addEventListener('click', () => this.usePrompt(prompt.content));
            promptList.appendChild(promptElement);
        });
    }

    usePrompt(content) {
        const geminiInput = document.querySelector('textarea');
        if (geminiInput) {
            geminiInput.value = content;
            this.hide();
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