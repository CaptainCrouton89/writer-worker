import express, { Request, Response, NextFunction } from "express";
import { supabase } from "./lib/supabase.js";
import { UserPrompt, Chapter, Sequence, GenerationJob } from "./lib/types.js";
import { generateNewOutline } from "./generation/outline/newOutline.js";
import { generatePlotPoint } from "./generation/plot/plotPoint.js";
import { generateChapter } from "./generation/plot/chapter.js";
import { generateWritingQuirks } from "./generation/quirks/writingQuirks.js";
import { generateSequenceMetadata } from "./generation/metadata/metadata.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Basic authentication middleware
const basicAuth = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  
  if (!auth || !auth.startsWith('Basic ')) {
    res.status(401).set('WWW-Authenticate', 'Basic realm="Test Interface"').json({
      error: 'Authentication required'
    });
    return;
  }

  const credentials = Buffer.from(auth.slice(6), 'base64').toString();
  const [username, password] = credentials.split(':');

  if (username !== 'admin' || password !== 'ILikeSmut') {
    res.status(401).json({
      error: 'Invalid credentials'
    });
    return;
  }

  next();
};

// Apply authentication to all routes
router.use(basicAuth);

// Serve the test interface HTML
router.get('/ui', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'test-interface.html'));
});

// Serve the JavaScript file for the test interface
router.get('/js/interface.js', (req: Request, res: Response) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'interface.js'));
});

