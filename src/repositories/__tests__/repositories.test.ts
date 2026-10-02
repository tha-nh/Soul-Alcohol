import { getDatabase } from '../../database/db';
import { AlertLevel, SessionStatus, VoiceBaselineFeatures } from '../../models';
import { AlertRepository } from '../AlertRepository';
import { AnalysisResultRepository } from '../AnalysisResultRepository';
import { MotionBaselineRepository } from '../MotionBaselineRepository';
import { ProfileRepository } from '../ProfileRepository';
import { SessionRepository } from '../SessionRepository';
import { VoiceBaselineRepository } from '../VoiceBaselineRepository';

jest.mock('../../database/db', () => ({ getDatabase: jest.fn() }));

const execute = jest.fn();
const rows = (...r: Record<string, unknown>[]) => ({ rows: r, rowsAffected: 0 });

beforeEach(() => {
  execute.mockReset();
  (getDatabase as jest.Mock).mockResolvedValue({ execute });
});

describe('ProfileRepository', () => {
  const row = { id: 'p1', name: 'An', created_at: '2026-01-01' };

  it('get() returns null when there is no profile', async () => {
    execute.mockResolvedValue(rows());
    await expect(ProfileRepository.get()).resolves.toBeNull();
  });

  it('get() maps snake_case columns to the domain model', async () => {
    execute.mockResolvedValue(rows(row));
    await expect(ProfileRepository.get()).resolves.toEqual({ id: 'p1', name: 'An', createdAt: '2026-01-01' });
  });

  it('save() inserts when no profile exists yet', async () => {
    execute.mockResolvedValueOnce(rows()).mockResolvedValueOnce(rows());
    const profile = await ProfileRepository.save('Binh');

    expect(profile.name).toBe('Binh');
    expect(execute).toHaveBeenLastCalledWith(
      expect.stringContaining('INSERT INTO profile'),
      [profile.id, 'Binh', profile.createdAt],
    );
  });

  it('save() updates the existing profile instead of inserting a second one', async () => {
    execute.mockResolvedValueOnce(rows(row)).mockResolvedValueOnce(rows());
    const profile = await ProfileRepository.save('Binh');

    expect(profile).toEqual({ id: 'p1', name: 'Binh', createdAt: '2026-01-01' });
    expect(execute).toHaveBeenLastCalledWith(expect.stringContaining('UPDATE profile'), ['Binh', 'p1']);
  });
});

describe('VoiceBaselineRepository', () => {
  const features: VoiceBaselineFeatures = {
    speakingRate: 4,
    articulationRate: 4.5,
    pauseRatio: 0.1,
    pitchVariation: 0.2,
    energyVariation: 0.2,
    speechRhythm: 0.7,
    voiceStability: 0.8,
    spectralFeatures: [0.1, 0.2],
    pronunciationConsistency: 0.9,
  };

  it('stores the embedding and features as JSON text', async () => {
    execute.mockResolvedValue(rows());
    const saved = await VoiceBaselineRepository.save([0.1, 0.2], features, 88);

    const params = execute.mock.calls[0][1] as unknown[];
    expect(params[1]).toBe(JSON.stringify([0.1, 0.2]));
    expect(params[2]).toBe(JSON.stringify(features));
    expect(params[3]).toBe(88);
    expect(saved.qualityScore).toBe(88);
  });

  it('getLatest() round-trips the JSON columns back to objects', async () => {
    execute.mockResolvedValue(
      rows({
        id: 'v1',
        speaker_embedding: JSON.stringify([1, 2]),
        voice_features: JSON.stringify(features),
        quality_score: 90,
        created_at: 'c',
        updated_at: 'u',
      }),
    );
    const baseline = await VoiceBaselineRepository.getLatest();

    expect(baseline?.speakerEmbedding).toEqual([1, 2]);
    expect(baseline?.voiceFeatures).toEqual(features);
    expect(baseline?.updatedAt).toBe('u');
  });

  it('getLatest() is null when no baseline exists, and clear() deletes them all', async () => {
    execute.mockResolvedValue(rows());
    await expect(VoiceBaselineRepository.getLatest()).resolves.toBeNull();

    await VoiceBaselineRepository.clear();
    expect(execute).toHaveBeenLastCalledWith('DELETE FROM voice_baseline;');
  });
});

describe('MotionBaselineRepository', () => {
  const input = {
    walkingStability: 0.8,
    stepRegularity: 0.7,
    stepIntervalVariability: 0.1,
    lateralSway: 0.15,
    motionVariance: 0.2,
    rotationVariance: 0.18,
    qualityScore: 85,
  };

  it('save() writes every motion feature, including step interval variability', async () => {
    execute.mockResolvedValue(rows());
    const saved = await MotionBaselineRepository.save(input);

    expect(execute.mock.calls[0][0]).toContain('step_interval_variability');
    expect(execute.mock.calls[0][1]).toEqual([
      saved.id,
      0.8,
      0.7,
      0.1,
      0.15,
      0.2,
      0.18,
      85,
      saved.createdAt,
      saved.updatedAt,
    ]);
  });

  it('getLatest() maps columns back to the domain model', async () => {
    execute.mockResolvedValue(
      rows({
        id: 'm1',
        walking_stability: 0.8,
        step_regularity: 0.7,
        step_interval_variability: 0.1,
        lateral_sway: 0.15,
        motion_variance: 0.2,
        rotation_variance: 0.18,
        quality_score: 85,
        created_at: 'c',
        updated_at: 'u',
      }),
    );
    await expect(MotionBaselineRepository.getLatest()).resolves.toEqual({
      ...input,
      id: 'm1',
      createdAt: 'c',
      updatedAt: 'u',
    });
  });

  it('getLatest() is null when empty, and clear() deletes them all', async () => {
    execute.mockResolvedValue(rows());
    await expect(MotionBaselineRepository.getLatest()).resolves.toBeNull();

    await MotionBaselineRepository.clear();
    expect(execute).toHaveBeenLastCalledWith('DELETE FROM motion_baseline;');
  });
});

