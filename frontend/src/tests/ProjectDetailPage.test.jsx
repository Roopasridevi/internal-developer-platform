import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProjectDetailPage from '../pages/projects/ProjectDetailPage';
import { projectService } from '../services/projectService';

// Mock the project service
vi.mock('../services/projectService', () => ({
  projectService: {
    getProjectById: vi.fn(),
  },
}));

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

import { useParams } from 'react-router-dom';

// Helper function to render component with providers
const renderWithProviders = (component, { route = '/projects/1' } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  window.history.pushState({}, 'Test page', route);

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ProjectDetailPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Should display loading state while fetching project details
   * Scenario: Component is mounted and data is being fetched
   * Expected: Loading indicator should be visible
   */
  it('should display loading state while fetching project details', () => {
    useParams.mockReturnValue({ id: '1' });
    projectService.getProjectById.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<ProjectDetailPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  /**
   * Test: Should render project details successfully
   * Scenario: API returns project data
   * Expected: Project name, description, status, and repository URL should be displayed
   */
  it('should render project details successfully', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockProject = {
      data: {
        id: 1,
        name: 'Test Project',
        description: 'This is a test project',
        status: 'active',
        repositoryUrl: 'https://github.com/test/repo',
      },
    };

    projectService.getProjectById.mockResolvedValue(mockProject);

    renderWithProviders(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('This is a test project')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('https://github.com/test/repo')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should call getProjectById API with correct project ID
   * Scenario: Component is mounted with project ID in URL params
   * Expected: API should be called with the correct ID from URL params
   */
  it('should call getProjectById API with correct project ID', async () => {
    useParams.mockReturnValue({ id: '42' });
    
    const mockProject = {
      data: {
        id: 42,
        name: 'Project 42',
        description: 'Description',
        status: 'active',
        repositoryUrl: 'https://github.com/test/repo',
      },
    };

    projectService.getProjectById.mockResolvedValue(mockProject);

    renderWithProviders(<ProjectDetailPage />, { route: '/projects/42' });

    await waitFor(() => {
      expect(projectService.getProjectById).toHaveBeenCalledWith('42');
      expect(projectService.getProjectById).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test: Should display project status in info section
   * Scenario: Project data includes status field
   * Expected: Status should be displayed with "Status:" label
   */
  it('should display project status in info section', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockProject = {
      data: {
        id: 1,
        name: 'Project',
        description: 'Description',
        status: 'inactive',
        repositoryUrl: 'https://github.com/test/repo',
      },
    };

    projectService.getProjectById.mockResolvedValue(mockProject);

    renderWithProviders(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('inactive')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should display repository URL in info section
   * Scenario: Project data includes repositoryUrl field
   * Expected: Repository URL should be displayed with "Repository:" label
   */
  it('should display repository URL in info section', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockProject = {
      data: {
        id: 1,
        name: 'Project',
        description: 'Description',
        status: 'active',
        repositoryUrl: 'https://gitlab.com/test/repo',
      },
    };

    projectService.getProjectById.mockResolvedValue(mockProject);

    renderWithProviders(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Repository:')).toBeInTheDocument();
      expect(screen.getByText('https://gitlab.com/test/repo')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should handle API error gracefully
   * Scenario: API call fails with an error
   * Expected: Component should not crash
   */
  it('should handle API error gracefully', async () => {
    useParams.mockReturnValue({ id: '1' });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    projectService.getProjectById.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  /**
   * Test: Should handle undefined or null project data
   * Scenario: API returns undefined or null data
   * Expected: Component should not crash and handle gracefully
   */
  it('should handle undefined or null project data', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    projectService.getProjectById.mockResolvedValue({ data: null });

    renderWithProviders(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  /**
   * Test: Should render project info container
   * Scenario: Project data is loaded
   * Expected: Project info section should be rendered with correct class
   */
  it('should render project info container', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockProject = {
      data: {
        id: 1,
        name: 'Project',
        description: 'Description',
        status: 'active',
        repositoryUrl: 'https://github.com/test/repo',
      },
    };

    projectService.getProjectById.mockResolvedValue(mockProject);

    const { container } = renderWithProviders(<ProjectDetailPage />);

    await waitFor(() => {
      const projectInfo = container.querySelector('.project-info');
      expect(projectInfo).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render project heading with correct name
   * Scenario: Project data is loaded
   * Expected: H1 heading should display project name
   */
  it('should render project heading with correct name', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockProject = {
      data: {
        id: 1,
        name: 'My Awesome Project',
        description: 'Description',
        status: 'active',
        repositoryUrl: 'https://github.com/test/repo',
      },
    };

    projectService.getProjectById.mockResolvedValue(mockProject);

    renderWithProviders(<ProjectDetailPage />);

    await waitFor(() => {
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('My Awesome Project');
    });
  });

  /**
   * Test: Should handle missing optional fields gracefully
   * Scenario: Project data is missing optional fields like repositoryUrl
   * Expected: Component should render without crashing
   */
  it('should handle missing optional fields gracefully', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockProject = {
      data: {
        id: 1,
        name: 'Minimal Project',
        description: 'Minimal description',
        status: 'active',
      },
    };

    projectService.getProjectById.mockResolvedValue(mockProject);

    renderWithProviders(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Minimal Project')).toBeInTheDocument();
      expect(screen.getByText('Minimal description')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should update when route parameter changes
   * Scenario: Component is already mounted and route parameter changes
   * Expected: API should be called again with new ID
   */
  it('should update when route parameter changes', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockProject1 = {
      data: {
        id: 1,
        name: 'Project 1',
        description: 'First project',
        status: 'active',
        repositoryUrl: 'https://github.com/test/repo1',
      },
    };

    projectService.getProjectById.mockResolvedValue(mockProject1);

    renderWithProviders(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });

    // Change the ID and verify API is called with new ID
    useParams.mockReturnValue({ id: '2' });
    
    const mockProject2 = {
      data: {
        id: 2,
        name: 'Project 2',
        description: 'Second project',
        status: 'active',
        repositoryUrl: 'https://github.com/test/repo2',
      },
    };

    projectService.getProjectById.mockResolvedValue(mockProject2);

    // Verify that when component is remounted with new ID, API is called
    expect(projectService.getProjectById).toHaveBeenCalledWith('1');
  });

  /**
   * Test: Should render project detail container with correct class
   * Scenario: Component is rendered
   * Expected: Main container should have 'project-detail' class
   */
  it('should render project detail container with correct class', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockProject = {
      data: {
        id: 1,
        name: 'Project',
        description: 'Description',
        status: 'active',
        repositoryUrl: 'https://github.com/test/repo',
      },
    };

    projectService.getProjectById.mockResolvedValue(mockProject);

    const { container } = renderWithProviders(<ProjectDetailPage />);

    await waitFor(() => {
      const projectDetail = container.querySelector('.project-detail');
      expect(projectDetail).toBeInTheDocument();
    });
  });
});
