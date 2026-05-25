import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { pipelineService } from '../../services/pipelineService';

const PipelineDetailPage = () => {
  const { id } = useParams();
  const { data } = useQuery(['pipeline', id], () =>
    pipelineService.getPipelineById(id)
  );

  return (
    <div className="pipeline-detail">
      <h1>{data?.data?.name}</h1>
      <p>{data?.data?.description}</p>
    </div>
  );
};

export default PipelineDetailPage;
