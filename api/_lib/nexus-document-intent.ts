/** User utterance suggests revising canvas document content (use update_document). */

export function userSoundsLikeDocumentEditIntent(text: string): boolean {
  const u = text.trim();
  if (u.length < 6) return false;

  if (
    /\b(change|revise|edit|rewrite|shorten|expand|translate|update|rephrase|fix|tweak|adjust).{0,120}\b(paragraph|section|document|memo|draft|letter|report|canvas|above|below|that|this|it)\b/i.test(
      u,
    )
  ) {
    return true;
  }
  if (/\b(make it|turn it into|merge into|combine into).{0,50}\b(one paragraph|shorter|longer|simpler|clearer)\b/i.test(u)) {
    return true;
  }
  if (/\b(second|first|third|last|opening|closing)\s+paragraph\b/i.test(u)) return true;
  if (/\badd\s+(a\s+)?(paragraph|section|bullet|row)\b/i.test(u) && /\b(document|memo|draft|letter|report)\b/i.test(u)) {
    return true;
  }
  return false;
}
