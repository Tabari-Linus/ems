/// <reference types="node" />
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { THEME_ATTRIBUTE, THEME_STORAGE_KEY } from '@ems/ui/theme';

/**
 * The inline no-flash theme script in index.html is allowed by the production CSP through its
 * SHA-256 hash (docker/40-ems-runtime-config.sh). Any edit to the script, including whitespace or
 * line endings, changes the hash; this test makes that drift fail CI instead of silently blocking
 * the script in production.
 */
describe('theme no-flash script and CSP', () => {
  const root = process.cwd();
  const indexHtml = readFileSync(join(root, 'src', 'index.html'), 'utf8');
  const cspScript = readFileSync(join(root, 'docker', '40-ems-runtime-config.sh'), 'utf8');
  const inlineScripts = [...indexHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);

  it('index.html has exactly one inline script, the theme snippet', () => {
    expect(inlineScripts).toHaveLength(1);
    expect(inlineScripts[0]).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`);
    expect(inlineScripts[0]).toContain(`setAttribute('${THEME_ATTRIBUTE}', t)`);
  });

  it('the CSP script-src allows that exact script by hash', () => {
    const hash = createHash('sha256').update(inlineScripts[0], 'utf8').digest('base64');
    expect(cspScript).toContain(`'sha256-${hash}'`);
    expect(cspScript).toMatch(/script-src 'self' \$\{THEME_SCRIPT_HASH\};/);
  });

  it('the CSP no longer allows third-party font or style hosts', () => {
    expect(cspScript).not.toContain('fonts.googleapis.com');
    expect(cspScript).not.toContain('fonts.gstatic.com');
    expect(cspScript).toContain("font-src 'self';");
    expect(indexHtml).not.toContain('fonts.googleapis.com');
  });

  it('the snippet applies a stored theme before the app starts', () => {
    document.documentElement.removeAttribute(THEME_ATTRIBUTE);
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    try {
      new Function(inlineScripts[0])();
      expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('dark');
    } finally {
      localStorage.removeItem(THEME_STORAGE_KEY);
      document.documentElement.removeAttribute(THEME_ATTRIBUTE);
    }
  });
});
