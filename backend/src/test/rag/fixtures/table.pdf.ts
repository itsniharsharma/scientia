/** A minimal, hand-written, valid single-page PDF containing real
 *  vector-drawn rectangles (`re`/`S`/`f` operators) alongside text — as a raw
 *  string, encoded to a Buffer by the test that uses it. This exercises the
 *  REAL pdf-parse library's `getTable()` code path (vector line/rectangle
 *  analysis), not a mock. Plain text-only fixtures (see minimal.pdf.ts) never
 *  reach this code path, which is why they cannot catch the concurrent-call
 *  worker-transfer race documented in ingestion/pdf-parser.ts. */
export const TABLE_PDF_TEXT = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/MediaBox[0 0 300 200]/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length 160>>
stream
BT /F1 12 Tf 20 170 Td (Plan) Tj ET
20 100 100 40 re S
120 100 100 40 re S
0 140 300 1 re f
0 60 300 1 re f
150 60 0 80 re f
BT /F1 10 Tf 30 120 Td (Free) Tj ET
BT /F1 10 Tf 130 120 Td (Pro) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f
trailer<</Size 6/Root 1 0 R>>
startxref
0
%%EOF`;
