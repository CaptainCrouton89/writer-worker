/**
 * Webhook service for notifying the main application when generation jobs complete
 */

interface WebhookPayload {
  jobId: string;
  sequenceId: string;
  chapterId: string;
  isFirstChapter: boolean;
}

interface WebhookConfig {
  url: string;
  apiKey: string;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class WebhookService {
  private readonly config: WebhookConfig;

  constructor() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const apiKey = process.env.STORY_GENERATION_API_KEY;

    if (!siteUrl) {
      throw new Error("NEXT_PUBLIC_SITE_URL environment variable is not set");
    }

    if (!apiKey) {
      throw new Error("STORY_GENERATION_API_KEY environment variable is not set");
    }

    this.config = {
      url: `${siteUrl}/api/generation-complete`,
      apiKey,
      maxRetries: 3,
      retryDelayMs: 1000,
    };
  }

  /**
   * Notify the main application that a generation job has completed
   * This is non-blocking - failures are logged but don't affect job completion
   */
  async notifyJobCompletion(payload: WebhookPayload): Promise<void> {
    console.log(
      `🔔 Sending webhook notification for job ${payload.jobId}`,
      {
        sequenceId: payload.sequenceId,
        chapterId: payload.chapterId,
        isFirstChapter: payload.isFirstChapter,
      }
    );

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
      try {
        const response = await fetch(this.config.url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(
            `Webhook failed with status ${response.status}: ${response.statusText}`
          );
        }

        console.log(
          `✅ Successfully sent webhook notification for job ${payload.jobId}`
        );
        return;
      } catch (error) {
        lastError = error as Error;
        console.error(
          `⚠️ Webhook attempt ${attempt}/${this.config.maxRetries} failed:`,
          error
        );

        if (attempt < this.config.maxRetries!) {
          const delay = this.config.retryDelayMs! * Math.pow(2, attempt - 1);
          console.log(`⏳ Retrying webhook in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Log final failure but don't throw - this is non-blocking
    console.error(
      `❌ Failed to send webhook after ${this.config.maxRetries} attempts for job ${payload.jobId}:`,
      lastError
    );
  }

}