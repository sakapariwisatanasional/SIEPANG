/**
 * @license
 * SiEpang - Competition, Team & Judging Service
 * Canonical Spreadsheet persistence for entries, judging scores, teams and winner finalization.
 */
import { Competition, DigitalWork } from '../types';
import { adminPersistenceService } from './adminPersistenceService';

export type ScoreLifecycleStatus = 'DRAFT' | 'SUBMITTED' | 'LOCKED';

export interface JudgeScoreRecord {
  id: string;
  competitionId: string;
  entryId: string;
  judgeId: string;
  judgeName: string;
  contingentName: string;
  scores: Record<string, number>;
  totalScore: number;
  notes: string;
  status: ScoreLifecycleStatus;
  updatedAt: string;
  lockedAt?: string;
  reopenedBy?: string;
  reopenedReason?: string;
}

export interface CompetitionTeam {
  teamId: string;
  competitionId: string;
  contingentId: string;
  contingentName: string;
  teamName: string;
  memberIds: string[];
  memberNames: string[];
  registeredAt: string;
}

export interface CompetitionWinnerResult {
  competitionId: string;
  competitionTitle: string;
  winner1: { entryId: string; title: string; contingent: string; score: number };
  winner2?: { entryId: string; title: string; contingent: string; score: number };
  winner3?: { entryId: string; title: string; contingent: string; score: number };
  specialAward?: { entryId: string; awardName: string; contingent: string };
  isPublished: boolean;
  finalizedAt: string;
  finalizedBy: string;
}

export interface JudgeScoreSubmission extends JudgeScoreRecord {}

