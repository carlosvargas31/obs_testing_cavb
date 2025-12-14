import { createContext, ReactNode, useCallback, useState } from 'react';
import { Project } from '../model/project';

type ProjectcontextType = {
  projects: Project[];
  project: Project | undefined;
  loading: boolean;
  addProject: (newProject: Project) => void;
  deleteProject: (projectId: string) => void;
  updateProject: (updatedProject: Project) => void;
  removeProject: () => void;
};

const ProjectContext = createContext<ProjectcontextType>({
  projects: [],
  project: undefined,
  loading: false,
  addProject: () => {},
  deleteProject: () => {},
  updateProject: () => {},
  removeProject: () => {}
});

interface Props {
  children: ReactNode;
}

export function ProjectProvider({ children }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [loading] = useState<boolean>(false);

  const addProject = useCallback(
    (newProject: Project) => {
      setProjects((prevProjects) => {
        if (newProject._id && prevProjects.some((proj) => proj._id === newProject._id)) {
          return prevProjects.map((proj) =>
            proj._id === newProject._id ? { ...proj, ...newProject } : proj
          );
        }
        return [...prevProjects, newProject];
      });
      setProject(newProject);
    },
    []
  );

  const deleteProject = useCallback((projectId: string) => {
    setProjects((prevProjects) => prevProjects.filter((proj) => proj._id !== projectId));
    setProject((prevProject) => (prevProject?._id === projectId ? undefined : prevProject));
  }, []);

  const updateProject = useCallback((updatedProject: Project) => {
    setProjects((prevProjects) => {
      if (!updatedProject._id) {
        return prevProjects;
      }

      const exists = prevProjects.some((proj) => proj._id === updatedProject._id);
      if (!exists) {
        return prevProjects;
      }

      return prevProjects.map((proj) =>
        proj._id === updatedProject._id ? { ...proj, ...updatedProject } : proj
      );
    });

    setProject((prevProject) =>
      prevProject?._id === updatedProject._id ? { ...prevProject, ...updatedProject } : prevProject
    );
  }, []);

  const removeProject = useCallback(() => {
    setProject(undefined);
  }, []);


  return (
    <ProjectContext.Provider
      value={{ projects, project, loading, addProject, deleteProject, updateProject, removeProject }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export default ProjectContext;
