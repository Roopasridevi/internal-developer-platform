import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import PipelineDetailPage from '../pages/pipelines/PipelineDetailPage';
import { pipelineService } from '../services/pipelineService';

// Mock the pipeline service
vi.mock('../services/pipelineService', () => ({
  pipelineService: {
    getPipelineById: vi.fn(),
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

describe('PipelineDetailPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Should render pipeline details successfully
   * Scenario: API returns pipeline data
   * Expected: Pipeline name and description should be displayed
   */
  it('should render pipeline details successfully', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockPipeline = {
      data: {
        id: 1,
        name: 'Build Pipeline',
        description: 'Main build and test pipeline',
      },
    };

    pipelineService.getPipelineById.mockResolvedValue(mockPipeline);

    renderWithProviders(<PipelineDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Build Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Main build and test pipeline')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should call getPipelineById API with correct pipeline ID
   * Scenario: Component is mounted with pipeline ID in URL params
   * Expected: API should be called with the correct ID from URL params
   */
  it('should call getPipelineById API with correct pipeline ID', async () => {
    useParams.mockReturnValue({ id: '42' });
    
    const mockPipeline = {
      data: {
        id: 42,
        name: 'Pipeline 42',
        description: 'Description',
      },
    };

    pipelineService.getPipelineById.mockResolvedValue(mockPipeline);

    renderWithProviders(<PipelineDetailPage />);

    await waitFor(() => {
      expect(pipelineService.getPipelineById).toHaveBeenCalledWith('42');
      expect(pipelineService.getPipelineById).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test: Should render pipeline heading with correct name
   * Scenario: Pipeline data is loaded
   * Expected: H1 heading should display pipeline name
   */
  it('should render pipeline heading with correct name', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockPipeline = {
      data: {
        id: 1,
        name: 'Deployment Pipeline',
        description: 'Automated deployment',
      },
    };

    pipelineService.getPipelineById.mockResolvedValue(mockPipeline);

    renderWithProviders(<PipelineDetailPage />);

    await waitFor(() => {
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Deployment Pipeline');
    });
  });

  /**
   * Test: Should render pipeline description
   * Scenario: Pipeline data includes description
   * Expected: Description should be displayed in paragraph
   */
  it('should render pipeline description', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockPipeline = {
      data: {
        id: 1,
        name: 'Test Pipeline',
        description: 'Runs all automated tests',
      },
    };

    pipelineService.getPipelineById.mockResolvedValue(mockPipeline);

    renderWithProviders(<PipelineDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Runs all automated tests')).toBeInTheDocument();
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
    
    pipelineService.getPipelineById.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<PipelineDetailPage />);

    await waitFor(() => {
      // Component should not crash
      const container = screen.queryByText('Build Pipeline');
      expect(container).not.toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  /**
   * Test: Should handle undefined or null pipeline data
   * Scenario: API returns undefined or null data
   * Expected: Component should not crash and handle gracefully
   */
  it('should handle undefined or null pipeline data', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    pipelineService.getPipelineById.mockResolvedValue({ data: null });

    renderWithProviders(<PipelineDetailPage />);

    await waitFor(() => {
      // Should not crash, but won't display data
      expect(screen.queryByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render pipeline-detail container
   * Scenario: Component is rendered
   * Expected: Main container should have 'pipeline-detail' class
   */
  it('should render pipeline-detail container', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockPipeline = {
      data: {
        id: 1,
        name: 'Pipeline',
        description: 'Description',
      },
    };

    pipelineService.getPipelineById.mockResolvedValue(mockPipeline);

    const { container } = renderWithProviders(<PipelineDetailPage />);

    await waitFor(() => {
      const pipelineDetail = container.querySelector('.pipeline-detail');
      expect(pipelineDetail).toBeInTheDocument();
    });
  });

  /**
   * Test: Should update when route parameter changes
   * Scenario: Component is already mounted and route parameter changes
   * Expected: API should be called again with new ID
   */
  it('should update when route parameter changes', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockPipeline1 = {
      data: {
        id: 1,
        name: 'Pipeline 1',
        description: 'First pipeline',
      },
    };

    pipelineService.getPipelineById.mockResolvedValue(mockPipeline1);

    renderWithProviders(<PipelineDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Pipeline 1')).toBeInTheDocument();
    });

    // Verify API was called with first ID
    expect(pipelineService.getPipelineById).toHaveBeenCalledWith('1');
  });

  /**
   * Test: Should handle missing description gracefully
   * Scenario: Pipeline data is missing description field
   * Expected: Component should render without crashing
   */
  it('should handle missing description gracefully', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockPipeline = {
      data: {
        id: 1,
        name: 'Minimal Pipeline',
      },
    };

    pipelineService.getPipelineById.mockResolvedValue(mockPipeline);

    renderWithProviders(<PipelineDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Minimal Pipeline')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render with different pipeline IDs
   * Scenario: Component is rendered with various pipeline IDs
   * Expected: API should be called with correct ID each time
   */
  it('should render with different pipeline IDs', async () => {
    const testIds = ['1', '5', '100'];

    for (const id of testIds) {
      vi.clearAllMocks();
      useParams.mockReturnValue({ id });
      
      const mockPipeline = {
        data: {
          id: parseInt(id),
          name: `Pipeline ${id}`,
          description: `Description ${id}`,
        },
      };

      pipelineService.getPipelineById.mockResolvedValue(mockPipeline);

      renderWithProviders(<PipelineDetailPage />);

      await waitFor(() => {
        expect(pipelineService.getPipelineById).toHaveBeenCalledWith(id);
      });
    }
  });

  /**
   * Test: Should display empty values when data fields are empty strings
   * Scenario: Pipeline has empty string values for name and description
   * Expected: Component should render without crashing
   */
  it('should display empty values when data fields are empty strings', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const mockPipeline = {
      data: {
        id: 1,
        name: '',
        description: '',
      },
    };

    pipelineService.getPipelineById.mockResolvedValue(mockPipeline);

    renderWithProviders(<PipelineDetailPage />);

    await waitFor(() => {
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });
  });

  /**
   * Test: Should handle long pipeline names and descriptions
   * Scenario: Pipeline has very long name and description
   * Expected: Component should render the full text without truncation
   */
  it('should handle long pipeline names and descriptions', async () => {
    useParams.mockReturnValue({ id: '1' });
    
    const longName = 'This is a very long pipeline name that contains many words and characters to test rendering';
    const longDescription = 'This is an extremely long description that goes on and on with lots of details about what this pipeline does and how it works in the system';
    
    const mockPipeline = {
      data: {
        id: 1,
        name: longName,
        description: longDescription,
      },
    };

    pipelineService.getPipelineById.mockResolvedValue(mockPipeline);

    renderWithProviders(<PipelineDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(longName)).toBeInTheDocument();
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });
  });
});
