#!/bin/bash

# Install Java JDK 17 and configure environment for Android builds

echo "Installing OpenJDK 17..."
sudo apt update
sudo apt install -y openjdk-17-jdk

# Verify installation
echo -e "\nVerifying Java installation..."
java -version
javac -version

# Find Java installation path
JAVA_PATH=$(update-alternatives --list java | grep java-17)
if [ -z "$JAVA_PATH" ]; then
    echo "Error: Java 17 installation not found"
    exit 1
fi

# Extract JAVA_HOME from the path (remove /bin/java from the end)
JAVA_HOME_PATH=$(dirname $(dirname $JAVA_PATH))

echo -e "\nJava installed at: $JAVA_HOME_PATH"

# Add JAVA_HOME and PATH to .bashrc
echo -e "\nConfiguring environment variables..."

# Check if JAVA_HOME is already in .bashrc
if ! grep -q "export JAVA_HOME=" ~/.bashrc; then
    echo "" >> ~/.bashrc
    echo "# Java configuration" >> ~/.bashrc
    echo "export JAVA_HOME=$JAVA_HOME_PATH" >> ~/.bashrc
    echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.bashrc
    echo "Environment variables added to ~/.bashrc"
else
    echo "JAVA_HOME already exists in ~/.bashrc, updating..."
    sed -i "s|export JAVA_HOME=.*|export JAVA_HOME=$JAVA_HOME_PATH|" ~/.bashrc
fi

# Also add to .profile for non-interactive shells
if ! grep -q "export JAVA_HOME=" ~/.profile; then
    echo "" >> ~/.profile
    echo "# Java configuration" >> ~/.profile
    echo "export JAVA_HOME=$JAVA_HOME_PATH" >> ~/.profile
    echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.profile
fi

# Export for current session
export JAVA_HOME=$JAVA_HOME_PATH
export PATH=$JAVA_HOME/bin:$PATH

echo -e "\nJava installation complete!"
echo "JAVA_HOME set to: $JAVA_HOME"
echo -e "\nPlease run: source ~/.bashrc"
echo "Or restart your terminal for changes to take effect."