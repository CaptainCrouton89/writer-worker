# Generation Guide

When a new job arrives, do this:

1. If the job has any unprocessed user prompts, it means the outline has to be generated or regenerated (generated, if it's the prompt has index 0, otherwise regenerated). The generated outline should just be the array of chapters with plotpoints.
2. Once an outline has been created, generate metadata for it: title, description, tags, trigger_warnings, sexually_explicit boolean.
3. Generate an embedding
4. Begin writing the chapter assigned for the job
5. Upon finishing the job, save the chapter content and mark the job finished.

Things to bear in mind:

- If the job fails, it should stay failed.
- If the app crashes/closes out, the process should resume from where it left off.
