import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectCard from '../ProjectCard';
import { Project } from '../../../model/project';

// Mock useAuth hook
jest.mock('../../../hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    user: { id: 'user-123', name: 'Test User' }
  }))
}));

// Mock useToggle hook
jest.mock('../../../hooks/useToogle', () => ({
  __esModule: true,
  default: jest.fn((initialValue: boolean) => {
    const [state, setState] = React.useState(initialValue);
    return [state, () => setState(!state)];
  })
}));

// Mock the code icon
jest.mock('../code.svg', () => 'mocked-code-icon.svg');

describe('ProjectCard Component', () => {
  const mockProject: Project = {
    _id: 'proj-123',
    title: 'Test Project',
    description: 'This is a test project',
    link: 'https://example.com/project',
    version: 'v1.0.0',
    tag: 'React',
    timestamp: 1234567890
  };

  const mockCloseButton = jest.fn();
  const mockUpdateButton = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders project title correctly', () => {
    render(
      <ProjectCard
        project={mockProject}
        closeButton={mockCloseButton}
        updateButton={mockUpdateButton}
      />
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  test('renders project description and version', () => {
    render(
      <ProjectCard
        project={mockProject}
        closeButton={mockCloseButton}
        updateButton={mockUpdateButton}
      />
    );

    expect(screen.getByText('This is a test project')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  test('renders caption text when provided', () => {
    render(
      <ProjectCard
        project={mockProject}
        closeButton={mockCloseButton}
        updateButton={mockUpdateButton}
        captionText="Project Caption"
      />
    );

    const caption = screen.getByTestId('caption');
    expect(caption).toHaveTextContent('Project Caption');
  });

  test('renders project tag correctly', () => {
    render(
      <ProjectCard
        project={mockProject}
        closeButton={mockCloseButton}
        updateButton={mockUpdateButton}
      />
    );

    expect(screen.getByText('React')).toBeInTheDocument();
  });

  test('calls updateButton when Update menu item is clicked', () => {
    const { container } = render(
      <ProjectCard
        project={mockProject}
        closeButton={mockCloseButton}
        updateButton={mockUpdateButton}
      />
    );

    // Find and click kebab button
    const kebabButton = container.querySelector('button');
    fireEvent.click(kebabButton!);

    // Click update button
    const updateMenuItem = screen.getByText('Update');
    fireEvent.click(updateMenuItem);

    expect(mockUpdateButton).toHaveBeenCalledWith(expect.any(Object), mockProject);
  });

  test('calls closeButton when Delete menu item is clicked', () => {
    const { container } = render(
      <ProjectCard
        project={mockProject}
        closeButton={mockCloseButton}
        updateButton={mockUpdateButton}
      />
    );

    // Find and click kebab button
    const kebabButton = container.querySelector('button');
    fireEvent.click(kebabButton!);

    // Click delete button
    const deleteMenuItem = screen.getByText('Delete');
    fireEvent.click(deleteMenuItem);

    expect(mockCloseButton).toHaveBeenCalledWith(expect.any(Object), 'proj-123');
  });
});
