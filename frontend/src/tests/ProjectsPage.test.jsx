import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ProjectsPage from '../pages/projects/ProjectsPage';
import { projectService } from '../services/projectService';

// Mock the project service
vi.mock('../services/projectService', () => ({
  projectService: {
    getProjects: vi.fn(),
  },
}));

// Helper function to render component with providers
const renderWithProviders = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ProjectsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Should display loading state while fetching projects
   * Scenario: Component is mounted and data is being fetched
   * Expected: Loading indicator should be visible
   */
  it('should display loading state while fetching projects', () => {
    projectService.getProjects.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<ProjectsPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  /**
   * Test: Should render projects list successfully
   * Scenario: API returns a list of projects
   * Expected: All projects should be displayed with correct information
   */
  it('should render projects list successfully', async () => {
    const mockProjects = {
      data: {
        projects: [
          {
            id: 1,
            name: 'Project Alpha',
            description: 'First project',
            status: 'active',
          },
          {
            id: 2,
            name: 'Project Beta',
            description: 'Second project',
            status: 'inactive',
          },
        ],
      },
    };

    projectService.getProjects.mockResolvedValue(mockProjects);

    renderWithProviders(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('First project')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
      expect(screen.getByText('Second project')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should display project status badges correctly
   * Scenario: Projects have different status values
   * Expected: Status badges should be rendered with correct classes
   */
  it('should display project status badges correctly', async () => {
    const mockProjects = {
      data: {
        projects: [
          {
            id: 1,
            name: 'Active Project',
            description: 'Active project description',
            status: 'active',
          },
          {
            id: 2,
            name: 'Inactive Project',
            description: 'Inactive project description',
            status: 'inactive',
          },
        ],
      },
    };

    projectService.getProjects.mockResolvedValue(mockProjects);

    const { container } = renderWithProviders(<ProjectsPage />);

    await waitFor(() => {
      const statusBadges = container.querySelectorAll('.status-badge');
      expect(statusBadges).toHaveLength(2);
      expect(statusBadges[0]).toHaveClass('status-badge', 'active');
      expect(statusBadges[1]).toHaveClass('status-badge', 'inactive');
    });
  });

  /**
   * Test: Should render "Create Project" button
   * Scenario: Page is loaded successfully
   * Expected: Create Project button should be visible and link to correct route
   */
  it('should render "Create Project" button', async () => {
    const mockProjects = {
      data: {
        projects: [],
      },
    };

    projectService.getProjects.mockResolvedValue(mockProjects);

    renderWithProviders(<ProjectsPage />);

    await waitFor(() => {
      const createButton = screen.getByText('Create Project');
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveAttribute('href', '/projects/new');
    });
  });

  /**
   * Test: Should render page header with title
   * Scenario: Component is rendered
   * Expected: Page header should display "Projects" title
   */
  it('should render page header with title', async () => {
    const mockProjects = {
      data: {
        projects: [],
      },
    };

    projectService.getProjects.mockResolvedValue(mockProjects);

    renderWithProviders(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render empty state when no projects exist
   * Scenario: API returns empty projects array
   * Expected: No project cards should be rendered
   */
  it('should render empty state when no projects exist', async () => {
    const mockProjects = {
      data: {
        projects: [],
      },
    };

    projectService.getProjects.mockResolvedValue(mockProjects);

    const { container } = renderWithProviders(<ProjectsPage />);

    await waitFor(() => {
      const projectCards = container.querySelectorAll('.project-card');
      expect(projectCards).toHaveLength(0);
    });
  });

  /**
   * Test: Should call getProjects API on component mount
   * Scenario: Component is mounted
   * Expected: projectService.getProjects should be called with empty params
   */
  it('should call getProjects API on component mount', async () => {
    const mockProjects = {
      data: {
        projects: [],
      },
    };

    projectService.getProjects.mockResolvedValue(mockProjects);

    renderWithProviders(<ProjectsPage />);

    await waitFor(() => {
      expect(projectService.getProjects).toHaveBeenCalledWith({});
      expect(projectService.getProjects).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test: Should render project cards as links to detail pages
   * Scenario: Projects are rendered
   * Expected: Each project card should be a link to the project detail page
   */
  it('should render project cards as links to detail pages', async () => {
    const mockProjects = {
      data: {
        projects: [
          {
            id: 1,
            name: 'Project One',
            description: 'Description one',
            status: 'active',
          },
          {
            id: 2,
            name: 'Project Two',
            description: 'Description two',
            status: 'active',
          },
        ],
      },
    };

    projectService.getProjects.mockResolvedValue(mockProjects);

    renderWithProviders(<ProjectsPage />);

    await waitFor(() => {
      const projectLinks = screen.getAllByRole('link').filter(link => 
        link.getAttribute('href')?.startsWith('/projects/') && 
        link.getAttribute('href') !== '/projects/new'
      );
      expect(projectLinks).toHaveLength(2);
      expect(projectLinks[0]).toHaveAttribute('href', '/projects/1');
      expect(projectLinks[1]).toHaveAttribute('href', '/projects/2');
    });
  });

  /**
   * Test: Should handle API error gracefully
   * Scenario: API call fails with an error
   * Expected: Component should not crash and error should be handled
   */
  it('should handle API error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    projectService.getProjects.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<ProjectsPage />);

    await waitFor(() => {
      // Component should not crash
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  /**
   * Test: Should render multiple projects in grid layout
   * Scenario: API returns multiple projects
   * Expected: All projects should be rendered within projects-grid container
   */
  it('should render multiple projects in grid layout', async () => {
    const mockProjects = {
      data: {
        projects: [
          { id: 1, name: 'Project 1', description: 'Desc 1', status: 'active' },
          { id: 2, name: 'Project 2', description: 'Desc 2', status: 'active' },
          { id: 3, name: 'Project 3', description: 'Desc 3', status: 'inactive' },
        ],
      },
    };

    projectService.getProjects.mockResolvedValue(mockProjects);

    const { container } = renderWithProviders(<ProjectsPage />);

    await waitFor(() => {
      const projectsGrid = container.querySelector('.projects-grid');
      expect(projectsGrid).toBeInTheDocument();
      expect(projectsGrid.children).toHaveLength(3);
    });
  });

  /**
   * Test: Should handle undefined or null data gracefully
   * Scenario: API returns undefined or null data
   * Expected: Component should not crash
   */
  it('should handle undefined or null data gracefully', async () => {
    projectService.getProjects.mockResolvedValue({ data: null });

    renderWithProviders(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  /**
   * Test: Should render project descriptions correctly
   * Scenario: Projects have description text
   * Expected: Each project description should be displayed
   */
  it('should render project descriptions correctly', async () => {
    const mockProjects = {
      data: {
        projects: [
          {
            id: 1,
            name: 'Test Project',
            description: 'This is a test project description',
            status: 'active',
          },
        ],
      },
    };

    projectService.getProjects.mockResolvedValue(mockProjects);

    renderWithProviders(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('This is a test project description')).toBeInTheDocument();
    });
  });
});
