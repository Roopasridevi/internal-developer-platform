import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { deploymentService } from '../../services/deploymentService';

const DeploymentDetailPage = () => {
  const { id } = useParams();
  const { data } = useQuery(['deployment', id], () =>
    deploymentService.getDeploymentById(id)
  );

  return (
    <div className="deployment-detail">
      <h1>Deployment: {data?.data?.environment}</h1>
      <p>Version: {data?.data?.version}</p>
      <p>Status: {data?.data?.status}</p>
    </div>
  );
};

export default DeploymentDetailPage;
