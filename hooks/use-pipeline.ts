import { useEffect, useRef, useState } from 'react';
import type {
  PipelineWorkerMessage,
  PipelineWorkerResponse,
} from '../workers/pipeline-worker';

export interface PipelineOptions {
  pooling?: 'mean' | 'cls';
  normalize?: boolean;
}

export interface PipelineOutput {
  data: Float32Array;
}

export type PipelineTask = 'feature-extraction';

export function usePipeline(task: PipelineTask, model: string) {
  const [isReady, setIsReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    // Create the Web Worker with proper Next.js handling
    const worker = new Worker(
      new URL('../workers/pipeline-worker.ts', import.meta.url),
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<PipelineWorkerResponse>) => {
      const { type, error } = event.data;

      if (type === 'load_complete') {
        setIsReady(true);
      } else if (type === 'error') {
        console.error('Pipeline worker error:', error);
        setIsReady(false);
      }
    };

    worker.onerror = (error) => {
      console.error('Worker error:', error);
      setIsReady(false);
    };

    // Initialize the pipeline
    worker.postMessage({
      type: 'load',
      task,
      model,
    } as PipelineWorkerMessage);

    return () => {
      worker.terminate();
      workerRef.current = null;
      setIsReady(false);
      loadingRef.current = false;
    };
  }, [task, model]);

  const generateEmbedding = async (
    text: string,
    options: PipelineOptions = {},
  ): Promise<PipelineOutput> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isReady) {
        reject(new Error('Pipeline not ready'));
        return;
      }

      const worker = workerRef.current;

      const handleMessage = (event: MessageEvent<PipelineWorkerResponse>) => {
        const { type, output, error } = event.data;

        if (type === 'run_complete' && output) {
          worker.removeEventListener('message', handleMessage);
          resolve(output);
        } else if (type === 'error') {
          worker.removeEventListener('message', handleMessage);
          reject(new Error(error || 'Pipeline execution failed'));
        }
      };

      worker.addEventListener('message', handleMessage);

      worker.postMessage({
        type: 'run',
        text,
        options,
      } as PipelineWorkerMessage);
    });
  };

  return isReady ? generateEmbedding : null;
}