class CompetitionService {
  private competitions: Competition[] = [];
  private digitalWorks: DigitalWork[] = [];
  private scores: JudgeScoreRecord[] = [];
  private teams: CompetitionTeam[] = [];
  private winnerResults: Map<string, CompetitionWinnerResult> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    setTimeout(() => void this.refreshFromBackend(), 0);
  }

  public async refreshFromBackend(): Promise<void> {
    const [entryRows, scoreRows] = await Promise.all([
      adminPersistenceService.list<any>('competitionEntries'),
      adminPersistenceService.list<any>('judgingScores'),
    ]);

    this.digitalWorks = entryRows
      .filter((r: any) => r.submission_url || r.entry_title)
      .map((r: any) => ({
        ...r,
        id: String(r.id || ''),
        competitionId: String(r.competition_id || ''),
        title: String(r.entry_title || r.team_name || ''),
        mediaUrl: String(r.submission_url || ''),
        votesCount: Number(r.votes_count || 0),
        hasVoted: false,
        submittedAt: String(r.submitted_at || ''),
        contingentName: String(r.contingent_name || ''),
      })) as unknown as DigitalWork[];

    this.teams = entryRows
      .filter((r: any) => r.team_name)
      .map((r: any) => ({
        teamId: String(r.id || ''),
        competitionId: String(r.competition_id || ''),
        contingentId: String(r.contingent_id || ''),
        contingentName: String(r.contingent_name || ''),
        teamName: String(r.team_name || ''),
        memberIds: Array.isArray(r.team_members_json)
          ? r.team_members_json.map((x: any) => typeof x === 'string' ? x : x.id).filter(Boolean)
          : [],
        memberNames: Array.isArray(r.team_members_json)
          ? r.team_members_json.map((x: any) => typeof x === 'string' ? x : x.name).filter(Boolean)
          : [],
        registeredAt: String(r.submitted_at || ''),
      }));

    this.scores = scoreRows.map((r: any) => ({
      id: String(r.id || ''),
      competitionId: String(r.competition_id || ''),
      entryId: String(r.entry_id || ''),
      judgeId: String(r.judge_id || ''),
      judgeName: String(r.judge_name || ''),
      contingentName: String(r.contingent_name || ''),
      scores: typeof r.criteria_scores_json === 'object' && r.criteria_scores_json
        ? r.criteria_scores_json
        : {},
      totalScore: Number(r.score || 0),
      notes: String(r.notes || ''),
      status: (r.status || (r.is_locked ? 'LOCKED' : 'SUBMITTED')) as ScoreLifecycleStatus,
      updatedAt: String(r.submitted_at || ''),
      lockedAt: r.locked_at || undefined,
      reopenedBy: r.reopened_by || undefined,
      reopenedReason: r.revision_reason || undefined,
    }));

    this.notify();
  }

  public getCompetitions(): Competition[] {
    return [...this.competitions];
  }

  public getDigitalWorks(filterCategory?: string): DigitalWork[] {
    return filterCategory && filterCategory !== 'all'
      ? this.digitalWorks.filter(w => w.competitionId === filterCategory)
      : [...this.digitalWorks];
  }

  public async submitDigitalWork(
    work: Omit<DigitalWork, 'id' | 'votesCount' | 'hasVoted' | 'submittedAt'>
  ): Promise<DigitalWork> {
    const saved = await adminPersistenceService.upsert<any>('competitionEntries', {
      competition_id: (work as any).competitionId || '',
      participation_level: (work as any).participationLevel || 'INDIVIDUAL',
      contingent_id: (work as any).contingentId || '',
      contingent_name: (work as any).contingentName || '',
      entry_title: (work as any).title || '',
      submission_url: (work as any).mediaUrl || (work as any).submissionUrl || '',
      status: 'SUBMITTED',
      submitted_at: new Date().toISOString(),
      votes_count: 0,
    });

    const item = {
      ...work,
      id: saved.id,
      votesCount: Number(saved.votes_count || 0),
      hasVoted: false,
      submittedAt: saved.submitted_at || new Date().toISOString(),
    } as DigitalWork;

    this.digitalWorks.unshift(item);
    this.notify();
    return item;
  }

  public async submitJudgeScore(scoreData: {
    competitionId: string;
    entryId: string;
    judgeId?: string;
    judgeName?: string;
    contingentName: string;
    scores: Record<string, number>;
    totalScore?: number;
    notes: string;
    status?: ScoreLifecycleStatus;
  }): Promise<JudgeScoreRecord> {
    const values = Object.values(scoreData.scores);
    const sum = values.reduce((a, b) => a + (Number(b) || 0), 0);
    const weightedTotal = scoreData.totalScore !== undefined
      ? scoreData.totalScore
      : values.length > 0 ? Math.round((sum / values.length) * 10) / 10 : 0;

    const existing = this.scores.find(
      s => s.competitionId === scoreData.competitionId &&
           s.entryId === scoreData.entryId &&
           s.judgeId === (scoreData.judgeId || 'jdg_current')
    );

    const saved = await adminPersistenceService.upsert<any>('judgingScores', {
      id: existing?.id || undefined,
      competition_id: scoreData.competitionId,
      entry_id: scoreData.entryId,
      judge_id: scoreData.judgeId || 'jdg_current',
      judge_name: scoreData.judgeName || 'Dewan Juri',
      contingent_name: scoreData.contingentName,
      score: weightedTotal,
      criteria_scores_json: scoreData.scores,
      is_locked: scoreData.status === 'LOCKED',
      revision_number: existing ? 1 : 0,
      revision_reason: '',
      submitted_at: new Date().toISOString(),
      notes: scoreData.notes || '',
      status: scoreData.status || 'SUBMITTED',
    });

    const record: JudgeScoreRecord = {
      id: saved.id,
      competitionId: scoreData.competitionId,
      entryId: scoreData.entryId,
      judgeId: saved.judge_id || scoreData.judgeId || 'jdg_current',
      judgeName: saved.judge_name || scoreData.judgeName || 'Dewan Juri',
      contingentName: saved.contingent_name || scoreData.contingentName,
      scores: saved.criteria_scores_json || scoreData.scores,
      totalScore: Number(saved.score ?? weightedTotal),
      notes: saved.notes || scoreData.notes || '',
      status: (saved.status || scoreData.status || 'SUBMITTED') as ScoreLifecycleStatus,
      updatedAt: saved.submitted_at || new Date().toISOString(),
      lockedAt: saved.locked_at || undefined,
    };

    const idx = this.scores.findIndex(s => s.id === record.id);
    if (idx >= 0) this.scores[idx] = record;
    else this.scores.unshift(record);
    this.notify();
    return record;
  }

  public async lockScore(scoreId: string): Promise<void> {
    const current = this.scores.find(s => s.id === scoreId);
    if (!current) throw new Error('Nilai juri tidak ditemukan');
    const saved = await adminPersistenceService.upsert<any>('judgingScores', {
      id: scoreId,
      competition_id: current.competitionId,
      entry_id: current.entryId,
      judge_id: current.judgeId,
      judge_name: current.judgeName,
      contingent_name: current.contingentName,
      score: current.totalScore,
      criteria_scores_json: current.scores,
      notes: current.notes,
      status: 'LOCKED',
      is_locked: true,
      locked_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
    });
    current.status = 'LOCKED';
    current.lockedAt = saved.locked_at;
    this.notify();
  }

  public async reopenScore(scoreId: string, reason: string, adminName: string): Promise<void> {
    const current = this.scores.find(s => s.id === scoreId);
    if (!current) throw new Error('Nilai juri tidak ditemukan');
    await adminPersistenceService.upsert<any>('judgingScores', {
      id: scoreId,
      competition_id: current.competitionId,
      entry_id: current.entryId,
      judge_id: current.judgeId,
      judge_name: current.judgeName,
      contingent_name: current.contingentName,
      score: current.totalScore,
      criteria_scores_json: current.scores,
      notes: current.notes,
      status: 'DRAFT',
      is_locked: false,
      revision_reason: reason,
      reopened_by: adminName,
      submitted_at: new Date().toISOString(),
    });
    current.status = 'DRAFT';
    current.reopenedBy = adminName;
    current.reopenedReason = reason;
    this.notify();
  }

  public getAllScores(): JudgeScoreRecord[] {
    return [...this.scores];
  }

  public getJudgeScores(competitionId: string): JudgeScoreRecord[] {
    return this.scores.filter(s => s.competitionId === competitionId);
  }

  public async registerTeam(teamData: {
    competitionId: string;
    contingentId: string;
    contingentName: string;
    teamName: string;
    memberIds: string[];
    memberNames: string[];
  }): Promise<CompetitionTeam> {
    if (teamData.memberIds.length < 2) {
      throw new Error('Regu/Tim lomba minimal harus beranggotakan 2 orang peserta.');
    }

    const saved = await adminPersistenceService.upsert<any>('competitionEntries', {
      competition_id: teamData.competitionId,
      participation_level: 'TEAM',
      contingent_id: teamData.contingentId,
      contingent_name: teamData.contingentName,
      team_name: teamData.teamName,
      team_members_json: teamData.memberIds.map((id, i) => ({ id, name: teamData.memberNames[i] || '' })),
      status: 'REGISTERED',
      submitted_at: new Date().toISOString(),
    });

    const team: CompetitionTeam = {
      teamId: saved.id,
      ...teamData,
      registeredAt: saved.submitted_at || new Date().toISOString(),
    };
    this.teams.push(team);
    this.notify();
    return team;
  }

  public getTeams(competitionId?: string): CompetitionTeam[] {
    return competitionId
      ? this.teams.filter(t => t.competitionId === competitionId)
      : [...this.teams];
  }

  public async finalizeWinners(result: CompetitionWinnerResult): Promise<void> {
    // Persist the winner result into the competition entry metadata instead of a browser-only map.
    await adminPersistenceService.upsert<any>('competitionEntries', {
      id: `winner_${result.competitionId}`,
      competition_id: result.competitionId,
      participation_level: 'RESULT',
      entry_title: result.competitionTitle,
      status: result.isPublished ? 'PUBLISHED_RESULT' : 'DRAFT_RESULT',
      result_json: result,
      submitted_at: result.finalizedAt || new Date().toISOString(),
    });

    this.winnerResults.set(result.competitionId, result);

    this.notify();
  }

  public getWinnerResult(competitionId: string): CompetitionWinnerResult | undefined {
    return this.winnerResults.get(competitionId);
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }
}

export const competitionService = new CompetitionService();
