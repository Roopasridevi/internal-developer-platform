import { useQuery, useMutation, useQueryClient } from 'react-query';
import { deploymentService } from '../services/deploymentService';

export const useDeployments = (params = {}) => {
  return useQuery(['deployments', params], () => deploymentService.getDeployments(params));
};

export const useDeployment = (id) => {
  return useQuery(['deployment', id], () => deploymentService.getDeploymentById(id), {
    enabled: !!id,
  });
};

export const useCreateDeployment = () => {
  const queryClient = useQueryClient();
  
  return useMutation(deploymentService.createDeployment, {
    onSuccess: () => {
      queryClient.invalidateQueries('deployments');
    },
  });
};

export const useRollbackDeployment = () => {
  const queryClient = useQueryClient();
  
  return useMutation(deploymentService.rollbackDeployment, {
    onSuccess: () => {
      queryClient.invalidateQueries('deployments');
    },
  });
};
