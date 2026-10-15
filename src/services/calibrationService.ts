import {
  DraftReviewRecord,
  ScoringWeights,
  CalibrationSnapshot,
  BacktestReport,
  BacktestTurnResult,
  CalibrationAnalysisReport,
  DivergenceReasonCategory,
  TurnRecommendationSnapshot,
} from '../types/calibration';
import { DEFAULT_PRODUCTION_SCORING_WEIGHTS, INITIAL_DRAFT_REVIEWS } from '../data/seedDraftReviews';
import { CompRoleKey, mapToCompRole } from './coachAnalysisService';

const STORAGE_KEY_REVIEWS = 'mcu_draft_reviews';
const STORAGE_KEY_ACTIVE_WEIGHTS = 'mcu_active_scoring_weights';
const STORAGE_KEY_SNAPSHOTS = 'mcu_calibration_rollback_snapshots';

// In-memory fallback for SSR / Node environments
let memoryReviews: DraftReviewRecord[] = [...INITIAL_DRAFT_REVIEWS];
let memoryWeights: ScoringWeights = { ...DEFAULT_PRODUCTION_SCORING_WEIGHTS };
let memorySnapshots: CalibrationSnapshot[] = [];

export const DIVERGENCE_REASON_LABELS: Record<DivergenceReasonCategory, string> = {
  player_signature_pocket: 'ผู้เล่นมั่นใจ / Pocket Pick ประจำตัว',
  strategic_flex: 'สลับตำแหน่ง (Flex Pick) หลอกคู่แข่ง',
  bait_trap_strategy: 'หลอกล่อให้คู่แข่งหยิบเข้าทางแก้',
  scrim_proven_secret: 'สูตรลับซ้อมได้ผลดีจากห้อง Scrim',
  enemy_predictive_deny: 'อ่านใจตัดฮีโร่ที่คู่แข่งจะหยิบถัดไป',
  tactical_synergy_priority: 'เน้นคอมโบไฟต์ทีมเป็นหลัก',
  target_lane_counter: 'มั่นใจการยืนเลนชนะคู่แข่งเฉพาะเจาะจง',
  coach_intuition: 'เซนส์และวิจารณญาณโค้ชหน้างานสด',
  other: 'เหตุผลเฉพาะหน้าอื่นๆ',
};

