import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from 'docx';

export async function generateDocxBlob(content: string, title: string = 'Iniciativa Legislativa'): Promise<Blob> {
  const lines = content.split('\n');

  const docParagraphs: Paragraph[] = [];

  // Encabezado principal
  docParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: 'HONORABLE CONGRESO DE LA UNIÓN',
          bold: true,
          size: 26, // 13pt
          font: 'Arial',
          color: '1E293B',
        }),
      ],
    })
  );

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      docParagraphs.push(new Paragraph({ spacing: { after: 120 } }));
      continue;
    }

    const isHeader =
      trimmed.startsWith('INICIATIVA CON PROYECTO') ||
      trimmed.startsWith('EXPOSICIÓN DE MOTIVOS') ||
      trimmed.startsWith('PROYECTO DE DECRETO') ||
      trimmed.startsWith('TRANSITORIOS') ||
      trimmed.startsWith('I. ') ||
      trimmed.startsWith('II. ') ||
      trimmed.startsWith('III. ') ||
      trimmed.startsWith('IV. ') ||
      trimmed.startsWith('ARTÍCULO');

    if (isHeader) {
      docParagraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: trimmed,
              bold: true,
              size: 24, // 12pt
              font: 'Arial',
              color: '0F172A',
            }),
          ],
        })
      );
    } else {
      docParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 276, after: 120 }, // 1.15 line spacing
          children: [
            new TextRun({
              text: trimmed,
              size: 22, // 11pt
              font: 'Arial',
              color: '334155',
            }),
          ],
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: docParagraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}