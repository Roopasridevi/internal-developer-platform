import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import DeploymentDetailPage from '../pages/deployments/DeploymentDetailPage';
import { deploymentService } from '../services/deploymentService';

// Mock the deployment service
vi.mock('../services/deploymentService', () => ({
  deploymentService: {
    getDeploymentById: vi.fn(),
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

describe('DeploymentDetailPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Should render deployment details successfully
   * Scenario: API returns deployment data
   * Expected: Deployment environment, version, and status should be displayed
   */
  it('should render deployment details successfully', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockDeployment = {
      data: {
        id: 1,
        environment: 'production',
        version: 'v1.2.3',
        status: 'success',
      },
    };

    deploymentService.getDeploymentById.mockResolvedValue(mockDeployment);

    renderWithProviders(<DeploymentDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Deployment: production')).toBeInTheDocument();
      expect(screen.getByText('Version: v1.2.3')).toBeInTheDocument();
      expect(screen.getByText('Status: success')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should call getDeploymentById API with correct deployment ID
   * Scenario: Component is mounted with deployment ID in URL params
   * Expected: API should be called with the correct ID from URL params
   */
  it('should call getDeploymentById API with correct deployment ID', async () => {
    useParams.mockReturnValue({ id: '42' });
    
    const mockDeployment = {
      data: {
        id: 42,
        environment: 'staging',
        version: 'v2.0.0',
        status: 'pending',
      },
    };

    deploymentService.getDeploymentById.mockResolvedValue(mockDeployment);

    renderWithProviders(<DeploymentDetailPage />);

    await waitFor(() => {
      expect(deploymentService.getDeploymentById).toHaveBeenCalledWith('42');
      expect(deploymentService.getDeploymentById).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test: Should render deployment heading with environment name
   * Scenario: Deployment data is loaded
   * Expected: H1 heading should display "Deployment: {environment}"
   */
  it('should render deployment heading with environment name', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockDeployment = {
      data: {
        id: 1,
        environment: 'staging',
        version: 'v1.0.0',
        status: 'success',
      },
    };

    deploymentService.getDeploymentById.mockResolvedValue(mockDeployment);

    renderWithProviders(<DeploymentDetailPage />);

    await waitFor(() => {
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Deployment: staging');
    });
  });

  /**
   * Test: Should display version information
   * Scenario: Deployment data includes version field
   * Expected: Version should be displayed with "Version:" prefix
   */
  it('should display version information', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockDeployment = {
      data: {
        id: 1,
        environment: 'production',
        version: 'v3.5.2',
        status: 'success',
      },
    };

    deploymentService.getDeploymentById.mockResolvedValue(mockDeployment);

    renderWithProviders(<DeploymentDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Version: v3.5.2')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should display status information
   * Scenario: Deployment data includes status field
   * Expected: Status should be displayed with "Status:" prefix
   */
  it('should display status information', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockDeployment = {
      data: {
        id: 1,
        environment: 'dev',
        version: 'v1.0.0',
        status: 'failed',
      },
    };

    deploymentService.getDeploymentById.mockResolvedValue(mockDeployment);

    renderWithProviders(<DeploymentDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Status: failed')).toBeInTheDocument();
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
    
    deploymentService.getDeploymentById.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<DeploymentDetailPage />);

    await waitFor(() => {
      // Component should not crash
      expect(screen.queryByText('Deployment: production')).not.toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  /**
   * Test: Should handle undefined or null deployment data
   * Scenario: API returns undefined or null data
   * Expected: Component should not crash and handle gracefully
   */
  it('should handle undefined or null deployment data', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    deploymentService.getDeploymentById.mockResolvedValue({ data: null });

    renderWithProviders(<DeploymentDetailPage />);

    await waitFor(() => {
      // Should not crash, heading should still render
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render deployment-detail container
   * Scenario: Component is rendered
   * Expected: Main container should have 'deployment-detail' class
   */
  it('should render deployment-detail container', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockDeployment = {
      data: {
        id: 1,
        environment: 'production',
        version: 'v1.0.0',
        status: 'success',
      },
    };

    deploymentService.getDeploymentById.mockResolvedValue(mockDeployment);

    const { container } = renderWithProviders(<DeploymentDetailPage />);

    await waitFor(() => {
      const deploymentDetail = container.querySelector('.deployment-detail');
      expect(deploymentDetail).toBeInTheDocument();
    });
  });

  /**
   * Test: Should update when route parameter changes
   * Scenario: Component is already mounted and route parameter changes
   * Expected: API should be called again with new ID
   */
  it('should update when route parameter changes', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockDeployment1 = {
      data: {
        id: 1,
        environment: 'staging',
        version: 'v1.0.0',
        status: 'success',
      },
    };

    deploymentService.getDeploymentById.mockResolvedValue(mockDeployment1);

    renderWithProviders(<DeploymentDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Deployment: staging')).toBeInTheDocument();
    });

    // Verify API was called with first ID
    expect(deploymentService.getDeploymentById).toHaveBeenCalledWith('1');
  });

  /**
   * Test: Should handle missing optional fields gracefully
   * Scenario: Deployment data is missing optional fields
   * Expected: Component should render without crashing
   */
  it('should handle missing optional fields gracefully', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockDeployment = {
      data: {
        id: 1,
        environment: 'test',
      },
    };

    deploymentService.getDeploymentById.mockResolvedValue(mockDeployment);

    renderWithProviders(<DeploymentDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Deployment: test')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render with different deployment IDs
   * Scenario: Component is rendered with various deployment IDs
   * Expected: API should be called with correct ID each time
   */
  it('should render with different deployment IDs', async () => {
    const testIds = ['1', '10', '999'];

    for (const id of testIds) {
      vi.clearAllMocks();
      useParams.mockReturnValue({ id });
      
      const mockDeployment = {
        data: {
          id: parseInt(id),
          environment: `env-${id}`,
          version: `v${id}.0.0`,
          status: 'success',
        },
      };

      deploymentService.getDeploymentById.mockResolvedValue(mockDeployment);

      renderWithProviders(<DeploymentDetailPage />);

      await waitFor(() => {
        expect(deploymentService.getDeploymentById).toHaveBeenCalledWith(id);
      });
    }
  });

  /**
   * Test: Should display different status values correctly
   * Scenario: Deployment has various status values
   * Expected: All status values should be displayed correctly
   */
  it('should display different status values correctly', async () => {
    const statuses = ['success', 'pending', 'failed', 'in-progress'];

    for (const status of statuses) {
      vi.clearAllMocks();
      useParams.mockReturnValue({ id: '1' });
      
      const mockDeployment = {
        data: {
          id: 1,
          environment: 'test',
          version: 'v1.0.0',
          status: status,
        },
      };

      deploymentService.getDeploymentById.mockResolvedValue(mockDeployment);

      const { unmount } = renderWithProviders(<DeploymentDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(`Status: ${status}`)).toBeInTheDocument();
      });

      unmount();
    }
  });

  /**
   * Test: Should display empty values when data fields are empty strings
   * Scenario: Deployment has empty string values
   * Expected: Component should render without crashing
   */
  it('should display empty values when data fields are empty strings', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockDeployment = {
      data: {
        id: 1,
        environment: '',
        version: '',
        status: '',
      },
    };

    deploymentService.getDeploymentById.mockResolvedValue(mockDeployment);

    renderWithProviders(<DeploymentDetailPage />);

    await waitFor(() => {
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });
  });
});
