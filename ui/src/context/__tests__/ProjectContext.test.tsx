import { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { ProjectProvider } from '../ProjectContext';
import useProject from '../../hooks/useProject';
import { Project } from '../../model/project';

function wrapper({ children }: { children: ReactNode }) {
  return <ProjectProvider>{children}</ProjectProvider>;
}

function createProject(overrides: Partial<Project> = {}): Project {
  return {
    _id: 'project-1',
    title: 'Test Project',
    description: 'Description',
    version: '1.0.0',
    link: 'https://example.com',
    tag: 'tag',
    timestamp: Date.now(),
    ...overrides
  };
}

describe('ProjectContext', () => {
  it('starts with empty projects and loading false', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    expect(result.current.projects).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('adds a project to state when addProject is called', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    const project = createProject();

    act(() => result.current.addProject(project));

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0]).toMatchObject(project);
  });

  it('removes a project when deleteProject is called', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    const project = createProject();

    act(() => result.current.addProject(project));
    act(() => result.current.deleteProject(project._id || ''));

    expect(result.current.projects).toHaveLength(0);
  });

  it('updates a project with new data', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    const project = createProject({ _id: 'project-1', title: 'Old Title' });
    const updated = { ...project, title: 'New Title', version: '2.0.0' };

    act(() => result.current.addProject(project));
    act(() => result.current.updateProject(updated));

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0]).toMatchObject(updated);
  });

  it('overwrites an existing project when addProject is called with same id', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    const original = createProject({ _id: 'dup', title: 'Original' });
    const replacement = createProject({ _id: 'dup', title: 'Replaced' });

    act(() => result.current.addProject(original));
    act(() => result.current.addProject(replacement));

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0].title).toBe('Replaced');
  });

  it('ignores updateProject when updatedProject has no _id', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    const project = createProject({ _id: 'with-id', title: 'Keep' });

    act(() => result.current.addProject(project));
    act(() => result.current.updateProject({ title: 'No Id' } as any));

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0].title).toBe('Keep');
  });

  it('ignores updateProject when project does not exist', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    const project = createProject({ _id: 'existing', title: 'Existing' });

    act(() => result.current.addProject(project));
    act(() => result.current.updateProject({ ...project, _id: 'missing', title: 'No-op' }));

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0].title).toBe('Existing');
  });

  it('does not throw when deleting a non-existent project', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    const project = createProject();

    act(() => result.current.addProject(project));

    expect(() => act(() => result.current.deleteProject('missing-id'))).not.toThrow();
    expect(result.current.projects).toHaveLength(1);
  });
});
