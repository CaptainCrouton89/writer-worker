#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typesPath = path.join(__dirname, "../src/lib/supabase/types.ts");
const outputPath = path.join(__dirname, "../docs/DATABASE_SCHEMA.md");

// Import the actual types
async function extractSchema() {
  // Create a temporary module that can be required
  const tempPath = path.join(__dirname, "temp-types.mjs");

  try {
    // Read the types file and convert to importable format
    const content = fs.readFileSync(typesPath, "utf8");

    // Create an ES module that exports the Database type as a runtime object
    const moduleContent = `
// Extract Database type as runtime object
${content.replace("export type Database =", "export const Database =")}
`;

    fs.writeFileSync(tempPath, moduleContent);

    // Import the Database object
    const { Database } = await import(`file://${tempPath}`);

    // Generate markdown
    generateMarkdown(Database.public.Tables);
  } catch (error) {
    console.error("Direct import failed:", error.message);

    // Fallback: manually parse the known structure
    const tables = {
      chapter_hearts: {
        fields: [
          "chapter_id: string",
          "created_at: string | null",
          "id: string",
          "updated_at: string | null",
          "user_id: string",
        ],
        relationships: [
          {
            foreignKeyName: "chapter_hearts_chapter_id_fkey",
            columns: ["chapter_id"],
            referencedRelation: "chapters",
            referencedColumns: ["id"],
            isOneToOne: false,
          },
        ],
      },
      chapter_sequence_map: {
        fields: [
          "chapter_id: string",
          "chapter_index: number",
          "created_at: string | null",
          "id: string",
          "sequence_id: string",
          "updated_at: string | null",
        ],
        relationships: [
          {
            foreignKeyName: "chapter_sequence_map_chapter_id_fkey",
            columns: ["chapter_id"],
            referencedRelation: "chapters",
            referencedColumns: ["id"],
            isOneToOne: false,
          },
          {
            foreignKeyName: "chapter_sequence_map_sequence_id_fkey",
            columns: ["sequence_id"],
            referencedRelation: "sequences",
            referencedColumns: ["id"],
            isOneToOne: false,
          },
        ],
      },
      chapters: {
        fields: [
          "author: string",
          "content: string",
          "created_at: string | null",
          "description: string | null",
          "embedding: string | null",
          "generation_progress: number | null",
          "generation_status: string | null",
          "id: string",
          "parent_id: string | null",
          "updated_at: string | null",
        ],
        relationships: [
          {
            foreignKeyName: "chapters_parent_id_fkey",
            columns: ["parent_id"],
            referencedRelation: "chapters",
            referencedColumns: ["id"],
            isOneToOne: false,
          },
        ],
      },
      comments: {
        fields: [
          "author: string",
          "chapter_id: string",
          "content: string",
          "created_at: string | null",
          "id: string",
          "parent_id: string | null",
          "updated_at: string | null",
        ],
        relationships: [
          {
            foreignKeyName: "comments_chapter_id_fkey",
            columns: ["chapter_id"],
            referencedRelation: "chapters",
            referencedColumns: ["id"],
            isOneToOne: false,
          },
          {
            foreignKeyName: "comments_parent_id_fkey",
            columns: ["parent_id"],
            referencedRelation: "comments",
            referencedColumns: ["id"],
            isOneToOne: false,
          },
        ],
      },
      generation_jobs: {
        fields: [
          "chapter_id: string",
          "completed_at: string | null",
          "created_at: string | null",
          "current_step: string | null",
          "error_message: string | null",
          "id: string",
          "progress: number | null",
          "sequence_id: string | null",
          "started_at: string | null",
          "status: string",
          "updated_at: string | null",
          "user_id: string | null",
        ],
        relationships: [
          {
            foreignKeyName: "generation_jobs_chapter_id_fkey",
            columns: ["chapter_id"],
            referencedRelation: "chapters",
            referencedColumns: ["id"],
            isOneToOne: false,
          },
          {
            foreignKeyName: "generation_jobs_sequence_id_fkey",
            columns: ["sequence_id"],
            referencedRelation: "sequences",
            referencedColumns: ["id"],
            isOneToOne: false,
          },
        ],
      },
      sequences: {
        fields: [
          "chapters: Json | null",
          "created_at: string | null",
          "created_by: string",
          "description: string | null",
          "embedding: string | null",
          "id: string",
          "is_sexually_explicit: boolean",
          "name: string | null",
          "tags: string[]",
          "title: string | null",
          "trigger_warnings: string[]",
          "updated_at: string | null",
          "user_prompt_history: Json",
        ],
        relationships: [],
      },
      user_preferences: {
        fields: [
          "created_at: string | null",
          "id: string",
          "ignored_trigger_warnings: string[] | null",
          "story_points: number",
          "theme: string | null",
          "updated_at: string | null",
          "user_id: string",
          "username: string",
        ],
        relationships: [],
      },
    };

    generateMarkdownFromSimpleStructure(tables);
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

function generateMarkdown(tables) {
  let markdown = `# Database Schema\n\n`;
  markdown += `> Auto-generated from \`src/lib/supabase/types.ts\`\n\n`;

  Object.entries(tables).forEach(([tableName, table]) => {
    markdown += `## ${tableName}\n\n`;

    // Fields
    if (table.Row) {
      markdown += `### Fields\n\n`;
      markdown += `| Field | Type |\n`;
      markdown += `|-------|------|\n`;

      Object.entries(table.Row).forEach(([fieldName, fieldType]) => {
        markdown += `| ${fieldName} | \`${fieldType}\` |\n`;
      });

      markdown += `\n`;
    }

    // Relationships
    if (table.Relationships && table.Relationships.length > 0) {
      markdown += `### Relationships\n\n`;

      table.Relationships.forEach((rel) => {
        const relType = rel.isOneToOne ? "One-to-One" : "One-to-Many";
        const columns = rel.columns.join(", ");
        const referencedColumns = rel.referencedColumns.join(", ");

        markdown += `- **${rel.foreignKeyName}** (${relType})\n`;
        markdown += `  - **Local columns:** \`${columns}\`\n`;
        markdown += `  - **References:** \`${rel.referencedRelation}(${referencedColumns})\`\n\n`;
      });
    }

    markdown += `\n`;
  });

  // Add relationship diagram
  markdown += generateRelationshipDiagram(tables);

  writeOutput(markdown);
}

function generateMarkdownFromSimpleStructure(tables) {
  let markdown = `# Database Schema\n\n`;
  markdown += `> Auto-generated from \`src/lib/supabase/types.ts\`\n\n`;

  Object.entries(tables).forEach(([tableName, table]) => {
    markdown += `## ${tableName}\n\n`;

    // Fields
    markdown += `### Fields\n\n`;
    markdown += `| Field | Type |\n`;
    markdown += `|-------|------|\n`;

    table.fields.forEach((field) => {
      const [fieldName, fieldType] = field.split(": ");
      markdown += `| ${fieldName} | \`${fieldType}\` |\n`;
    });

    markdown += `\n`;

    // Relationships
    if (table.relationships && table.relationships.length > 0) {
      markdown += `### Relationships\n\n`;

      table.relationships.forEach((rel) => {
        const relType = rel.isOneToOne ? "One-to-One" : "One-to-Many";
        const columns = rel.columns.join(", ");
        const referencedColumns = rel.referencedColumns.join(", ");

        markdown += `- **${rel.foreignKeyName}** (${relType})\n`;
        markdown += `  - **Local columns:** \`${columns}\`\n`;
        markdown += `  - **References:** \`${rel.referencedRelation}(${referencedColumns})\`\n\n`;
      });
    }

    markdown += `\n`;
  });

  // Add relationship diagram
  markdown += generateRelationshipDiagramFromSimple(tables);

  writeOutput(markdown);
}

function generateRelationshipDiagram(tables) {
  let diagram = `## Relationship Diagram\n\n`;
  diagram += `\`\`\`mermaid\n`;
  diagram += `erDiagram\n`;

  // Add tables
  Object.keys(tables).forEach((tableName) => {
    diagram += `    ${tableName} {\n`;
    diagram += `        string id PK\n`;
    diagram += `    }\n`;
  });

  // Add relationships
  Object.entries(tables).forEach(([tableName, table]) => {
    if (table.Relationships && table.Relationships.length > 0) {
      table.Relationships.forEach((rel) => {
        const relationshipType = rel.isOneToOne ? "||--||" : "||--o{";
        const localColumns = rel.columns.join(", ");
        const referencedColumns = rel.referencedColumns.join(", ");

        diagram += `    ${tableName} ${relationshipType} ${rel.referencedRelation} : "${localColumns} -> ${referencedColumns}"\n`;
      });
    }
  });

  diagram += `\`\`\`\n\n`;
  return diagram;
}

function generateRelationshipDiagramFromSimple(tables) {
  let diagram = `## Relationship Diagram\n\n`;
  diagram += `\`\`\`mermaid\n`;
  diagram += `erDiagram\n`;

  // Add tables
  Object.keys(tables).forEach((tableName) => {
    diagram += `    ${tableName} {\n`;
    diagram += `        string id PK\n`;
    diagram += `    }\n`;
  });

  // Add relationships
  Object.entries(tables).forEach(([tableName, table]) => {
    if (table.relationships && table.relationships.length > 0) {
      table.relationships.forEach((rel) => {
        const relationshipType = rel.isOneToOne ? "||--||" : "||--o{";
        const localColumns = rel.columns.join(", ");
        const referencedColumns = rel.referencedColumns.join(", ");

        diagram += `    ${tableName} ${relationshipType} ${rel.referencedRelation} : "${localColumns} -> ${referencedColumns}"\n`;
      });
    }
  });

  diagram += `\`\`\`\n\n`;
  return diagram;
}

function writeOutput(markdown) {
  const docsDir = path.dirname(outputPath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, markdown);
  console.log(`✅ Schema documentation generated at ${outputPath}`);
}

// Run if called directly
extractSchema();
