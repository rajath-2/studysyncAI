// frontend/src/services/compatibility.ts

export interface UserPreferences {
  subjects: Array<{ name: string; level: string }>;
  availability: { preset: string[] };
  learning_style?: string;
  study_format?: string;
}

export interface Group {
  id: string;
  name: string;
  subject: string;
  study_format?: string;
  session_timing?: string[];
  meeting_frequency?: number;
}

export function calculateCompatibilityScore(
  userPrefs: UserPreferences,
  group: Group,
  memberPrefs: UserPreferences[]
): number {
  // Subject Match (40 points max)
  const userSubjects = userPrefs.subjects?.map(s => s.name) || [];
  const subjectMatch = userSubjects.includes(group.subject) ? 40 : 0;

  // Availability Overlap (30 points max)
  const userAvailability = userPrefs.availability?.preset || [];
  const groupTiming = group.session_timing || [];
  let availabilityOverlap = 0;
  if (userAvailability.length > 0 && groupTiming.length > 0) {
    const matched = userAvailability.filter(slot => groupTiming.includes(slot)).length;
    availabilityOverlap = (matched / userAvailability.length) * 30;
  }

  // Format Match (15 points max)
  const userFormat = userPrefs.study_format || 'virtual';
  const groupFormat = group.study_format || 'virtual';
  let formatMatch = 0;
  if (userFormat === groupFormat) {
    formatMatch = 15;
  } else if (groupFormat === 'hybrid' || userFormat === 'hybrid') {
    formatMatch = 7.5;
  }

  // Member Alignment (15 points max)
  let memberAlignment = 0;
  if (memberPrefs.length > 0) {
    const scores = memberPrefs.map(member => {
      let score = 0;
      // Learning style match
      if (userPrefs.learning_style && member.learning_style === userPrefs.learning_style) {
        score += 5;
      }
      // Availability overlap
      const memberAvail = member.availability?.preset || [];
      const overlap = userAvailability.filter(slot => memberAvail.includes(slot)).length;
      if (userAvailability.length > 0) {
        score += (overlap / userAvailability.length) * 5;
      }
      return score;
    });
    memberAlignment = scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  return Math.min(subjectMatch + availabilityOverlap + formatMatch + memberAlignment, 100);
}

export function getCompatibilityColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
}

export function getCompatibilityLabel(score: number): string {
  if (score >= 80) return 'Great Match';
  if (score >= 60) return 'Good Match';
  return 'Fair Match';
}

export function getCompatibilityBadgeClass(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-700 border-green-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-red-100 text-red-700 border-red-200';
}