// Serve HTML interface at GET /
router.get('/', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Interface</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .method { font-weight: bold; color: #007acc; }
            .link { margin: 20px 0; padding: 15px; background: #007acc; color: white; display: inline-block; text-decoration: none; border-radius: 5px; }
        </style>
    </head>
    <body>
        <h1>Smut Writer Worker Test Interface</h1>
        <a href="/test/ui" class="link">🎨 Open Interactive Test UI</a>
        <h2>API Endpoints</h2>
        <div class="endpoint">
            <span class="method">POST</span> /api/generate-outline
            <p>Generate story outline from user prompt</p>
        </div>
        <div class="endpoint">
            <span class="method">POST</span> /api/generate-quirks
            <p>Generate writing quirks</p>
        </div>
        <div class="endpoint">
            <span class="method">POST</span> /api/generate-metadata
            <p>Generate full metadata from outline</p>
        </div>
        <div class="endpoint">
            <span class="method">POST</span> /api/generate-title-description
            <p>Generate title and description only</p>
        </div>
        <div class="endpoint">
            <span class="method">POST</span> /api/generate-tags
            <p>Generate tags only</p>
        </div>
        <div class="endpoint">
            <span class="method">POST</span> /api/generate-trigger-warnings
            <p>Generate trigger warnings only</p>
        </div>
        <div class="endpoint">
            <span class="method">POST</span> /api/generate-target-audience
            <p>Generate target audience only</p>
        </div>
        <div class="endpoint">
            <span class="method">GET</span> /api/sequences
            <p>List available sequences from database</p>
        </div>
        <div class="endpoint">
            <span class="method">POST</span> /api/generate-plot-point
            <p>Generate single plot point for a sequence</p>
        </div>
        <div class="endpoint">
            <span class="method">POST</span> /api/generate-chapter
            <p>Generate entire chapter for a sequence</p>
        </div>
    </body>
    </html>
  `);
});

// POST /api/generate-outline - Accept UserPrompt parameters and generate outline
router.post('/api/generate-outline', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      tags,
      spice_level,
      story_length,
      style,
      writingQuirk
    } = req.body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({
        error: 'Invalid or missing prompt'
      });
      return;
    }

    if (!Array.isArray(tags)) {
      res.status(400).json({
        error: 'Invalid or missing tags array'
      });
      return;
    }

    if (spice_level == null || ![0, 1, 2].includes(spice_level)) {
      res.status(400).json({
        error: 'Invalid spice_level. Must be 0, 1, or 2'
      });
      return;
    }

    if (story_length == null || ![0, 1, 2].includes(story_length)) {
      res.status(400).json({
        error: 'Invalid story_length. Must be 0, 1, or 2'
      });
      return;
    }

    if (style == null || ![0, 1, 2, 3, 4].includes(style)) {
      res.status(400).json({
        error: 'Invalid style. Must be 0, 1, 2, 3, or 4'
      });
      return;
    }

    const outline = await generateNewOutline({
      user_prompt: prompt,
      story_length,
      user_tags: tags,
      spice_level,
      author_style: style,
      writingQuirk
    });

    res.json({
      success: true,
      outline
    });
  } catch (error) {
    console.error('Error generating outline:', error);
    res.status(500).json({
      error: 'Failed to generate outline',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/sequences - List available sequences from database
router.get('/api/sequences', async (req: Request, res: Response) => {
  try {
    const { data: sequences, error } = await supabase
      .from('sequences')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      sequences: sequences || []
    });
  } catch (error) {
    console.error('Error fetching sequences:', error);
    res.status(500).json({
      error: 'Failed to fetch sequences',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/generate-plot-point - Generate single plot point for a sequence
router.post('/api/generate-plot-point', async (req: Request, res: Response) => {
  try {
    const {
      sequenceId,
      chapterIndex,
      plotPointIndex,
      previousContent
    } = req.body;

    if (!sequenceId) {
      res.status(400).json({
        error: 'Missing sequenceId'
      });
      return;
    }

    if (chapterIndex == null || typeof chapterIndex !== 'number') {
      res.status(400).json({
        error: 'Invalid or missing chapterIndex'
      });
      return;
    }

    if (plotPointIndex == null || typeof plotPointIndex !== 'number') {
      res.status(400).json({
        error: 'Invalid or missing plotPointIndex'
      });
      return;
    }

    // Fetch sequence from database
    const { data: sequence, error: fetchError } = await supabase
      .from('sequences')
      .select('*')
      .eq('id', sequenceId)
      .single();

    if (fetchError || !sequence) {
      res.status(404).json({
        error: 'Sequence not found',
        message: fetchError?.message
      });
      return;
    }

    const typedSequence = sequence as Sequence;
    const userPrompt = typedSequence.user_prompt_history[0];
    const chapters = typedSequence.chapters;

    if (!userPrompt) {
      res.status(400).json({
        error: 'No user prompt found in sequence'
      });
      return;
    }

    if (!chapters || chapters.length === 0) {
      res.status(400).json({
        error: 'No chapters found in sequence'
      });
      return;
    }

    if (chapterIndex >= chapters.length) {
      res.status(400).json({
        error: `Chapter index ${chapterIndex} out of bounds. Sequence has ${chapters.length} chapters.`
      });
      return;
    }

    const chapter = chapters[chapterIndex];
    if (plotPointIndex >= chapter.plotPoints.length) {
      res.status(400).json({
        error: `Plot point index ${plotPointIndex} out of bounds. Chapter has ${chapter.plotPoints.length} plot points.`
      });
      return;
    }

    if (typeof previousContent !== 'string' && previousContent !== undefined) {
      res.status(400).json({
        error: 'previousContent must be a string if provided'
      });
      return;
    }

    const actualPreviousContent = previousContent !== undefined ? previousContent : '';

    const plotPointContent = await generatePlotPoint(
      userPrompt,
      chapters,
      chapterIndex,
      plotPointIndex,
      actualPreviousContent,
      ''
    );

    res.json({
      success: true,
      plotPointContent,
      plotPoint: chapter.plotPoints[plotPointIndex]
    });
  } catch (error) {
    console.error('Error generating plot point:', error);
    res.status(500).json({
      error: 'Failed to generate plot point',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/generate-quirks - Generate writing quirks
router.post('/api/generate-quirks', async (req: Request, res: Response) => {
  try {
    const { author_style, spice_level, story_description } = req.body;

    if (author_style == null || ![0, 1, 2, 3, 4].includes(author_style)) {
      res.status(400).json({
        error: 'Invalid author_style. Must be 0, 1, 2, 3, or 4'
      });
      return;
    }

    if (spice_level == null || ![0, 1, 2].includes(spice_level)) {
      res.status(400).json({
        error: 'Invalid spice_level. Must be 0, 1, or 2'
      });
      return;
    }

    if (!story_description || typeof story_description !== 'string') {
      res.status(400).json({
        error: 'story_description is required and must be a string'
      });
      return;
    }

    const quirks = await generateWritingQuirks(
      author_style, 
      spice_level, 
      story_description
    );

    res.json({
      success: true,
      quirks: quirks.quirks
    });
  } catch (error) {
    console.error('Error generating quirks:', error);
    res.status(500).json({
      error: 'Failed to generate quirks',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/generate-metadata - Generate full metadata from outline
router.post('/api/generate-metadata', async (req: Request, res: Response) => {
  try {
    const { outline, story_length } = req.body;

    if (!outline || typeof outline !== 'string') {
      res.status(400).json({
        error: 'Invalid or missing outline'
      });
      return;
    }

    const storyLength = story_length != null ? story_length : 0;
    if (![0, 1, 2].includes(storyLength)) {
      res.status(400).json({
        error: 'Invalid story_length. Must be 0, 1, or 2'
      });
      return;
    }

    const metadata = await generateSequenceMetadata(outline, storyLength);

    res.json({
      success: true,
      metadata
    });
  } catch (error) {
    console.error('Error generating metadata:', error);
    res.status(500).json({
      error: 'Failed to generate metadata',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/generate-title-description - Generate title and description only
router.post('/api/generate-title-description', async (req: Request, res: Response) => {
  try {
    const { outline, story_length } = req.body;

    if (!outline || typeof outline !== 'string') {
      res.status(400).json({
        error: 'Invalid or missing outline'
      });
      return;
    }

    const storyLength = story_length != null ? story_length : 0;
    
    // Generate full metadata but only return title and description
    const metadata = await generateSequenceMetadata(outline, storyLength);

    res.json({
      success: true,
      data: {
        title: metadata.title,
        description: metadata.description
      }
    });
  } catch (error) {
    console.error('Error generating title/description:', error);
    res.status(500).json({
      error: 'Failed to generate title and description',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/generate-tags - Generate tags only
router.post('/api/generate-tags', async (req: Request, res: Response) => {
  try {
    const { outline } = req.body;

    if (!outline || typeof outline !== 'string') {
      res.status(400).json({
        error: 'Invalid or missing outline'
      });
      return;
    }

    // Generate full metadata but only return tags
    const metadata = await generateSequenceMetadata(outline, 0);

    res.json({
      success: true,
      data: {
        tags: metadata.tags
      }
    });
  } catch (error) {
    console.error('Error generating tags:', error);
    res.status(500).json({
      error: 'Failed to generate tags',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/generate-trigger-warnings - Generate trigger warnings only
router.post('/api/generate-trigger-warnings', async (req: Request, res: Response) => {
  try {
    const { outline } = req.body;

    if (!outline || typeof outline !== 'string') {
      res.status(400).json({
        error: 'Invalid or missing outline'
      });
      return;
    }

    // Generate full metadata but only return trigger warnings
    const metadata = await generateSequenceMetadata(outline, 0);

    res.json({
      success: true,
      data: {
        trigger_warnings: metadata.trigger_warnings
      }
    });
  } catch (error) {
    console.error('Error generating trigger warnings:', error);
    res.status(500).json({
      error: 'Failed to generate trigger warnings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/generate-target-audience - Generate target audience only
router.post('/api/generate-target-audience', async (req: Request, res: Response) => {
  try {
    const { outline } = req.body;

    if (!outline || typeof outline !== 'string') {
      res.status(400).json({
        error: 'Invalid or missing outline'
      });
      return;
    }

    // Generate full metadata but only return target audience
    const metadata = await generateSequenceMetadata(outline, 0);

    res.json({
      success: true,
      data: {
        target_audience: metadata.target_audience,
        is_sexually_explicit: metadata.is_sexually_explicit
      }
    });
  } catch (error) {
    console.error('Error generating target audience:', error);
    res.status(500).json({
      error: 'Failed to generate target audience',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/generate-chapter - Generate entire chapter for a sequence
router.post('/api/generate-chapter', async (req: Request, res: Response) => {
  try {
    const {
      sequenceId,
      chapterIndex,
      previousChapterContent
    } = req.body;

    if (!sequenceId) {
      res.status(400).json({
        error: 'Missing sequenceId'
      });
      return;
    }

    if (chapterIndex == null || typeof chapterIndex !== 'number') {
      res.status(400).json({
        error: 'Invalid or missing chapterIndex'
      });
      return;
    }

    // Fetch sequence from database
    const { data: sequence, error: fetchError } = await supabase
      .from('sequences')
      .select('*')
      .eq('id', sequenceId)
      .single();

    if (fetchError || !sequence) {
      res.status(404).json({
        error: 'Sequence not found',
        message: fetchError?.message
      });
      return;
    }

    const typedSequence = sequence as Sequence;
    const userPrompt = typedSequence.user_prompt_history[0];
    const chapters = typedSequence.chapters;

    if (!userPrompt) {
      res.status(400).json({
        error: 'No user prompt found in sequence'
      });
      return;
    }

    if (!chapters || chapters.length === 0) {
      res.status(400).json({
        error: 'No chapters found in sequence'
      });
      return;
    }

    if (chapterIndex >= chapters.length) {
      res.status(400).json({
        error: `Chapter index ${chapterIndex} out of bounds. Sequence has ${chapters.length} chapters.`
      });
      return;
    }

    // Create a mock job object for the generateChapter function
    const mockJob: GenerationJob = {
      id: 'test-job',
      chapter_id: 'test-chapter',
      status: 'processing',
      completed_at: null,
      created_at: new Date().toISOString(),
      current_step: null,
      error_message: null,
      job_type: 'chapter_generation',
      model_id: null,
      progress: null,
      quote_id: null,
      sequence_id: sequenceId,
      started_at: null,
      updated_at: null,
      user_id: null
    };

    if (typeof previousChapterContent !== 'string') {
      res.status(400).json({
        error: 'previousChapterContent must be a string'
      });
      return;
    }

    const chapterContent = await generateChapter(
      mockJob,
      chapterIndex,
      userPrompt,
      chapters,
      previousChapterContent
    );

    res.json({
      success: true,
      chapterContent,
      chapterName: chapters[chapterIndex].name,
      plotPoints: chapters[chapterIndex].plotPoints
    });
  } catch (error) {
    console.error('Error generating chapter:', error);
    res.status(500).json({
      error: 'Failed to generate chapter',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;