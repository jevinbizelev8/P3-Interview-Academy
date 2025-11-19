# Quick Fix: AWS EB Deployment Failure (PDF Parsing)

**Problem**: `npm install` fails on AWS Elastic Beanstalk due to native dependencies in `pdf-parse`

**Root Cause**: `pdf-parse` depends on `@napi-rs/canvas` (Rust native addon) which requires build tools

**Solution**: Replace `pdf-parse` with `pdfjs-dist` (pure JavaScript, zero native deps)

---

## Quick Implementation (15 minutes)

### 1. Update Dependencies

```bash
npm uninstall pdf-parse
npm install pdfjs-dist
```

### 2. Create PDF Parser Helper

**New File**: `server/utils/pdf-parser.ts`

```typescript
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.mjs';

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const textParts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n\n').trim();
}
```

### 3. Update `server/routes/prepare.ts`

**Remove** (lines 7-9):
```typescript
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
```

**Add** (after other imports):
```typescript
import { extractTextFromPDF } from '../utils/pdf-parser.js';
```

**Replace** (lines 597-607):
```typescript
// OLD:
if (req.file.mimetype === 'application/pdf') {
  const pdfData = await pdfParse(req.file.buffer);
  parsedContent = pdfData.text;
  // ...
}

// NEW:
if (req.file.mimetype === 'application/pdf') {
  parsedContent = await extractTextFromPDF(req.file.buffer);

  if (!parsedContent || parsedContent.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'PDF file appears to be empty or could not be parsed',
    });
  }
}
```

### 4. Test & Deploy

```bash
# Test locally
npm run build
npm run dev

# Commit & push (triggers staging deployment)
git add .
git commit -m "fix(deps): Replace pdf-parse with pdfjs-dist for AWS EB compatibility

- Remove pdf-parse (has native Rust dependencies)
- Add pdfjs-dist (pure JavaScript, Mozilla)
- Create extractTextFromPDF() helper function
- Update resume upload route to use new parser
- Fixes npm install failure on AWS Elastic Beanstalk

Resolves deployment issue caused by @napi-rs/canvas native compilation"

git push origin redesign/mvp-founder-design
```

---

## Why This Works

| pdf-parse | pdfjs-dist |
|-----------|------------|
| ❌ Native deps (Rust) | ✅ Pure JavaScript |
| ❌ Needs build tools | ✅ No build tools |
| ❌ Fails on AWS EB | ✅ Works on AWS EB |
| ⚠️ Small community | ✅ Mozilla-backed |

---

## Verification

1. Check GitHub Actions - staging deployment should succeed
2. Test resume upload via staging API
3. Verify text extraction quality
4. Check CloudWatch logs for errors

---

**Estimated Time**: 15 minutes
**Risk Level**: LOW
**Rollback**: Easy (revert commit)
