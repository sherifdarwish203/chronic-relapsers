// Client-side risk calculation (mirrors server-side logic)

export function calculateRiskScore(
  category: string,
  categoryData: Record<string, any>
): { score: number; level: 'low' | 'medium' | 'high' | 'critical' } {
  let score = 50;

  switch (category) {
    case 'people': {
      score = 50;
      if (categoryData.usage_relationship === 'together' || categoryData.usage_relationship === 'dealer') {
        score += 15;
      }
      if (categoryData.current_contact_status === 'in_contact') {
        score += 20;
      }
      if (categoryData.contact_frequency === 'daily') {
        score += 15;
      }
      if (categoryData.phone_number) {
        score += 10;
      }
      break;
    }
    case 'places': {
      score = 40;
      if (categoryData.avoidability === 'impossible') {
        score += 20;
      } else if (categoryData.avoidability === 'difficult') {
        score += 10;
      }
      if (categoryData.current_frequency === 'daily' || categoryData.current_frequency === 'weekly') {
        score += 15;
      }
      if (categoryData.alternative_routes === true) {
        score -= 10;
      }
      break;
    }
    case 'situations': {
      score = 45;
      if (!categoryData.alternative_plan) {
        score += 15;
      }
      if (categoryData.current_coping && categoryData.current_coping.toLowerCase().includes('مادة')) {
        score += 10;
      }
      break;
    }
    case 'habits': {
      score = 35;
      if (categoryData.what_triggers && categoryData.what_triggers.toLowerCase().includes('مادة')) {
        score += 20;
      }
      if (!categoryData.can_replace_with) {
        score += 15;
      }
      break;
    }
    case 'instruments': {
      score = 60;
      if (categoryData.removed_access !== true) {
        score += 20;
      }
      if (categoryData.ease_of_access === 'easy') {
        score += 15;
      }
      break;
    }
    case 'emotions': {
      score = 50;
      if (!categoryData.healthy_strategy) {
        score += 20;
      }
      if (!categoryData.current_coping) {
        score += 10;
      }
      break;
    }
    case 'thoughts': {
      score = 55;
      if (!categoryData.counter_argument) {
        score += 20;
      }
      if (categoryData.frequency_strength) {
        score += Math.min(categoryData.frequency_strength * 5, 50);
      }
      break;
    }
  }

  score = Math.min(score, 100);
  score = Math.max(score, 0);

  let level: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (score <= 30) {
    level = 'low';
  } else if (score <= 60) {
    level = 'medium';
  } else if (score <= 85) {
    level = 'high';
  } else {
    level = 'critical';
  }

  return { score, level };
}
