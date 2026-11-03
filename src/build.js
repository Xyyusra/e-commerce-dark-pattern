// Builds dark.html and neutral.html from storefront.template.html.
//
// Template syntax:
//   Block markers, each alone on its own line (HTML, CSS or JS comment form):
//     <!--IF DARK-->  <!--IF NEUTRAL-->  <!--ELSE-->  <!--END-->
//     /*IF DARK*/     /*IF NEUTRAL*/     /*ELSE*/     /*END*/
//   Inline variants on a single line:
//     {{D:text shown only in dark}}{{N:text shown only in neutral}}
//
// Usage: node build.js   (writes ../dark.html and ../neutral.html)

const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'storefront.template.html'), 'utf8');
const MARKER = /^\s*(?:<!--|\/\*)\s*(IF DARK|IF NEUTRAL|ELSE|END)\s*(?:-->|\*\/)\s*$/;

function build(variant) {
  const out = [];
  const stack = [];
  src.split(/\r?\n/).forEach((line, i) => {
    const m = line.match(MARKER);
    if (m) {
      const tok = m[1];
      if (tok.startsWith('IF')) {
        stack.push(tok === 'IF ' + variant.toUpperCase());
      } else if (tok === 'ELSE') {
        if (!stack.length) throw new Error(`ELSE without IF at line ${i + 1}`);
        stack[stack.length - 1] = !stack[stack.length - 1];
      } else {
        if (!stack.length) throw new Error(`END without IF at line ${i + 1}`);
        stack.pop();
      }
      return;
    }
    if (stack.every(Boolean)) {
      out.push(line
        .replace(/\{\{D:(.*?)\}\}/g, variant === 'dark' ? '$1' : '')
        .replace(/\{\{N:(.*?)\}\}/g, variant === 'neutral' ? '$1' : ''));
    }
  });
  if (stack.length) throw new Error('Unclosed IF block');
  const html = out.join('\n');
  if (/\{\{[DN]:|IF DARK|IF NEUTRAL/.test(html)) throw new Error('Unprocessed marker left in ' + variant);
  fs.writeFileSync(path.join(__dirname, '..', variant + '.html'), html, 'utf8');
  console.log('wrote', variant + '.html', html.split('\n').length, 'lines');
}

build('dark');
build('neutral');
