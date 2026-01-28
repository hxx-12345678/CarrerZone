'use strict';

// Compare two schema dump JSON files and print/write a human-readable diff
// Usage: node scripts/compare-schemas.js <LEFT_JSON> <RIGHT_JSON> <OUT_REPORT_PATH>

const fs = require('fs');

function toMap(arr, key) {
  const m = new Map();
  for (const it of arr) m.set(it[key], it);
  return m;
}

function compare(left, right) {
  const report = [];

  const leftTables = new Set(Object.keys(left.tables));
  const rightTables = new Set(Object.keys(right.tables));

  const onlyLeft = [...leftTables].filter(t => !rightTables.has(t)).sort();
  const onlyRight = [...rightTables].filter(t => !leftTables.has(t)).sort();
  const both = [...leftTables].filter(t => rightTables.has(t)).sort();

  report.push(`Tables: left=${leftTables.size}, right=${rightTables.size}`);
  if (onlyLeft.length) report.push(`Only in left: ${onlyLeft.join(', ')}`);
  if (onlyRight.length) report.push(`Only in right: ${onlyRight.join(', ')}`);

  for (const t of both) {
    const l = left.tables[t];
    const r = right.tables[t];
    const lCols = toMap(l.columns, 'name');
    const rCols = toMap(r.columns, 'name');
    const lColNames = new Set([...lCols.keys()]);
    const rColNames = new Set([...rCols.keys()]);

    const colsOnlyLeft = [...lColNames].filter(c => !rColNames.has(c)).sort();
    const colsOnlyRight = [...rColNames].filter(c => !lColNames.has(c)).sort();

    const commonCols = [...lColNames].filter(c => rColNames.has(c)).sort();
    const colDiffs = [];
    for (const c of commonCols) {
      const lc = lCols.get(c);
      const rc = rCols.get(c);
      const diffs = [];
      if ((lc.dataType || '').toLowerCase() !== (rc.dataType || '').toLowerCase()) diffs.push(`type ${lc.dataType} vs ${rc.dataType}`);
      if (!!lc.nullable !== !!rc.nullable) diffs.push(`nullable ${lc.nullable} vs ${rc.nullable}`);
      const ldef = lc.default == null ? null : String(lc.default);
      const rdef = rc.default == null ? null : String(rc.default);
      if (ldef !== rdef) diffs.push(`default ${ldef} vs ${rdef}`);
      if (diffs.length) colDiffs.push(`    - ${c}: ${diffs.join('; ')}`);
    }

    if (colsOnlyLeft.length || colsOnlyRight.length || colDiffs.length) {
      report.push(`\nTable ${t}:`);
      if (colsOnlyLeft.length) report.push(`  Columns only in left: ${colsOnlyLeft.join(', ')}`);
      if (colsOnlyRight.length) report.push(`  Columns only in right: ${colsOnlyRight.join(', ')}`);
      if (colDiffs.length) report.push(`  Column differences:\n${colDiffs.join('\n')}`);
    }
  }

  return report.join('\n');
}

function main() {
  const leftPath = process.argv[2];
  const rightPath = process.argv[3];
  const outPath = process.argv[4] || 'schema-compare-report.txt';
  if (!leftPath || !rightPath) {
    console.error('Usage: node scripts/compare-schemas.js <LEFT_JSON> <RIGHT_JSON> <OUT_REPORT_PATH>');
    process.exit(1);
  }
  const left = JSON.parse(fs.readFileSync(leftPath, 'utf-8'));
  const right = JSON.parse(fs.readFileSync(rightPath, 'utf-8'));
  const report = compare(left, right);
  fs.writeFileSync(outPath, report, 'utf-8');
  console.log(`✅ Wrote compare report to ${outPath}`);
}

main();


