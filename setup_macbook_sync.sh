#!/bin/bash

# MacBook Synchronization Setup Script
# Run this script on your MacBook to set up repository synchronization

echo "🚀 Setting up MacBook synchronization with GitHub repository..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Get repository URL
REPO_URL="https://github.com/aanywoulddo/MyCode.git"

# Ask for directory name
read -p "Enter directory name for the repository (default: MyCode): " DIR_NAME
DIR_NAME=${DIR_NAME:-MyCode}

# Clone repository if it doesn't exist
if [ ! -d "$DIR_NAME" ]; then
    echo "📥 Cloning repository..."
    git clone "$REPO_URL" "$DIR_NAME"
    cd "$DIR_NAME"
else
    echo "📁 Repository directory already exists, entering it..."
    cd "$DIR_NAME"
fi

# Set up Git configuration
echo "⚙️ Setting up Git configuration..."
read -p "Enter your Git username: " GIT_USERNAME
read -p "Enter your Git email: " GIT_EMAIL

git config --global user.name "$GIT_USERNAME"
git config --global user.email "$GIT_EMAIL"

# Check out main branch and pull latest
echo "🔄 Syncing with main branch..."
git checkout main
git pull origin main

# Create development branch
echo "🌿 Creating development branch..."
git checkout -b macos-development 2>/dev/null || git checkout macos-development

# Set up Python virtual environment
echo "🐍 Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install playwright

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
playwright install

# Create Chrome launcher script
echo "🔧 Creating Chrome launcher script..."
cat > launch_chrome.sh << 'EOL'
#!/bin/bash
echo "🚀 Launching Chrome with remote debugging..."
echo "Keep this terminal open while using the automation system."
echo "Press Ctrl+C to stop Chrome."
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
EOL

chmod +x launch_chrome.sh

# Create sync script
echo "🔄 Creating sync script..."
cat > sync_changes.sh << 'EOL'
#!/bin/bash
echo "🔄 Syncing changes from GitHub..."

# Pull latest changes from main
git checkout main
git pull origin main

# Merge into development branch
git checkout macos-development
git merge main

echo "✅ Sync complete! You're now on the macos-development branch."
EOL

chmod +x sync_changes.sh

# Create push script
echo "📤 Creating push script..."
cat > push_changes.sh << 'EOL'
#!/bin/bash
echo "📤 Pushing changes to GitHub..."

# Add all changes
git add .

# Commit with message
if [ -z "$1" ]; then
    echo "Please provide a commit message:"
    read -p "Commit message: " COMMIT_MSG
else
    COMMIT_MSG="$1"
fi

git commit -m "$COMMIT_MSG"

# Push to GitHub
git push origin macos-development

echo "✅ Changes pushed to GitHub!"
EOL

chmod +x push_changes.sh

# Create daily workflow script
echo "📅 Creating daily workflow script..."
cat > daily_workflow.sh << 'EOL'
#!/bin/bash
echo "📅 Daily workflow helper..."
echo "What would you like to do?"
echo "1. Pull latest changes (morning routine)"
echo "2. Push your changes (evening routine)"
echo "3. Launch Chrome for automation"
echo "4. Exit"

read -p "Choose option (1-4): " choice

case $choice in
    1)
        echo "🌅 Morning routine: Pulling latest changes..."
        ./sync_changes.sh
        ;;
    2)
        echo "🌆 Evening routine: Pushing changes..."
        read -p "Describe your changes: " changes
        ./push_changes.sh "$changes"
        ;;
    3)
        echo "🚀 Launching Chrome for automation..."
        ./launch_chrome.sh
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        ;;
esac
EOL

chmod +x daily_workflow.sh

# Final instructions
echo ""
echo "🎉 Setup complete! Here's what you can do now:"
echo ""
echo "📁 You're in the repository directory: $(pwd)"
echo ""
echo "🔧 Available commands:"
echo "  ./daily_workflow.sh    - Interactive daily workflow helper"
echo "  ./sync_changes.sh      - Pull latest changes from GitHub"
echo "  ./push_changes.sh      - Push your changes to GitHub"
echo "  ./launch_chrome.sh     - Launch Chrome for automation"
echo ""
echo "🐍 To activate Python environment:"
echo "  source venv/bin/activate"
echo ""
echo "🚀 To test the automation system:"
echo "  1. Run: ./launch_chrome.sh (keep terminal open)"
echo "  2. In another terminal: source venv/bin/activate"
echo "  3. Run: python 'FINAL WORK/start_chrome.py'"
echo ""
echo "📖 Read REPOSITORY_ANALYSIS_AND_SYNC_PLAN.md for detailed instructions."