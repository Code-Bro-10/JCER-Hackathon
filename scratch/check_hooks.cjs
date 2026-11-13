const fs = require('fs');
const path = require('path');

function scan(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '.git') scan(full);
    } else if (f.endsWith('.jsx') || f.endsWith('.js')) {
      const code = fs.readFileSync(full, 'utf8');
      const hooks = ['useEffect', 'useState', 'useMemo', 'useCallback', 'useRef', 'useContext'];
      for (const h of hooks) {
        const bareHookRegex = new RegExp('(?<![.\\w])' + h + '\\s*\\(');
        if (bareHookRegex.test(code)) {
          const reactImport = code.match(/import\s+[^;]+from\s+['"]react['"]/);
          if (!reactImport || !reactImport[0].includes(h)) {
            console.log(`MISSING HOOK IMPORT: ${h} in ${full}`);
          }
        }
      }
    }
  }
}

scan('src');
console.log('Hook scan complete.');

