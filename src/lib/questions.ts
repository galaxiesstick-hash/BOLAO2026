import { isMatchLocked } from "@/lib/utils";

/** Default minutes before kickoff that a match-linked question locks. */
export const QUESTION_LOCK_MINUTES = 10;

type QuestionLockInput = {
  deadline?: Date | string | null;
  match?: { kickoff: Date | string; status?: string | null } | null;
};

/**
 * Effective answer deadline for a question:
 *   - linked to a match → locks together with the prediction (kickoff − 10 min)
 *   - standalone        → its own deadline (always set at creation)
 */
export function getQuestionDeadline(
  q: QuestionLockInput,
  lockMinutes = QUESTION_LOCK_MINUTES,
): Date | null {
  if (q.match?.kickoff) {
    return new Date(new Date(q.match.kickoff).getTime() - lockMinutes * 60 * 1000);
  }
  return q.deadline ? new Date(q.deadline) : null;
}

/**
 * Whether a question is currently locked for answers.
 * Match-linked questions also lock as soon as the match is LIVE/FINISHED.
 */
export function isQuestionLocked(
  q: QuestionLockInput,
  lockMinutes = QUESTION_LOCK_MINUTES,
): boolean {
  if (q.match?.kickoff) {
    if (q.match.status === "LIVE" || q.match.status === "FINISHED") return true;
    return isMatchLocked(q.match.kickoff, lockMinutes);
  }
  const dl = q.deadline ? new Date(q.deadline) : null;
  return dl !== null && Date.now() >= dl.getTime();
}
