import { useQuery, useMutation, useQueryClient } from 'react-query';
import { projectService } from '../services/projectService';

export const useProjects = (params = {}) => {
  return useQuery(['projects', params], () => projectService.getProjects(params));
};

export const useProject = (id) => {
  return useQuery(['project', id], () => projectService.getProjectById(id), {
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation(projectService.createProject, {
    onSuccess: () => {
      queryClient.invalidateQueries('projects');
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, data }) => projectService.updateProject(id, data),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['project', variables.id]);
        queryClient.invalidateQueries('projects');
      },
    }
  );
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation(projectService.deleteProject, {
    onSuccess: () => {
      queryClient.invalidateQueries('projects');
    },
  });
};
