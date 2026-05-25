import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import './Projects.css';

const ProjectsPage = () => {
  const { data, isLoading } = useQuery('projects', () =>
    projectService.getProjects({})
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="projects-page">
      <div className="page-header">
        <h1>Projects</h1>
        <Link to="/projects/new" className="btn-primary">
          Create Project
        </Link>
      </div>

      <div className="projects-grid">
        {data?.data?.projects?.map((project) => (
          <Link key={project.id} to={`/projects/${project.id}`} className="project-card">
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <span className={`status-badge ${project.status}`}>{project.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProjectsPage;
