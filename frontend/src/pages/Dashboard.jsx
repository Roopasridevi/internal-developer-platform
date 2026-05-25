import { useQuery } from 'react-query';
import { projectService } from '../services/projectService';
import { deploymentService } from '../services/deploymentService';
import './Dashboard.css';

const Dashboard = () => {
  const { data: projects } = useQuery('projects', () =>
    projectService.getProjects({ limit: 5 })
  );

  const { data: deployments } = useQuery('recent-deployments', () =>
    deploymentService.getDeployments({ limit: 5 })
  );

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="dashboard-grid">
        <div className="card">
          <h2>Recent Projects</h2>
          <div className="list">
            {projects?.data?.projects?.map((project) => (
              <div key={project.id} className="list-item">
                <h3>{project.name}</h3>
                <p>{project.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Recent Deployments</h2>
          <div className="list">
            {deployments?.data?.deployments?.map((deployment) => (
              <div key={deployment.id} className="list-item">
                <h3>{deployment.environment}</h3>
                <span className={`status-badge ${deployment.status}`}>
                  {deployment.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
