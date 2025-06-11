const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get lint errors
const lintOutput = execSync('npm run lint -- --format json', {
  encoding: 'utf8',
  stdio: 'pipe',
  cwd: __dirname,
}).toString();

let results;
try {
  results = JSON.parse(lintOutput);
} catch (e) {
  console.error('Could not parse lint output');
  process.exit(1);
}

// Process each file
results.forEach((result) => {
  if (result.errorCount === 0 && result.warningCount === 0) return;

  const filePath = result.filePath;
  const unusedVarsMessages = result.messages.filter(
    (msg) =>
      msg.ruleId === '@typescript-eslint/no-unused-vars' &&
      msg.message.includes('is defined but never used'),
  );

  if (unusedVarsMessages.length === 0) return;

  console.log(`Processing ${filePath}...`);

  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Process messages in reverse order to avoid line number shifts
  unusedVarsMessages.sort((a, b) => b.line - a.line);

  unusedVarsMessages.forEach((msg) => {
    const line = lines[msg.line - 1];
    if (!line) return;

    // Extract the variable name from the message
    const match = msg.message.match(/'([^']+)' is defined but never used/);
    if (!match) return;

    const varName = match[1];

    // Check if it's an import statement
    if (line.includes('import')) {
      // Handle different import patterns
      if (line.includes(`import ${varName} from`)) {
        // Default import - remove entire line
        lines[msg.line - 1] = '';
      } else if (line.includes(`{ ${varName}`)) {
        // Named import - remove just the variable
        lines[msg.line - 1] = line
          .replace(new RegExp(`{\\s*${varName}\\s*,\\s*`, 'g'), '{ ')
          .replace(new RegExp(`,\\s*${varName}\\s*}`, 'g'), ' }')
          .replace(new RegExp(`,\\s*${varName}\\s*,`, 'g'), ', ')
          .replace(new RegExp(`{\\s*${varName}\\s*}`, 'g'), '{}');

        // If empty imports remain, remove the line
        if (lines[msg.line - 1].includes('{}')) {
          lines[msg.line - 1] = '';
        }
      }
    }
  });

  // Remove empty lines and write back
  const newContent = lines.filter((line) => line !== '').join('\n');
  fs.writeFileSync(filePath, newContent);
  console.log(
    `Fixed ${unusedVarsMessages.length} unused imports in ${path.basename(filePath)}`,
  );
});

console.log('Done!');
