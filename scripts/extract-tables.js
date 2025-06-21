#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const typesPath = path.join(__dirname, "../src/lib/supabase/types.ts");
const outputPath = path.join(__dirname, "../docs/DATABASE_SCHEMA.md");

function extractTableSchemas() {
  // Import and evaluate the types file to get actual type information
  const tempFilePath = path.join(__dirname, "temp-types.js");

  try {
    // Read the TypeScript file and convert it to JavaScript for evaluation
    const content = fs.readFileSync(typesPath, "utf8");

    // Create a simple JavaScript version that exports the Database type structure
    const jsContent = `
// Convert TypeScript types to runtime object for inspection
const Database = {
  public: {
    Tables: {
      ${extractTablesFromContent(content)}
    }
  }
};

module.exports = { Database };
`;

    fs.writeFileSync(tempFilePath, jsContent);

    // Import the generated JavaScript module
    delete require.cache[tempFilePath]; // Clear cache
    const { Database } = require(tempFilePath);

    // Generate markdown from the actual type structure
    generateMarkdownFromTypes(Database.public.Tables);
  } catch (error) {
    console.error("Error parsing types:", error.message);
    // Fallback to simpler approach
    generateMarkdownFromContent();
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

function extractTablesFromContent(content) {
  // Extract just the table definitions in a simpler way
  const tables = [];
  const lines = content.split("\n");
  let currentTable = null;
  let inRowSection = false;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for table definitions
    if (line.match(/^\w+: \{$/) && lines[i + 1]?.trim() === "Row: {") {
      currentTable = {
        name: line.split(":")[0],
        fields: {},
      };
      continue;
    }

    // Start of Row section
    if (line === "Row: {" && currentTable) {
      inRowSection = true;
      braceDepth = 1;
      continue;
    }

    // Count braces to know when Row section ends
    if (inRowSection) {
      braceDepth += (line.match(/\{/g) || []).length;
      braceDepth -= (line.match(/\}/g) || []).length;

      // Extract field definition
      const fieldMatch = line.match(/^(\w+): (.+)$/);
      if (fieldMatch) {
        currentTable.fields[fieldMatch[1]] = fieldMatch[2];
      }

      // End of Row section
      if (braceDepth === 0) {
        inRowSection = false;
        tables.push(currentTable);
        currentTable = null;
      }
    }
  }

  return tables
    .map(
      (table) =>
        `${table.name}: { Row: { ${Object.entries(table.fields)
          .map(([name, type]) => `${name}: "${type}"`)
          .join(", ")} } }`
    )
    .join(",\n      ");
}

function generateMarkdownFromContent() {
  const content = fs.readFileSync(typesPath, "utf8");

  let markdown = `# Database Schema\n\n`;
  markdown += `> Auto-generated from \`src/lib/supabase/types.ts\`\n\n`;

  const tables = [];
  const lines = content.split("\n");
  let currentTable = null;
  let inRowSection = false;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for table definitions
    if (line.match(/^\w+: \{$/) && lines[i + 1]?.trim() === "Row: {") {
      currentTable = {
        name: line.split(":")[0],
        fields: [],
      };
      continue;
    }

    // Start of Row section
    if (line === "Row: {" && currentTable) {
      inRowSection = true;
      braceDepth = 1;
      continue;
    }

    // Count braces to know when Row section ends
    if (inRowSection) {
      braceDepth += (line.match(/\{/g) || []).length;
      braceDepth -= (line.match(/\}/g) || []).length;

      // Extract field definition
      const fieldMatch = line.match(/^(\w+): (.+)$/);
      if (fieldMatch) {
        currentTable.fields.push({
          name: fieldMatch[1],
          type: fieldMatch[2],
        });
      }

      // End of Row section
      if (braceDepth === 0) {
        inRowSection = false;
        tables.push(currentTable);
        currentTable = null;
      }
    }
  }

  tables.forEach((table) => {
    markdown += `## ${table.name}\n\n`;

    if (table.fields.length > 0) {
      markdown += `| Field | Type |\n`;
      markdown += `|-------|------|\n`;

      table.fields.forEach((field) => {
        const cleanType = field.type.trim().replace(/\s+/g, " ");
        markdown += `| ${field.name} | \`${cleanType}\` |\n`;
      });
    }

    markdown += `\n`;
  });

  // Ensure docs directory exists
  const docsDir = path.dirname(outputPath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, markdown);
  console.log(`✅ Schema documentation generated at ${outputPath}`);
}

function generateMarkdownFromTypes(tables) {
  let markdown = `# Database Schema\n\n`;
  markdown += `> Auto-generated from \`src/lib/supabase/types.ts\`\n\n`;

  Object.entries(tables).forEach(([tableName, tableDefinition]) => {
    markdown += `## ${tableName}\n\n`;

    if (tableDefinition.Row) {
      markdown += `| Field | Type |\n`;
      markdown += `|-------|------|\n`;

      Object.entries(tableDefinition.Row).forEach(([fieldName, fieldType]) => {
        markdown += `| ${fieldName} | \`${fieldType}\` |\n`;
      });
    }

    markdown += `\n`;
  });

  // Ensure docs directory exists
  const docsDir = path.dirname(outputPath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, markdown);
  console.log(`✅ Schema documentation generated at ${outputPath}`);
}

if (require.main === module) {
  extractTableSchemas();
}

module.exports = { extractTableSchemas };
