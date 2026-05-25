import { useQuery } from 'react-query';
import { deploymentService } from '../../services/deploymentService';

const DeploymentsPage = () => {
  const { data, isLoading } = useQuery('deployments', () =>
    deploymentService.getDeployments({})
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="deployments-page">
      <h1>Deployments</h1>
      <div className="deployments-list">
        {data?.data?.deployments?.map((deployment) => (
          <div key={deployment.id} className="deployment-card">
            <h3>{deployment.environment}</h3>
            <p>Version: {deployment.version}</p>
            <span className={`status-badge ${deployment.status}`}>
              {deployment.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeploymentsPage;
