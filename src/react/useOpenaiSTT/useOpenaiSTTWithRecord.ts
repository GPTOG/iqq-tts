import { useCallback, useState } from 'react';
import { SWRConfiguration } from 'swr';

import { useAudioRecorder } from '@/react/useAudioRecorder';
import { useOpenaiSTT } from '@/react/useOpenaiSTT/useOpenaiSTT';
import { SpeechRecognitionOptions } from '@/react/useSpeechRecognition/useSpeechRecognition';

import { OpenAISTTConfig } from './useOpenaiSTT';

export interface STTConfig
  extends SpeechRecognitionOptions,
    SWRConfiguration,
    Partial<OpenAISTTConfig> {
  onFinished?: SWRConfiguration['onSuccess'];
  onStart?: () => void;
  onStop?: () => void;
}

export const useOpenaiSTTWithRecord = ({
  onBlobAvailable,
  onTextChange,
  onSuccess,
  onError,
  onFinished,
  onStart,
  onStop,
  options,
  ...restConfig
}: STTConfig = {}) => {
  const [isGlobalLoading, setIsGlobalLoading] = useState<boolean>(false);
  const [shouldFetch, setShouldFetch] = useState<boolean>(false);
  const [text, setText] = useState<string>();
  const { start, stop, blob, url, isRecording, time, formattedTime } = useAudioRecorder(
    (blobData) => {
      setShouldFetch(true);
      onBlobAvailable?.(blobData);
    },
  );

  const handleStart = useCallback(() => {
    onStart?.();
    setIsGlobalLoading(true);
    start();
    setText('');
  }, [start]);

  const handleStop = useCallback(() => {
    onStop?.();
    stop();
    setShouldFetch(false);
    setIsGlobalLoading(false);
  }, [stop]);

  const { isLoading } = useOpenaiSTT({
    onError: (err, ...rest) => {
      onError?.(err, ...rest);
      console.error(err);
      handleStop();
    },
    onSuccess: (data, ...rest) => {
      onSuccess?.(data, ...rest);
      setText(data);
      onTextChange?.(data);
      handleStop();
      onFinished?.(data, ...rest);
    },
    options: options!,
    shouldFetch,
    speech: blob as Blob,
    ...restConfig,
  });

  return {
    blob,
    formattedTime,
    isLoading: isGlobalLoading || isLoading || isRecording,
    isRecording,
    start: handleStart,
    stop: handleStop,
    text,
    time,
    url,
  };
};
