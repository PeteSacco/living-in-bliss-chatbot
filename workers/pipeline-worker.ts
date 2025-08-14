// Web Worker for Transformers.js pipeline
import { pipeline, env } from '@xenova/transformers';

// Configure Transformers.js environment
env.allowLocalModels = false;
env.allowRemoteModels = true;

export interface PipelineWorkerMessage {
  type: 'load' | 'run';
  task?: 'feature-extraction';
  model?: string;
  text?: string;
  options?: {
    pooling?: 'mean' | 'cls';
    normalize?: boolean;
  };
}

export interface PipelineWorkerResponse {
  type: 'load_complete' | 'run_complete' | 'error';
  output?: {
    data: Float32Array;
  };
  error?: string;
}

let pipelineInstance: any = null;

self.onmessage = async (event: MessageEvent<PipelineWorkerMessage>) => {
  const { type, task, model, text, options } = event.data;

  try {
    if (type === 'load' && task) {
      // Load the pipeline
      pipelineInstance = await pipeline(task, model);

      self.postMessage({
        type: 'load_complete',
      } as PipelineWorkerResponse);
    } else if (type === 'run') {
      if (!pipelineInstance) {
        throw new Error('Pipeline not loaded');
      }

      // Generate embeddings
      const output = await pipelineInstance(text, {
        pooling: options?.pooling || 'mean',
        normalize: options?.normalize || true,
      });

      self.postMessage({
        type: 'run_complete',
        output: {
          data: output.data,
        },
      } as PipelineWorkerResponse);
    }
  } catch (error: any) {
    self.postMessage({
      type: 'error',
      error: error.message,
    } as PipelineWorkerResponse);
  }
};
