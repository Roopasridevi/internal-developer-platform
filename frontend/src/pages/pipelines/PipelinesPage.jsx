import { useQuery } from 'react-query';
import { pipelineService } from '../../services/pipelineService';

const PipelinesPage = () => {
  const { data, isLoading } = useQuery('pipelines', () =>
    pipelineService.getPipelines({})
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="pipelines-page">
      <h1>CI/CD Pipelines</h1>
      <div className="pipelines-list">
        {data?.data?.pipelines?.map((pipeline) => (
          <div key={pipeline.id} className="pipeline-card">
            <h3>{pipeline.name}</h3>
            <p>{pipeline.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PipelinesPage;
