import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PROMPT_V1_0_0 } from './prompts/v1.0.0';
import type { PageExtractionContract, VisualRef, PassageItem } from './types/extraction-contract';

interface BuiltPrompt {
  systemPrompt: string;
  userPrompt: string;
}

const PROMPT_REGISTRY: Record<string, string> = {
  'v1.0.0': PROMPT_V1_0_0,
};

@Injectable()
export class PromptBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  async build(pdfId: string, pageNumber: number, promptVersion: string): Promise<BuiltPrompt> {
    const template = PROMPT_REGISTRY[promptVersion];
    if (!template) throw new Error(`Unknown prompt version: ${promptVersion}`);

    const [visualManifest, passageManifest] = await Promise.all([
      this.buildVisualManifest(pdfId, pageNumber),
      this.buildPassageManifest(pdfId, pageNumber),
    ]);

    const systemPrompt = template
      .replace('{VISUAL_MANIFEST}', visualManifest)
      .replace('{PASSAGE_MANIFEST}', passageManifest);

    const userPrompt = `Extract all questions from page ${pageNumber}. Return only JSON matching the schema in the system instructions.`;

    return { systemPrompt, userPrompt };
  }

  private async buildVisualManifest(pdfId: string, pageNumber: number): Promise<string> {
    if (pageNumber <= 1) return '(none — this is the first page)';

    // Load last 2 completed prior pages for cross-page visual references
    const priorPages = await this.prisma.rawPageExtraction.findMany({
      where: {
        pdfId,
        pageNumber: { in: [pageNumber - 1, pageNumber - 2].filter((n) => n >= 1) },
        extractionStatus: 'completed',
        normalizedExtraction: { not: null },
      },
      select: { pageNumber: true, normalizedExtraction: true },
      orderBy: { pageNumber: 'asc' },
    });

    if (priorPages.length === 0) return '(no completed prior pages with visuals)';

    const lines: string[] = [];
    for (const row of priorPages) {
      const extraction = row.normalizedExtraction as unknown as PageExtractionContract;
      if (!extraction?.visuals?.length) continue;
      for (const v of extraction.visuals as VisualRef[]) {
        lines.push(`- ${v.id}: [${v.type}] ${v.description} (page ${row.pageNumber}, y=${v.position_y.toFixed(2)})`);
      }
    }

    return lines.length ? lines.join('\n') : '(no visuals found on prior pages)';
  }

  private async buildPassageManifest(pdfId: string, pageNumber: number): Promise<string> {
    if (pageNumber <= 1) return '(none — this is the first page)';

    const priorExtractions = await this.prisma.rawPageExtraction.findMany({
      where: {
        pdfId,
        pageNumber: { lt: pageNumber },
        extractionStatus: 'completed',
        normalizedExtraction: { not: null },
      },
      select: { normalizedExtraction: true },
      orderBy: { pageNumber: 'asc' },
    });

    // Collect passages that have not yet ended
    const openPassages = new Map<string, PassageItem>();

    for (const row of priorExtractions) {
      const extraction = row.normalizedExtraction as unknown as PageExtractionContract;
      for (const p of extraction?.passages ?? []) {
        if (p.is_end) {
          openPassages.delete(p.passage_id);
        } else {
          openPassages.set(p.passage_id, p);
        }
      }
    }

    if (openPassages.size === 0) return '(no open passages from prior pages)';

    const lines = [...openPassages.values()].map(
      (p) => `- ${p.passage_id}: passage is ongoing (started on a prior page, not yet ended)`,
    );
    return lines.join('\n');
  }
}