class CalibrationService {
  /**
   * Retrieve all draft reviews with fallback to seed data
   */
  public getAllReviews(): DraftReviewRecord[] {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return memoryReviews;
      }
      const raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(INITIAL_DRAFT_REVIEWS));
        memoryReviews = [...INITIAL_DRAFT_REVIEWS];
        return INITIAL_DRAFT_REVIEWS;
      }
      const parsed = JSON.parse(raw);
      const res = Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DRAFT_REVIEWS;
      memoryReviews = res;
      return res;
    } catch (e) {
      console.error('Failed to load draft reviews:', e);
      return memoryReviews;
    }
  }

  /**
   * Save a single draft review
   */
  public saveReview(review: DraftReviewRecord): void {
    const all = this.getAllReviews();
    const idx = all.findIndex((r) => r.id === review.id);
    let updated: DraftReviewRecord[];
    if (idx >= 0) {
      updated = [...all];
      updated[idx] = { ...review, updatedAt: new Date().toISOString() };
    } else {
      updated = [
        {
          ...review,
          createdAt: review.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...all,
      ];
    }
    memoryReviews = updated;

    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to save draft review:', e);
    }
  }

  /**
   * Delete a draft review
   */
  public deleteReview(id: string): void {
    const all = this.getAllReviews().filter((r) => r.id !== id);
    memoryReviews = all;
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(all));
      }
    } catch (e) {
      console.error('Failed to delete review:', e);
    }
  }

  /**
   * Reset reviews to initial seed data
   */
  public resetToDefaultReviews(): void {
    memoryReviews = [...INITIAL_DRAFT_REVIEWS];
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(INITIAL_DRAFT_REVIEWS));
      }
    } catch (e) {
      console.error('Failed to reset draft reviews:', e);
    }
  }

  /**
   * Retrieve active production scoring weights
   */
  public getActiveWeights(): ScoringWeights {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return memoryWeights;
      }
      const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_WEIGHTS);
      if (!raw) return memoryWeights;
      const parsed = JSON.parse(raw);
      const res = { ...DEFAULT_PRODUCTION_SCORING_WEIGHTS, ...parsed };
      memoryWeights = res;
      return res;
    } catch {
      return memoryWeights;
    }
  }

  /**
   * Retrieve calibration rollback snapshots
   */
  public getRollbackSnapshots(): CalibrationSnapshot[] {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return memorySnapshots;
      }
      const raw = localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
      if (!raw) return memorySnapshots;
      const parsed = JSON.parse(raw);
      memorySnapshots = Array.isArray(parsed) ? parsed : [];
      return memorySnapshots;
    } catch {
      return memorySnapshots;
    }
  }

  /**
   * Deploy candidate weights to production with required evidence snapshot & rollback plan
   */
  public deployProductionWeights(params: {
    candidateWeights: ScoringWeights;
    description: string;
    appliedBy?: string;
    backtestReport?: BacktestReport;
  }): { success: boolean; snapshot: CalibrationSnapshot } {
    const currentWeights = this.getActiveWeights();
    const snapshot: CalibrationSnapshot = {
      id: `snap_${Date.now()}`,
      appliedAt: new Date().toISOString(),
      description: params.description || 'ปรับจูนน้ำหนักสูตรคะแนนดราฟต์',
      weights: { ...params.candidateWeights },
      previousWeights: { ...currentWeights },
      backtestDelta: {
        top1Delta: params.backtestReport?.delta.top1RateDelta || 0,
        top3Delta: params.backtestReport?.delta.top3RateDelta || 0,
        top5Delta: params.backtestReport?.delta.top5RateDelta || 0,
        avgRankImprovement: -(params.backtestReport?.delta.avgRankDelta || 0),
      },
      appliedBy: params.appliedBy || 'Head Coach MCU',
    };

    memoryWeights = { ...params.candidateWeights };
    memorySnapshots = [snapshot, ...memorySnapshots].slice(0, 20);

    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const snapshots = this.getRollbackSnapshots();
        const updatedSnapshots = [snapshot, ...snapshots].slice(0, 20);
        localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(updatedSnapshots));
        localStorage.setItem(STORAGE_KEY_ACTIVE_WEIGHTS, JSON.stringify(params.candidateWeights));
      }
    } catch (e) {
      console.error('Failed to save calibration snapshot:', e);
      return { success: false, snapshot };
    }

    return { success: true, snapshot };
  }

  /**
   * Rollback weights to a previous snapshot
   */
  public rollbackToSnapshot(snapshotId: string): boolean {
    try {
      const snapshots = this.getRollbackSnapshots();
      const target = snapshots.find((s) => s.id === snapshotId);
      if (!target) return false;

      memoryWeights = { ...target.previousWeights };

      const rollbackRecord: CalibrationSnapshot = {
        id: `snap_rb_${Date.now()}`,
        appliedAt: new Date().toISOString(),
        description: `ย้อนกลับสูตรคะแนน (Rollback) จาก Snapshot [${target.id}]`,
        weights: { ...target.previousWeights },
        previousWeights: this.getActiveWeights(),
        backtestDelta: { top1Delta: 0, top3Delta: 0, top5Delta: 0, avgRankImprovement: 0 },
        appliedBy: 'Rollback System',
      };
      memorySnapshots = [rollbackRecord, ...memorySnapshots].slice(0, 20);

      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_ACTIVE_WEIGHTS, JSON.stringify(target.previousWeights));
        const updatedSnapshots = [rollbackRecord, ...snapshots].slice(0, 20);
        localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(updatedSnapshots));
      }

      return true;
    } catch (e) {
      console.error('Failed to rollback:', e);
      return false;
    }
  }

  /**
   * Reset production weights to default
   */
  public resetWeightsToDefault(): void {
    memoryWeights = { ...DEFAULT_PRODUCTION_SCORING_WEIGHTS };
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_WEIGHTS);
      }
    } catch (e) {
      console.error('Failed to reset weights:', e);
    }
  }

  /**
   * Offline A/B Backtesting Simulator
   * Re-evaluates historical draft review turns under Candidate Weights vs Baseline Weights
   */
  public runOfflineBacktest(
    candidateWeights: ScoringWeights,
    baselineWeights?: ScoringWeights
  ): BacktestReport {
    const baseWeights = baselineWeights || this.getActiveWeights();
    const reviews = this.getAllReviews();

    let totalTurns = 0;
    let baseTop1 = 0;
    let baseTop3 = 0;
    let baseTop5 = 0;
    let baseRankSum = 0;

    let candTop1 = 0;
    let candTop3 = 0;
    let candTop5 = 0;
    let candRankSum = 0;

    const sampleTurns: BacktestTurnResult[] = [];

    // Ratio multipliers for simulating how changes in factor weights alter candidate scores
    const roleRatio = candidateWeights.missingRoleWeight / Math.max(1, baseWeights.missingRoleWeight);
    const sigRatio = candidateWeights.playerSignatureWeight / Math.max(1, baseWeights.playerSignatureWeight);
    const matchupRatio = candidateWeights.matchupAdvantageWeight / Math.max(1, baseWeights.matchupAdvantageWeight);
    const synergyRatio = candidateWeights.synergyWeight / Math.max(1, baseWeights.synergyWeight);
    const metaRatio = candidateWeights.tournamentMetaWeight / Math.max(1, baseWeights.tournamentMetaWeight);
    const sideRatio = candidateWeights.sideBiasWeight / Math.max(1, baseWeights.sideBiasWeight);

    reviews.forEach((review) => {
      review.turns.forEach((turn) => {
        if (!turn.topSuggestions || turn.topSuggestions.length === 0) return;

        totalTurns++;

        // Baseline performance
        const baseRank = turn.chosenRank;
        if (baseRank === 1) baseTop1++;
        if (baseRank && baseRank <= 3) baseTop3++;
        if (baseRank && baseRank <= 5) baseTop5++;
        baseRankSum += baseRank ? baseRank : 8; // penalty 8 if unranked

        // Compute counterfactual scores for each suggestion under candidate weights
        const reScored = turn.topSuggestions.map((sug) => {
          let delta = 0;

          // If hero had role filling reason
          if (sug.reasons.some((r) => r.includes('ตำแหน่ง') || r.includes('เติม'))) {
            delta += (roleRatio - 1) * 8;
          }
          // If hero had signature or comfortable reason
          if (sug.reasons.some((r) => r.includes('Signature') || r.includes('Comfortable'))) {
            delta += (sigRatio - 1) * 9;
          }
          // If hero had matchup advantage reason
          if (sug.reasons.some((r) => r.includes('ชนะทาง') || r.includes('แก้ทาง'))) {
            delta += (matchupRatio - 1) * 6;
          }
          // If hero had synergy combo reason
          if (sug.reasons.some((r) => r.includes('คอมโบ') || r.includes('เข้าขา'))) {
            delta += (synergyRatio - 1) * 5;
          }
          // If hero had meta or tournament WR reason
          if (sug.reasons.some((r) => r.includes('เมต้า') || r.includes('RPL') || r.includes('WR'))) {
            delta += (metaRatio - 1) * 5;
          }
          // If hero had side reason
          if (sug.reasons.some((r) => r.includes('Blue') || r.includes('Red'))) {
            delta += (sideRatio - 1) * 4;
          }

          // If coach chosen this hero due to signature and signature weight increased, give positive counterfactual lift
          if (
            turn.chosenHeroName === sug.heroName &&
            turn.divergenceReasonCategory === 'player_signature_pocket'
          ) {
            delta += (sigRatio - 1) * 7;
          }

          const newScore = Math.max(10, Math.min(99, Math.round(sug.score + delta)));
          return {
            heroName: sug.heroName,
            score: newScore,
          };
        });

        // Sort re-scored suggestions descending
        reScored.sort((a, b) => b.score - a.score);

        const candRankIdx = reScored.findIndex((s) => s.heroName.toLowerCase() === turn.chosenHeroName.toLowerCase());
        const candRank = candRankIdx >= 0 ? candRankIdx + 1 : (baseRank ? baseRank : null);

        if (candRank === 1) candTop1++;
        if (candRank && candRank <= 3) candTop3++;
        if (candRank && candRank <= 5) candTop5++;
        candRankSum += candRank ? candRank : 8;

        const baselineTop1Hero = turn.topSuggestions[0]?.heroName || '—';
        const candidateTop1Hero = reScored[0]?.heroName || '—';

        if (sampleTurns.length < 8) {
          sampleTurns.push({
            turnNumber: turn.turnNumber,
            chosenHero: turn.chosenHeroName,
            stage: turn.stage,
            baselineRank: baseRank,
            candidateRank: candRank,
            improved: candRank !== null && (baseRank === null || candRank < baseRank),
            regressed: candRank !== null && baseRank !== null && candRank > baseRank,
            baselineTop1Hero,
            candidateTop1Hero,
          });
        }
      });
    });

    const evaluated = Math.max(1, totalTurns);
    const bTop1Rate = (baseTop1 / evaluated) * 100;
    const bTop3Rate = (baseTop3 / evaluated) * 100;
    const bTop5Rate = (baseTop5 / evaluated) * 100;
    const bAvgRank = baseRankSum / evaluated;

    const cTop1Rate = (candTop1 / evaluated) * 100;
    const cTop3Rate = (candTop3 / evaluated) * 100;
    const cTop5Rate = (candTop5 / evaluated) * 100;
    const cAvgRank = candRankSum / evaluated;

    return {
      totalEvaluatedTurns: totalTurns,
      baseline: {
        top1Rate: Math.round(bTop1Rate * 10) / 10,
        top3Rate: Math.round(bTop3Rate * 10) / 10,
        top5Rate: Math.round(bTop5Rate * 10) / 10,
        avgRank: Math.round(bAvgRank * 10) / 10,
      },
      candidate: {
        top1Rate: Math.round(cTop1Rate * 10) / 10,
        top3Rate: Math.round(cTop3Rate * 10) / 10,
        top5Rate: Math.round(cTop5Rate * 10) / 10,
        avgRank: Math.round(cAvgRank * 10) / 10,
      },
      delta: {
        top1RateDelta: Math.round((cTop1Rate - bTop1Rate) * 10) / 10,
        top3RateDelta: Math.round((cTop3Rate - bTop3Rate) * 10) / 10,
        top5RateDelta: Math.round((cTop5Rate - bTop5Rate) * 10) / 10,
        avgRankDelta: Math.round((cAvgRank - bAvgRank) * 10) / 10,
      },
      sampleTurns,
    };
  }

  /**
   * Generate comprehensive calibration and draft review analysis report
   */
  public generateCalibrationReport(): CalibrationAnalysisReport {
    const reviews = this.getAllReviews();

    let totalTurns = 0;
    let top1Count = 0;
    let top3Count = 0;
    let top5Count = 0;
    let unrankedCount = 0;
    let divergedCount = 0;
    let sumDivergedRank = 0;

    const divergenceReasonMap: Record<DivergenceReasonCategory, number> = {
      player_signature_pocket: 0,
      strategic_flex: 0,
      bait_trap_strategy: 0,
      scrim_proven_secret: 0,
      enemy_predictive_deny: 0,
      tactical_synergy_priority: 0,
      target_lane_counter: 0,
      coach_intuition: 0,
      other: 0,
    };

    const sideBreakdown: Record<'blue' | 'red', { total: number; top1: number; top3: number; diverged: number }> = {
      blue: { total: 0, top1: 0, top3: 0, diverged: 0 },
      red: { total: 0, top1: 0, top3: 0, diverged: 0 },
    };

    const stageBreakdown: Record<
      'phase1_ban' | 'phase1_pick' | 'phase2_ban' | 'phase2_pick',
      { total: number; top1: number; top3: number; diverged: number }
    > = {
      phase1_ban: { total: 0, top1: 0, top3: 0, diverged: 0 },
      phase1_pick: { total: 0, top1: 0, top3: 0, diverged: 0 },
      phase2_ban: { total: 0, top1: 0, top3: 0, diverged: 0 },
      phase2_pick: { total: 0, top1: 0, top3: 0, diverged: 0 },
    };

    const roleBreakdown: Record<
      CompRoleKey,
      { total: number; top1: number; top3: number; diverged: number }
    > = {
      DSL: { total: 0, top1: 0, top3: 0, diverged: 0 },
      Jungle: { total: 0, top1: 0, top3: 0, diverged: 0 },
      Mid: { total: 0, top1: 0, top3: 0, diverged: 0 },
      Support: { total: 0, top1: 0, top3: 0, diverged: 0 },
      ADL: { total: 0, top1: 0, top3: 0, diverged: 0 },
    };

    const flaggedCases: CalibrationAnalysisReport['flaggedCases'] = [];

    let totalRatingSum = 0;
    const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const tagCountMap: Record<string, number> = {};

    let matchWins = 0;
    let matchLosses = 0;

    reviews.forEach((review) => {
      // Rating stats
      totalRatingSum += review.coachUtilityRating;
      ratingDist[review.coachUtilityRating] = (ratingDist[review.coachUtilityRating] || 0) + 1;
      review.coachFeedbackTags.forEach((tag) => {
        tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
      });

      // Match outcome (decoupled)
      if (review.winner === review.mcuSide) {
        matchWins++;
      } else if (review.winner !== 'draw' && review.winner !== 'undecided') {
        matchLosses++;
      }

      // Check review-level flags
      if (review.coachUtilityRating <= 2) {
        flaggedCases.push({
          turnId: `${review.id}_coach_low`,
          draftTitle: review.title,
          turnNumber: 0,
          heroChosen: 'ทั้งเกม (Overall Draft)',
          recommendedHero: 'คำแนะนำไม่ตรงสถานการณ์',
          divergenceReason: review.postGameNotes,
          issueType: 'low_coach_rating',
          details: `โค้ชประเมินความพึงพอใจเพียง ${review.coachUtilityRating}/5 ดาว (${review.coachUtilityVerdict}): ${review.postGameNotes}`,
        });
      }

      // Turn-level stats
      review.turns.forEach((turn) => {
        totalTurns++;

        if (turn.wasInTop1) top1Count++;
        if (turn.wasInTop3) top3Count++;
        if (turn.wasInTop5) top5Count++;
        if (!turn.chosenRank) unrankedCount++;

        if (turn.isDiverged) {
          divergedCount++;
          sumDivergedRank += turn.chosenRank || 6;
          if (turn.divergenceReasonCategory) {
            divergenceReasonMap[turn.divergenceReasonCategory] =
              (divergenceReasonMap[turn.divergenceReasonCategory] || 0) + 1;
          }
        }

        // Side breakdown
        const side = turn.team;
        if (sideBreakdown[side]) {
          sideBreakdown[side].total++;
          if (turn.wasInTop1) sideBreakdown[side].top1++;
          if (turn.wasInTop3) sideBreakdown[side].top3++;
          if (turn.isDiverged) sideBreakdown[side].diverged++;
        }

        // Stage breakdown
        const stage = turn.stage;
        if (stageBreakdown[stage]) {
          stageBreakdown[stage].total++;
          if (turn.wasInTop1) stageBreakdown[stage].top1++;
          if (turn.wasInTop3) stageBreakdown[stage].top3++;
          if (turn.isDiverged) stageBreakdown[stage].diverged++;
        }

        // Role breakdown
        const role = mapToCompRole(turn.targetRole || turn.chosenRole || '');
        if (role && roleBreakdown[role]) {
          roleBreakdown[role].total++;
          if (turn.wasInTop1) roleBreakdown[role].top1++;
          if (turn.wasInTop3) roleBreakdown[role].top3++;
          if (turn.isDiverged) roleBreakdown[role].diverged++;
        }

        // Detect flagged turns
        const top1Hero = turn.topSuggestions[0]?.heroName || 'Unknown';
        const hasLowSample = turn.topSuggestions.some((s) => s.hasLowSample);
        if (hasLowSample || (turn.flags && turn.flags.includes('low_sample'))) {
          flaggedCases.push({
            turnId: `${review.id}_t${turn.turnNumber}_sample`,
            draftTitle: review.title,
            turnNumber: turn.turnNumber,
            heroChosen: turn.chosenHeroName,
            recommendedHero: top1Hero,
            divergenceReason: turn.divergenceNotes,
            issueType: 'low_sample',
            details: `ฮีโร่แนะนำมีจำนวนเกมตัวอย่างในโปรลีกน้อย (< 5 เกม) มีความเสี่ยงต่อความแม่นยำ`,
          });
        }

        if (turn.flags && turn.flags.includes('coach_flagged_misleading')) {
          flaggedCases.push({
            turnId: `${review.id}_t${turn.turnNumber}_misleading`,
            draftTitle: review.title,
            turnNumber: turn.turnNumber,
            heroChosen: turn.chosenHeroName,
            recommendedHero: top1Hero,
            divergenceReason: turn.divergenceNotes,
            issueType: 'low_coach_rating',
            details: `โค้ชระบุว่าคำแนะนำไม่สอดคล้องกับเมต้าจริงหน้างาน: ${turn.divergenceNotes || ''}`,
          });
        }

        if (!turn.chosenRank && turn.phase === 'pick') {
          flaggedCases.push({
            turnId: `${review.id}_t${turn.turnNumber}_unranked`,
            draftTitle: review.title,
            turnNumber: turn.turnNumber,
            heroChosen: turn.chosenHeroName,
            recommendedHero: top1Hero,
            divergenceReason: turn.divergenceNotes,
            issueType: 'unranked_choice',
            details: `โค้ชเลือก ${turn.chosenHeroName} ซึ่งอยู่นอก Top 5 ที่ระบบแนะนำ (${turn.divergenceNotes || 'ไม่มีบันทึกเหตุผล'})`,
          });
        }
      });
    });

    const evaluated = Math.max(1, totalTurns);
    const top1Rate = Math.round((top1Count / evaluated) * 1000) / 10;
    const top3Rate = Math.round((top3Count / evaluated) * 1000) / 10;
    const top5Rate = Math.round((top5Count / evaluated) * 1000) / 10;
    const divergenceRate = Math.round((divergedCount / evaluated) * 1000) / 10;
    const avgRankWhenDiverged =
      divergedCount > 0 ? Math.round((sumDivergedRank / divergedCount) * 10) / 10 : 1;

    // Divergence reasons list
    const divergenceReasonList = Object.entries(divergenceReasonMap)
      .map(([k, count]) => {
        const cat = k as DivergenceReasonCategory;
        const pct = divergedCount > 0 ? Math.round((count / divergedCount) * 1000) / 10 : 0;
        return {
          reason: cat,
          label: DIVERGENCE_REASON_LABELS[cat] || cat,
          count,
          percentage: pct,
        };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);

    // Data readiness evaluation
    const totalDrafts = reviews.length;
    let sufficiencyTier: 'insufficient' | 'emerging' | 'robust' = 'insufficient';
    let sufficiencyMessage = '';

    if (totalDrafts < 5) {
      sufficiencyTier = 'insufficient';
      sufficiencyMessage = `ชุดข้อมูลตัวอย่างยังไม่เพียงพอ (${totalDrafts}/15 ดราฟต์) มีความแปรปรวนสูง แนะนำให้บันทึกผลซ้อมหรือผลแข่งเพิ่มอีกอย่างน้อย ${
        15 - totalDrafts
      } เกม ก่อนตัดสินใจปรับสูตรใน Production`;
    } else if (totalDrafts < 15) {
      sufficiencyTier = 'emerging';
      sufficiencyMessage = `ข้อมูลระดับเริ่มต้น (${totalDrafts}/15 ดราฟต์) พอเริ่มเห็นแนวโน้ม Alignment ของโค้ช แต่ผลทดสอบทางสถิติยังมีค่า Margin of Error สูง`;
    } else {
      sufficiencyTier = 'robust';
      sufficiencyMessage = `ข้อมูลมีความพร้อมทางสถิติ (${totalDrafts} ดราฟต์, ${totalTurns} เทิร์น) กลุ่มตัวอย่างเพียงพอต่อการวิเคราะห์และ Calibrate น้ำหนักสูตรคะแนน`;
    }

    // Helper for safe rate formatting
    const calcRates = (sub: { total: number; top1: number; top3: number; diverged: number }) => {
      const tot = Math.max(1, sub.total);
      return {
        total: sub.total,
        top1Rate: Math.round((sub.top1 / tot) * 1000) / 10,
        top3Rate: Math.round((sub.top3 / tot) * 1000) / 10,
        divergenceRate: Math.round((sub.diverged / tot) * 1000) / 10,
      };
    };

    const commonTags = Object.entries(tagCountMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    const totalMatches = Math.max(1, matchWins + matchLosses);
    const matchWr = Math.round((matchWins / totalMatches) * 1000) / 10;

    return {
      dataReadiness: {
        totalDrafts,
        totalTurns,
        sufficiencyTier,
        sufficiencyMessage,
        minRecommendedDrafts: 15,
      },
      hitRateMetrics: {
        top1Rate,
        top3Rate,
        top5Rate,
        totalEvaluated: totalTurns,
        top1Count,
        top3Count,
        top5Count,
        unrankedCount,
      },
      divergenceSummary: {
        divergenceRate,
        totalDiverged: divergedCount,
        byReason: divergenceReasonList,
        avgRankWhenDiverged,
      },
      breakdowns: {
        bySide: {
          blue: calcRates(sideBreakdown.blue),
          red: calcRates(sideBreakdown.red),
        },
        byStage: {
          phase1_ban: calcRates(stageBreakdown.phase1_ban),
          phase1_pick: calcRates(stageBreakdown.phase1_pick),
          phase2_ban: calcRates(stageBreakdown.phase2_ban),
          phase2_pick: calcRates(stageBreakdown.phase2_pick),
        },
        byRole: {
          DSL: calcRates(roleBreakdown.DSL),
          Jungle: calcRates(roleBreakdown.Jungle),
          Mid: calcRates(roleBreakdown.Mid),
          Support: calcRates(roleBreakdown.Support),
          ADL: calcRates(roleBreakdown.ADL),
        },
      },
      flaggedCases,
      coachUtilitySummary: {
        avgRating: reviews.length > 0 ? Math.round((totalRatingSum / reviews.length) * 10) / 10 : 5,
        distribution: ratingDist,
        commonTags,
      },
      decoupledMatchOutcome: {
        totalMatches: matchWins + matchLosses,
        winCount: matchWins,
        lossCount: matchLosses,
        winRate: matchWr,
        disclaimer:
          'ข้อควรระวัง: การประเมินคุณภาพคำแนะนำถูกแยกขาดจากผลแพ้ชนะในเกม เพราะชัยชนะขึ้นอยู่กับ In-Game Mechanics, Wave Macro, Teamfight Execution และสภาพจิตใจของผู้เล่น ไม่ควรนำผลแพ้ชนะเดี่ยวๆ มาตัดสินคุณภาพสูตรการดราฟต์',
      },
    };
  }
}

export const calibrationService = new CalibrationService();