describe('SessionRepository', () => {
  const row = {
    id: 's1',
    start_time: 'start',
    end_time: null,
    status: 'COMPLETED',
    initial_score: 94,
    lowest_score: 38,
    final_score: 46,
    max_alert_level: 'STOP_RECOMMENDED',
    created_at: 'created',
  };

  it('create() inserts a READY session with no scores yet', async () => {
    execute.mockResolvedValue(rows());
    const session = await SessionRepository.create();

    expect(session).toMatchObject({
      status: SessionStatus.READY,
      endTime: null,
      initialScore: null,
      lowestScore: null,
      finalScore: null,
      maxAlertLevel: null,
    });
    expect(execute.mock.calls[0][1]).toContain(SessionStatus.READY);
  });

  it('getById() maps a row and turns missing optional columns into null', async () => {
    execute.mockResolvedValue(rows(row));
    await expect(SessionRepository.getById('s1')).resolves.toEqual({
      id: 's1',
      startTime: 'start',
      endTime: null,
      status: SessionStatus.COMPLETED,
      initialScore: 94,
      lowestScore: 38,
      finalScore: 46,
      maxAlertLevel: AlertLevel.STOP_RECOMMENDED,
      createdAt: 'created',
    });
    expect(execute).toHaveBeenCalledWith(expect.any(String), ['s1']);
  });

  it('getById() is null for an unknown id', async () => {
    execute.mockResolvedValue(rows());
    await expect(SessionRepository.getById('nope')).resolves.toBeNull();
  });

  it('update() writes the mutable columns keyed by id', async () => {
    execute.mockResolvedValue(rows());
    await SessionRepository.update({
      id: 's1',
      startTime: 'start',
      endTime: 'end',
      status: SessionStatus.COMPLETED,
      initialScore: 94,
      lowestScore: 38,
      finalScore: 46,
      maxAlertLevel: AlertLevel.WARNING,
      createdAt: 'created',
    });
    const params = execute.mock.calls[0][1] as unknown[];
    expect(params[params.length - 1]).toBe('s1');
    expect(params).toContain('COMPLETED');
  });

  it('getActiveSession() only looks for MONITORING or PAUSED sessions (Section 44)', async () => {
    execute.mockResolvedValue(rows());
    await expect(SessionRepository.getActiveSession()).resolves.toBeNull();
    expect(execute.mock.calls[0][1]).toEqual([SessionStatus.MONITORING, SessionStatus.PAUSED]);
  });

  it('listAll() maps every row', async () => {
    execute.mockResolvedValue(rows(row, { ...row, id: 's2' }));
    const sessions = await SessionRepository.listAll();
    expect(sessions.map(s => s.id)).toEqual(['s1', 's2']);
  });
});

describe('AnalysisResultRepository', () => {
  const input = {
    sessionId: 's1',
    timestamp: 't',
    voiceScore: 90,
    motionScore: 80,
    trendScore: 100,
    alertnessScore: 88,
    confidenceScore: 70,
    voiceAvailable: true,
    motionAvailable: false,
  };

  it('insert() stores booleans as 1/0', async () => {
    execute.mockResolvedValue(rows());
    await AnalysisResultRepository.insert(input);
    const params = execute.mock.calls[0][1] as unknown[];
    expect(params.slice(-2)).toEqual([1, 0]);
  });

  it('listBySession() maps 1/0 back to booleans', async () => {
    execute.mockResolvedValue(
      rows({
        id: 'a1',
        session_id: 's1',
        timestamp: 't',
        voice_score: 90,
        motion_score: 80,
        trend_score: 100,
        alertness_score: 88,
        confidence_score: 70,
        voice_available: 1,
        motion_available: 0,
      }),
    );
    const [result] = await AnalysisResultRepository.listBySession('s1');
    expect(result).toMatchObject({ voiceAvailable: true, motionAvailable: false, alertnessScore: 88 });
  });
});

describe('AlertRepository', () => {
  it('insert() starts with no user response', async () => {
    execute.mockResolvedValue(rows());
    const alert = await AlertRepository.insert({
      sessionId: 's1',
      timestamp: 't',
      level: AlertLevel.NOTICE,
      message: 'm',
    });
    expect(alert.userResponse).toBeNull();
  });

  it('setUserResponse() updates by alert id', async () => {
    execute.mockResolvedValue(rows());
    await AlertRepository.setUserResponse('a1', 'TÔI SẼ DỪNG');
    expect(execute).toHaveBeenCalledWith(expect.stringContaining('UPDATE alert'), ['TÔI SẼ DỪNG', 'a1']);
  });

  it('listBySession() maps rows including a missing user response', async () => {
    execute.mockResolvedValue(
      rows({ id: 'a1', session_id: 's1', timestamp: 't', level: 'WARNING', message: 'm', user_response: null }),
    );
    await expect(AlertRepository.listBySession('s1')).resolves.toEqual([
      { id: 'a1', sessionId: 's1', timestamp: 't', level: AlertLevel.WARNING, message: 'm', userResponse: null },
    ]);
  });
});
