import { useCallback, useRef, useState } from 'react';
import { MockVoiceCaptureService, VoiceCaptureSample } from '../../services/audio/MockVoiceCaptureService';
import { VoiceBaselineRepository } from '../../repositories';
import { BaselineConfig } from './config';
import { VOICE_BASELINE_SENTENCES } from './voiceSentences';
import { averageEmbedding, cosineSimilarity } from './speakerEnrollment';
import { computeVoiceQualityScore, extractVoiceFeatures } from './extractVoiceFeatures';

export type VoiceEnrollmentPhase = 'idle' | 'recording' | 'rejected' | 'accepted' | 'completed';

/**
 * Section 8 Speaker Enrollment state machine:
 * sample 1 seeds a temp embedding, each following sample is compared
 * against the running average until enough valid samples exist to freeze a
 * Speaker Profile; remaining samples are then verified against that profile.
 */
export function useVoiceEnrollment() {
  const captureService = useRef(new MockVoiceCaptureService()).current;
  const embeddingsRef = useRef<number[][]>([]);
  const samplesRef = useRef<VoiceCaptureSample[]>([]);
  const profileRef = useRef<number[] | null>(null);

  const [sampleIndex, setSampleIndex] = useState(0);
  const [phase, setPhase] = useState<VoiceEnrollmentPhase>('idle');
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);

  const totalSamples = BaselineConfig.requiredVoiceSamples;
  const currentSentence = VOICE_BASELINE_SENTENCES[sampleIndex];

  const recordSample = useCallback(async () => {
    setPhase('recording');
    setRejectionMessage(null);

    const sample = await captureService.captureSample();
    const reference =
      profileRef.current ??
      (embeddingsRef.current.length > 0 ? averageEmbedding(embeddingsRef.current) : null);

    if (reference) {
      const similarity = cosineSimilarity(sample.embedding, reference);
      if (similarity < BaselineConfig.speakerSimilarityThreshold) {
        setPhase('rejected');
        setRejectionMessage('Không nhận diện được đúng giọng nói của bạn. Vui lòng đọc lại.');
        return;
      }
    }

    embeddingsRef.current = [...embeddingsRef.current, sample.embedding];
    samplesRef.current = [...samplesRef.current, sample];

    if (!profileRef.current && embeddingsRef.current.length >= BaselineConfig.minValidSamplesForProfile) {
      profileRef.current = averageEmbedding(embeddingsRef.current);
    }

    if (embeddingsRef.current.length >= totalSamples) {
      const features = extractVoiceFeatures(samplesRef.current);
      const quality = computeVoiceQualityScore(samplesRef.current);
      const speakerEmbedding = profileRef.current ?? averageEmbedding(embeddingsRef.current);
      await VoiceBaselineRepository.save(speakerEmbedding, features, quality);
      setPhase('completed');
      return;
    }

    setPhase('accepted');
    setSampleIndex(embeddingsRef.current.length);
  }, [captureService, totalSamples]);

  return { currentSentence, sampleIndex, totalSamples, phase, rejectionMessage, recordSample };
}
