import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ParsedResumeResult {
  name?: string | null;
  email?: string | null;
  contact?: string | null;
  skills?: string[];
  rawTextLength?: number;
}

@Injectable()
export class DeepSeekService {
  private readonly logger = new Logger(DeepSeekService.name);

  constructor(private readonly config: ConfigService) { }

  async apiCall(aiInput: Array<{ role: string; content: string }>) {
    let token = process.env.DEEPSEEK_API_KEY;

    if (!token) {
      this.logger.warn('No DeepSeek token found in configuration.');
    } else {
      const tokenPreview =
        token.length > 9
          ? `${token.substring(0, 5)}...${token.slice(-4)}`
          : '***';
      this.logger.log(`Using token: ${tokenPreview} for API call to DeepSeek`);
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
      //http://209.182.232.11:8978/#/
      const result = await response.json();
      this.logger.log('DeepSeek API response received successfully');
      return result;
    } catch (error: any) {
      this.logger.error(`DeepSeek API call error: ${error?.message || error}`);
      return { error: { message: error?.message || String(error) } };
    }
  }

  async parseResumeText(resumeText: string): Promise<ParsedResumeResult> {
    const systemPrompt = `You are a professional ATS resume extraction system.
Extract candidate details from the provided resume text.
You MUST return ONLY a valid JSON object matching this schema:
{
  "name": "Candidate Full Name or null",
  "email": "Candidate Email or null",
  "contact": "Candidate Phone/Mobile number or null",
  "skills": ["Skill 1", "Skill 2", "Skill 3"]
}
Do not include markdown code block ticks (\`\`\`) in the response if possible, just standard JSON.`;

    const cleanText = resumeText
      .replace(/<[^>]*>?/gm, ' ') // Strip HTML tags if pdftohtml returned HTML
      .replace(/\s+/g, ' ')
      .trim();

    const truncatedText = cleanText.substring(0, 10000); // 10k max chars prompt limit

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Extract candidate details from this resume text:\n\n${truncatedText}` },
    ];

    const apiResult = await this.apiCall(messages);

    if (apiResult.error || !apiResult.choices || !apiResult.choices[0]?.message?.content) {
      this.logger.error('Failed to parse resume text using DeepSeek AI', apiResult.error);
      return {
        name: null,
        email: null,
        contact: null,
        skills: [],
        rawTextLength: resumeText.length,
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
        rawTextLength: resumeText.length,
      };
    } catch (parseError) {
      this.logger.error('Failed to parse JSON response from DeepSeek', parseError);
      return {
        name: null,
        email: null,
        contact: null,
        skills: [],
        rawTextLength: resumeText.length,
      };
    }
  }
}
