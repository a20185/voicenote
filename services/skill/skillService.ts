import type { Skill } from '@/types/settings';

const SKILL_TIMEOUT = 15000;

export function isValidSkillUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'skills.sh' && parsed.pathname.split('/').filter(Boolean).length >= 3;
  } catch {
    return false;
  }
}

function toRawGitHubUrl(skillUrl: string): string {
  const parsed = new URL(skillUrl);
  const parts = parsed.pathname.split('/').filter(Boolean);
  const [org, repo, ...rest] = parts;
  const skillPath = rest.join('/');
  return `https://raw.githubusercontent.com/${org}/${repo}/main/${skillPath}/SKILL.md`;
}

export async function loadSkill(url: string): Promise<Omit<Skill, 'id'>> {
  if (!isValidSkillUrl(url)) {
    throw new Error('Invalid skill URL format');
  }

  const rawUrl = toRawGitHubUrl(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SKILL_TIMEOUT);

  try {
    const response = await fetch(rawUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Failed to load skill: ${response.status}`);
    }

    const content = await response.text();
    const nameMatch = content.match(/^#\s+(.+)/m);
    const descMatch = content.match(/^>\s*(.+)/m) || content.match(/\n\n(.+?)(?:\n|$)/);

    return {
      name: nameMatch?.[1] || url.split('/').pop() || 'Unknown Skill',
      url,
      description: descMatch?.[1] || '',
      status: 'loaded',
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Skill loading timed out', { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function reloadSkill(skill: Skill): Promise<Partial<Skill>> {
  try {
    const loaded = await loadSkill(skill.url);
    return { ...loaded, status: 'loaded', error: undefined };
  } catch (error: any) {
    return { status: 'error', error: error.message };
  }
}
