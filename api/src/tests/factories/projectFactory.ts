import { ProjectPayload } from '@/tests/fixtures/projects';

let counter = 0;

export function resetProjectFactory(): void {
  counter = 0;
}

export function buildProject(overrides?: Partial<ProjectPayload>): ProjectPayload {
  counter += 1;
  const base: ProjectPayload = {
    title: `Project ${counter}`,
    description: `Description ${counter}`,
    version: `1.0.${counter}`,
    link: `https://example.com/p${counter}`,
    tag: `tag${counter}`,
    timestamp: Date.now() + counter
  };
  return { ...base, ...(overrides || {}) };
}

export function buildProjects(count: number): ProjectPayload[] {
  return Array.from({ length: count }, () => buildProject());
}
