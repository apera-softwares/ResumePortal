import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ParsedResumeResult {
  name?: string | null;
  email?: string | null;
  contact?: string | null;
  skills?: string[];
  rawTextLength?: number;
}

/**
 * Multiple text representations of the same resume file.
 * Each source uses a different extraction method so the AI can
 * cross-reference them and pick the most accurate value per field.
 */
export interface ResumeTextSources {
  /** HTML text from pdftohtml — good layout/structure, can mangle emails */
  htmlText?: string;
  /** Plain text from pdf-parse — most reliable for emails & phone numbers */
  plainText?: string;
  /** Plain text from pdftotext CLI — fallback when pdf-parse fails */
  pdfTextFallback?: string;
  /** HTML from mammoth (DOCX/DOC files) */
  docxHtml?: string;
}

@Injectable()
export class DeepSeekService {
  private readonly logger = new Logger(DeepSeekService.name);

  constructor(private readonly config: ConfigService) { }

  async apiCall(aiInput: Array<{ role: string; content: string }>) {
    let token = process.env.DEEPSEEK_API_KEY;

    if (!token) {
      this.logger.warn('No DeepSeek API key configured.');
    }

    try {
      const response = await fetch(
        'https://api.deepseek.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            temperature: 0.1,
            messages: aiInput,
            response_format: { type: 'json_object' },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API HTTP Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      this.logger.log('DeepSeek API response received successfully');
      return result;
    } catch (error: any) {
      this.logger.error(`DeepSeek API call error: ${error?.message || error}`);
      return { error: { message: error?.message || String(error) } };
    }
  }

  /**
   * Parses resume data from multiple text extraction sources.
   *
   * By sending all available representations of the same PDF to DeepSeek,
   * the model can cross-reference them and pick the most accurate value per
   * field. In particular, plain text sources (pdf-parse / pdftotext) are
   * significantly more reliable for emails and phone numbers than HTML
   * output from pdftohtml, which can corrupt special characters.
   */
  async parseResumeSources(sources: ResumeTextSources): Promise<ParsedResumeResult> {
    const systemPrompt = `You are a professional ATS resume extraction system.
You will receive the same resume extracted using different methods:
  - SOURCE_PLAIN: direct PDF text stream (most reliable for emails and phone numbers)
  - SOURCE_PLAIN_FALLBACK: secondary CLI text extraction
  - SOURCE_HTML: HTML-converted PDF or DOCX (best for layout and skill detection, but may corrupt emails)

Rules:
1. For "email" and "contact", ALWAYS prefer SOURCE_PLAIN > SOURCE_PLAIN_FALLBACK > SOURCE_HTML.
   Validate that the email contains exactly one "@" and a valid domain before using it.
2. For "name" and "skills", prefer whichever source gives the most complete information.
3. If a field is missing from all sources, return null for that field.

You MUST return ONLY a valid JSON object matching this schema:
{
  "name": "Candidate Full Name or null",
  "email": "Candidate Email or null",
  "contact": "Candidate Phone/Mobile number or null",
  "skills": ["Skill 1", "Skill 2", "Skill 3"]
}
Do not include markdown code block ticks in the response, just standard JSON.`;

    // Build the user message with labelled source blocks
    const parts: string[] = [];

    const addSource = (label: string, text: string | undefined) => {
      if (!text) return;
      // Strip HTML tags, normalise whitespace, cap at 6 000 chars per source
      const clean = text
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&#160;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 6000);
      if (clean) parts.push(`=== ${label} ===\n${clean}`);
    };

    addSource('SOURCE_PLAIN', sources.plainText);
    addSource('SOURCE_PLAIN_FALLBACK', sources.pdfTextFallback);
    addSource('SOURCE_HTML', sources.htmlText ?? sources.docxHtml);

    if (parts.length === 0) {
      this.logger.warn('parseResumeSources: all sources are empty.');
      return { name: null, email: null, contact: null, skills: [], rawTextLength: 0 };
    }

    const userMessage = `Extract candidate details from the following resume sources:\n\n${parts.join('\n\n')}`;

    const totalLength =
      (sources.plainText?.length ?? 0) +
      (sources.pdfTextFallback?.length ?? 0) +
      (sources.htmlText?.length ?? 0) +
      (sources.docxHtml?.length ?? 0);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    const apiResult = await this.apiCall(messages);

    if (apiResult.error || !apiResult.choices || !apiResult.choices[0]?.message?.content) {
      this.logger.error('Failed to parse resume sources using DeepSeek AI', apiResult.error);
      return {
        name: null,
        email: null,
        contact: null,
        skills: [],
        rawTextLength: totalLength,
      };
    }

    try {
      const rawContent = apiResult.choices[0].message.content.trim();
      const parsedJSON = JSON.parse(rawContent);

      return {
        name: parsedJSON.name || null,
        email: parsedJSON.email || null,
        contact: parsedJSON.contact || parsedJSON.phone || null,
        skills: Array.isArray(parsedJSON.skills) ? parsedJSON.skills : [],
        rawTextLength: totalLength,
      };
    } catch (parseError) {
      this.logger.error('Failed to parse JSON response from DeepSeek', parseError);
      return {
        name: null,
        email: null,
        contact: null,
        skills: [],
        rawTextLength: totalLength,
      };
    }
  }
}
