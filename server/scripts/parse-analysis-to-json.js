'use strict';

// Parse production-database-analysis.txt (formatted text) into JSON schema compatible with dump-schema.js
// Usage: node scripts/parse-analysis-to-json.js <INPUT_TXT_PATH> <OUTPUT_JSON_PATH>

const fs = require('fs');

function normalizeTableName(name) {
  return String(name || '').trim().replace(/^TABLE:\s*/i, '').toLowerCase();
}

function parseColumns(lines, startIdx) {
  const columns = [];
  let i = startIdx;
  while (i < lines.length) {
    const line = lines[i];
    if (!line || /Total Rows:|Primary Key\(s\)|Foreign Key\(s\)|Indexes|TABLE:/i.test(line)) break;
    // Heuristic: look for pattern "1. name" in the line
    const m = line.match(/\b\d+\.\s+([^\s|]+)[^A-Za-z]*([A-Z_ ]+)(?:\s*\((\d+)\))?[^A-Za-z]*(NOT NULL|NULL)?[^D]*(?:DEFAULT:\s*([^|]+))?/i);
    if (m) {
      const name = m[1].replace(/"/g, '');
      const type = (m[2] || '').trim().toLowerCase().replace(/\s+/g, '_');
      const length = m[3] ? Number(m[3]) : null;
      const nullable = (m[4] || '').toUpperCase() !== 'NOT NULL';
      const def = m[5] ? m[5].trim() : null;
      columns.push({ name, dataType: type, length, nullable, default: def });
    }
    i += 1;
  }
  return { columns, nextIdx: i };
}

function parseFile(inputPath) {
  const raw = fs.readFileSync(inputPath, 'utf-8');
  const lines = raw.split(/\r?\n/);
  const schema = { source: inputPath, generatedAt: new Date().toISOString(), tables: {} };

  let i = 0;
  let currentTable = null;
  while (i < lines.length) {
    const line = lines[i];
    if (/TABLE:\s*/i.test(line)) {
      currentTable = normalizeTableName(line.split('TABLE:')[1] || line.replace(/.*TABLE:/i, ''));
      if (!currentTable) { i += 1; continue; }
      schema.tables[currentTable] = schema.tables[currentTable] || { columns: [], primaryKeys: [], foreignKeys: [], indexes: [] };
      i += 1;
      continue;
    }

    if (currentTable && /Columns\s*\(/i.test(line)) {
      const { columns, nextIdx } = parseColumns(lines, i + 1);
      schema.tables[currentTable].columns = columns;
      i = nextIdx;
      continue;
    }

    if (currentTable && /Primary Key\(s\)\s*:/i.test(line)) {
      const names = (line.split(':')[1] || '').split(',').map(s => s.trim().replace(/"/g, '')).filter(Boolean);
      schema.tables[currentTable].primaryKeys = names;
      i += 1;
      continue;
    }

    if (currentTable && /Foreign Key\(s\)\s*:/i.test(line)) {
      i += 1;
      while (i < lines.length && /^\s*-\s*/.test(lines[i])) {
        const fkLine = lines[i];
        // Matches patterns like: - column → table.column  (also handle ASCII arrows)
        const m = fkLine.match(/-\s*([A-Za-z0-9_\"]+)\s*(?:→|->|ΓåÆ)\s*([A-Za-z0-9_\"]+)\.([A-Za-z0-9_\"]+)/);
        if (m) {
          const column = m[1].replace(/"/g, '');
          const refTable = m[2].replace(/"/g, '').toLowerCase();
          const refColumn = m[3].replace(/"/g, '');
          schema.tables[currentTable].foreignKeys.push({ column, refTable, refColumn });
        }
        i += 1;
      }
      continue;
    }

    if (currentTable && /Indexes\s*\(/i.test(line)) {
      i += 1;
      while (i < lines.length && /^\s*-\s*/.test(lines[i])) {
        const idxLine = lines[i];
        const m = idxLine.match(/-\s*([A-Za-z0-9_\"\-]+)/);
        if (m) schema.tables[currentTable].indexes.push({ name: m[1].replace(/"/g, ''), def: '' });
        i += 1;
      }
      continue;
    }

    i += 1;
  }

  return schema;
}

function main() {
  const input = process.argv[2] || 'production-database-analysis.txt';
  const output = process.argv[3] || 'prod_parsed_schema.json';
  const json = parseFile(input);
  fs.writeFileSync(output, JSON.stringify(json, null, 2), 'utf-8');
  console.log(`✅ Wrote parsed JSON to ${output}`);
}

main();


