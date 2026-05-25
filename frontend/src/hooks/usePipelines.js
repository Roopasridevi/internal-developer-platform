import { useQuery, useMutation, useQueryClient } from 'react-query';
import { pipelineService } from '../services/pipelineService';

export const usePipelines = (params = {}) => {
  return useQuery(['pipelines', params], () => pipelineService.getPipelines(params));
};

export const usePipeline = (id) => {
  return useQuery(['pipeline', id], () => pipelineService.getPipelineById(id), {
    enabled: !!id,
  });
};

export const useExecutePipeline = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, params }) => pipelineService.executePipeline(id, params),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['pipeline', variables.id]);
      },
    }
  );
};
