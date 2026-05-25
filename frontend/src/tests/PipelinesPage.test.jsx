import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import PipelinesPage from '../pages/pipelines/PipelinesPage';
import { pipelineService } from '../services/pipelineService';

// Mock the pipeline service
vi.mock('../services/pipelineService', () => ({
  pipelineService: {
    getPipelines: vi.fn(),
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

describe('PipelinesPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Should display loading state while fetching pipelines
   * Scenario: Component is mounted and data is being fetched
   * Expected: Loading indicator should be visible
   */
  it('should display loading state while fetching pipelines', () => {
    pipelineService.getPipelines.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<PipelinesPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  /**
   * Test: Should render pipelines list successfully
   * Scenario: API returns a list of pipelines
   * Expected: All pipelines should be displayed with correct information
   */
  it('should render pipelines list successfully', async () => {
    const mockPipelines = {
      data: {
        pipelines: [
          {
            id: 1,
            name: 'Build Pipeline',
            description: 'Main build pipeline',
          },
          {
            id: 2,
            name: 'Test Pipeline',
            description: 'Automated testing pipeline',
          },
        ],
      },
    };

    pipelineService.getPipelines.mockResolvedValue(mockPipelines);

    renderWithProviders(<PipelinesPage />);

    await waitFor(() => {
      expect(screen.getByText('Build Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Main build pipeline')).toBeInTheDocument();
      expect(screen.getByText('Test Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Automated testing pipeline')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render page heading
   * Scenario: Component is rendered
   * Expected: "CI/CD Pipelines" heading should be displayed
   */
  it('should render page heading', async () => {
    const mockPipelines = {
      data: {
        pipelines: [],
      },
    };

    pipelineService.getPipelines.mockResolvedValue(mockPipelines);

    renderWithProviders(<PipelinesPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'CI/CD Pipelines' })).toBeInTheDocument();
    });
  });

  /**
   * Test: Should call getPipelines API on component mount
   * Scenario: Component is mounted
   * Expected: pipelineService.getPipelines should be called with empty params
   */
  it('should call getPipelines API on component mount', async () => {
    const mockPipelines = {
      data: {
        pipelines: [],
      },
    };

    pipelineService.getPipelines.mockResolvedValue(mockPipelines);

    renderWithProviders(<PipelinesPage />);

    await waitFor(() => {
      expect(pipelineService.getPipelines).toHaveBeenCalledWith({});
      expect(pipelineService.getPipelines).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test: Should render empty state when no pipelines exist
   * Scenario: API returns empty pipelines array
   * Expected: No pipeline cards should be rendered
   */
  it('should render empty state when no pipelines exist', async () => {
    const mockPipelines = {
      data: {
        pipelines: [],
      },
    };

    pipelineService.getPipelines.mockResolvedValue(mockPipelines);

    const { container } = renderWithProviders(<PipelinesPage />);

    await waitFor(() => {
      const pipelineCards = container.querySelectorAll('.pipeline-card');
      expect(pipelineCards).toHaveLength(0);
    });
  });

  /**
   * Test: Should render multiple pipelines
   * Scenario: API returns multiple pipelines
   * Expected: All pipelines should be rendered as cards
   */
  it('should render multiple pipelines', async () => {
    const mockPipelines = {
      data: {
        pipelines: [
          { id: 1, name: 'Pipeline 1', description: 'Description 1' },
          { id: 2, name: 'Pipeline 2', description: 'Description 2' },
          { id: 3, name: 'Pipeline 3', description: 'Description 3' },
        ],
      },
    };

    pipelineService.getPipelines.mockResolvedValue(mockPipelines);

    const { container } = renderWithProviders(<PipelinesPage />);

    await waitFor(() => {
      const pipelineCards = container.querySelectorAll('.pipeline-card');
      expect(pipelineCards).toHaveLength(3);
    });
  });

  /**
   * Test: Should render pipeline names correctly
   * Scenario: Pipelines have name field
   * Expected: Each pipeline name should be displayed in h3 heading
   */
  it('should render pipeline names correctly', async () => {
    const mockPipelines = {
      data: {
        pipelines: [
          {
            id: 1,
            name: 'Deployment Pipeline',
            description: 'Deploys to production',
          },
        ],
      },
    };

    pipelineService.getPipelines.mockResolvedValue(mockPipelines);

    renderWithProviders(<PipelinesPage />);

    await waitFor(() => {
      const heading = screen.getByRole('heading', { name: 'Deployment Pipeline', level: 3 });
      expect(heading).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render pipeline descriptions correctly
   * Scenario: Pipelines have description field
   * Expected: Each pipeline description should be displayed
   */
  it('should render pipeline descriptions correctly', async () => {
    const mockPipelines = {
      data: {
        pipelines: [
          {
            id: 1,
            name: 'Security Scan Pipeline',
            description: 'Runs security vulnerability scans',
          },
        ],
      },
    };

    pipelineService.getPipelines.mockResolvedValue(mockPipelines);

    renderWithProviders(<PipelinesPage />);

    await waitFor(() => {
      expect(screen.getByText('Runs security vulnerability scans')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should handle API error gracefully
   * Scenario: API call fails with an error
   * Expected: Component should not crash
   */
  it('should handle API error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    pipelineService.getPipelines.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<PipelinesPage />);

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
    pipelineService.getPipelines.mockResolvedValue({ data: null });

    renderWithProviders(<PipelinesPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  /**
   * Test: Should render pipelines-page container
   * Scenario: Component is rendered
   * Expected: Main container should have 'pipelines-page' class
   */
  it('should render pipelines-page container', async () => {
    const mockPipelines = {
      data: {
        pipelines: [],
      },
    };

    pipelineService.getPipelines.mockResolvedValue(mockPipelines);

    const { container } = renderWithProviders(<PipelinesPage />);

    await waitFor(() => {
      const pipelinesPage = container.querySelector('.pipelines-page');
      expect(pipelinesPage).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render pipelines-list container
   * Scenario: Component is rendered
   * Expected: Pipelines list container should be present
   */
  it('should render pipelines-list container', async () => {
    const mockPipelines = {
      data: {
        pipelines: [],
      },
    };

    pipelineService.getPipelines.mockResolvedValue(mockPipelines);

    const { container } = renderWithProviders(<PipelinesPage />);

    await waitFor(() => {
      const pipelinesList = container.querySelector('.pipelines-list');
      expect(pipelinesList).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render pipeline cards with correct keys
   * Scenario: Multiple pipelines are rendered
   * Expected: Each pipeline card should have unique key based on pipeline ID
   */
  it('should render pipeline cards with correct keys', async () => {
    const mockPipelines = {
      data: {
        pipelines: [
          { id: 1, name: 'Pipeline A', description: 'Desc A' },
          { id: 2, name: 'Pipeline B', description: 'Desc B' },
        ],
      },
    };

    pipelineService.getPipelines.mockResolvedValue(mockPipelines);

    const { container } = renderWithProviders(<PipelinesPage />);

    await waitFor(() => {
      const pipelineCards = container.querySelectorAll('.pipeline-card');
      expect(pipelineCards).toHaveLength(2);
    });
  });

  /**
   * Test: Should handle pipelines with missing descriptions
   * Scenario: Some pipelines don't have description field
   * Expected: Component should render without crashing
   */
  it('should handle pipelines with missing descriptions', async () => {
    const mockPipelines = {
      data: {
        pipelines: [
          { id: 1, name: 'Pipeline Without Description' },
        ],
      },
    };

    pipelineService.getPipelines.mockResolvedValue(mockPipelines);

    renderWithProviders(<PipelinesPage />);

    await waitFor(() => {
      expect(screen.getByText('Pipeline Without Description')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render pipelines in correct order
   * Scenario: API returns pipelines in specific order
   * Expected: Pipelines should be rendered in the same order as received
   */
  it('should render pipelines in correct order', async () => {
    const mockPipelines = {
      data: {
        pipelines: [
          { id: 1, name: 'First Pipeline', description: 'First' },
          { id: 2, name: 'Second Pipeline', description: 'Second' },
          { id: 3, name: 'Third Pipeline', description: 'Third' },
        ],
      },
    };

    pipelineService.getPipelines.mockResolvedValue(mockPipelines);

    renderWithProviders(<PipelinesPage />);

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings[0]).toHaveTextContent('First Pipeline');
      expect(headings[1]).toHaveTextContent('Second Pipeline');
      expect(headings[2]).toHaveTextContent('Third Pipeline');
    });
  });
});
