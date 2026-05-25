import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { projectService } from '../../services/projectService';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const { data, isLoading } = useQuery(['project', id], () =>
    projectService.getProjectById(id)
  );

  if (isLoading) return <div>Loading...</div>;

  const project = data?.data;

  return (
    <div className="project-detail">
      <h1>{project?.name}</h1>
      <p>{project?.description}</p>
      <div className="project-info">
        <div>
          <strong>Status:</strong> {project?.status}
        </div>
        <div>
          <strong>Repository:</strong> {project?.repositoryUrl}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
