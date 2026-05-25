import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import DeploymentsPage from '../pages/deployments/DeploymentsPage';
import { deploymentService } from '../services/deploymentService';

// Mock the deployment service
vi.mock('../services/deploymentService', () => ({
  deploymentService: {
    getDeployments: vi.fn(),
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

describe('DeploymentsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Should display loading state while fetching deployments
   * Scenario: Component is mounted and data is being fetched
   * Expected: Loading indicator should be visible
   */
  it('should display loading state while fetching deployments', () => {
    deploymentService.getDeployments.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<DeploymentsPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  /**
   * Test: Should render deployments list successfully
   * Scenario: API returns a list of deployments
   * Expected: All deployments should be displayed with correct information
   */
  it('should render deployments list successfully', async () => {
    const mockDeployments = {
      data: {
        deployments: [
          {
            id: 1,
            environment: 'production',
            version: 'v1.2.3',
            status: 'success',
          },
          {
            id: 2,
            environment: 'staging',
            version: 'v1.2.4',
            status: 'pending',
          },
        ],
      },
    };

    deploymentService.getDeployments.mockResolvedValue(mockDeployments);

    renderWithProviders(<DeploymentsPage />);

    await waitFor(() => {
      expect(screen.getByText('production')).toBeInTheDocument();
      expect(screen.getByText('Version: v1.2.3')).toBeInTheDocument();
      expect(screen.getByText('staging')).toBeInTheDocument();
      expect(screen.getByText('Version: v1.2.4')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render page heading
   * Scenario: Component is rendered
   * Expected: "Deployments" heading should be displayed
   */
  it('should render page heading', async () => {
    const mockDeployments = {
      data: {
        deployments: [],
      },
    };

    deploymentService.getDeployments.mockResolvedValue(mockDeployments);

    renderWithProviders(<DeploymentsPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Deployments' })).toBeInTheDocument();
    });
  });

  /**
   * Test: Should display deployment status badges correctly
   * Scenario: Deployments have different status values
   * Expected: Status badges should be rendered with correct classes
   */
  it('should display deployment status badges correctly', async () => {
    const mockDeployments = {
      data: {
        deployments: [
          {
            id: 1,
            environment: 'production',
            version: 'v1.0.0',
            status: 'success',
          },
          {
            id: 2,
            environment: 'staging',
            version: 'v1.1.0',
            status: 'failed',
          },
        ],
      },
    };

    deploymentService.getDeployments.mockResolvedValue(mockDeployments);

    const { container } = renderWithProviders(<DeploymentsPage />);

    await waitFor(() => {
      const statusBadges = container.querySelectorAll('.status-badge');
      expect(statusBadges).toHaveLength(2);
      expect(statusBadges[0]).toHaveClass('status-badge', 'success');
      expect(statusBadges[1]).toHaveClass('status-badge', 'failed');
    });
  });

  /**
   * Test: Should call getDeployments API on component mount
   * Scenario: Component is mounted
   * Expected: deploymentService.getDeployments should be called with empty params
   */
  it('should call getDeployments API on component mount', async () => {
    const mockDeployments = {
      data: {
        deployments: [],
      },
    };

    deploymentService.getDeployments.mockResolvedValue(mockDeployments);

    renderWithProviders(<DeploymentsPage />);

    await waitFor(() => {
      expect(deploymentService.getDeployments).toHaveBeenCalledWith({});
      expect(deploymentService.getDeployments).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test: Should render empty state when no deployments exist
   * Scenario: API returns empty deployments array
   * Expected: No deployment cards should be rendered
   */
  it('should render empty state when no deployments exist', async () => {
    const mockDeployments = {
      data: {
        deployments: [],
      },
    };

    deploymentService.getDeployments.mockResolvedValue(mockDeployments);

    const { container } = renderWithProviders(<DeploymentsPage />);

    await waitFor(() => {
      const deploymentCards = container.querySelectorAll('.deployment-card');
      expect(deploymentCards).toHaveLength(0);
    });
  });

  /**
   * Test: Should render multiple deployments
   * Scenario: API returns multiple deployments
   * Expected: All deployments should be rendered as cards
   */
  it('should render multiple deployments', async () => {
    const mockDeployments = {
      data: {
        deployments: [
          { id: 1, environment: 'dev', version: 'v1.0.0', status: 'success' },
          { id: 2, environment: 'staging', version: 'v1.0.1', status: 'pending' },
          { id: 3, environment: 'production', version: 'v1.0.2', status: 'success' },
        ],
      },
    };

    deploymentService.getDeployments.mockResolvedValue(mockDeployments);

    const { container } = renderWithProviders(<DeploymentsPage />);

    await waitFor(() => {
      const deploymentCards = container.querySelectorAll('.deployment-card');
      expect(deploymentCards).toHaveLength(3);
    });
  });

  /**
   * Test: Should render environment names correctly
   * Scenario: Deployments have environment field
   * Expected: Each environment name should be displayed in h3 heading
   */
  it('should render environment names correctly', async () => {
    const mockDeployments = {
      data: {
        deployments: [
          {
            id: 1,
            environment: 'production',
            version: 'v2.0.0',
            status: 'success',
          },
        ],
      },
    };

    deploymentService.getDeployments.mockResolvedValue(mockDeployments);

    renderWithProviders(<DeploymentsPage />);

    await waitFor(() => {
      const heading = screen.getByRole('heading', { name: 'production', level: 3 });
      expect(heading).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render version information correctly
   * Scenario: Deployments have version field
   * Expected: Each version should be displayed with "Version:" prefix
   */
  it('should render version information correctly', async () => {
    const mockDeployments = {
      data: {
        deployments: [
          {
            id: 1,
            environment: 'staging',
            version: 'v3.5.2',
            status: 'success',
          },
        ],
      },
    };

    deploymentService.getDeployments.mockResolvedValue(mockDeployments);

    renderWithProviders(<DeploymentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Version: v3.5.2')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should handle API error gracefully
   * Scenario: API call fails with an error
   * Expected: Component should not crash
   */
  it('should handle API error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    deploymentService.getDeployments.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<DeploymentsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  /**
   * Test: Should handle undefined or null data gracefully
   * Scenario: API returns undefined or null data
   * Expected: Component should not crash
   */
  it('should handle undefined or null data gracefully', async () => {
    deploymentService.getDeployments.mockResolvedValue({ data: null });

    renderWithProviders(<DeploymentsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  /**
   * Test: Should render deployments-page container
   * Scenario: Component is rendered
   * Expected: Main container should have 'deployments-page' class
   */
  it('should render deployments-page container', async () => {
    const mockDeployments = {
      data: {
        deployments: [],
      },
    };

    deploymentService.getDeployments.mockResolvedValue(mockDeployments);

    const { container } = renderWithProviders(<DeploymentsPage />);

    await waitFor(() => {
      const deploymentsPage = container.querySelector('.deployments-page');
      expect(deploymentsPage).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render deployments-list container
   * Scenario: Component is rendered
   * Expected: Deployments list container should be present
   */
  it('should render deployments-list container', async () => {
    const mockDeployments = {
      data: {
        deployments: [],
      },
    };

    deploymentService.getDeployments.mockResolvedValue(mockDeployments);

    const { container } = renderWithProviders(<DeploymentsPage />);

    await waitFor(() => {
      const deploymentsList = container.querySelector('.deployments-list');
      expect(deploymentsList).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render different deployment statuses
   * Scenario: Deployments have various status values
   * Expected: All status values should be displayed correctly
   */
  it('should render different deployment statuses', async () => {
    const mockDeployments = {
      data: {
        deployments: [
          { id: 1, environment: 'env1', version: 'v1', status: 'success' },
          { id: 2, environment: 'env2', version: 'v2', status: 'pending' },
          { id: 3, environment: 'env3', version: 'v3', status: 'failed' },
        ],
      },
    };

    deploymentService.getDeployments.mockResolvedValue(mockDeployments);

    renderWithProviders(<DeploymentsPage />);

    await waitFor(() => {
      expect(screen.getByText('success')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('failed')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render deployments in correct order
   * Scenario: API returns deployments in specific order
   * Expected: Deployments should be rendered in the same order as received
   */
  it('should render deployments in correct order', async () => {
    const mockDeployments = {
      data: {
        deployments: [
          { id: 1, environment: 'First', version: 'v1', status: 'success' },
          { id: 2, environment: 'Second', version: 'v2', status: 'success' },
          { id: 3, environment: 'Third', version: 'v3', status: 'success' },
        ],
      },
    };

    deploymentService.getDeployments.mockResolvedValue(mockDeployments);

    renderWithProviders(<DeploymentsPage />);

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings[0]).toHaveTextContent('First');
      expect(headings[1]).toHaveTextContent('Second');
      expect(headings[2]).toHaveTextContent('Third');
    });
  });

  /**
   * Test: Should handle deployments with missing fields
   * Scenario: Some deployments don't have all fields
   * Expected: Component should render without crashing
   */
  it('should handle deployments with missing fields', async () => {
    const mockDeployments = {
      data: {
        deployments: [
          { id: 1, environment: 'test' },
        ],
      },
    };

    deploymentService.getDeployments.mockResolvedValue(mockDeployments);

    renderWithProviders(<DeploymentsPage />);

    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });
});
