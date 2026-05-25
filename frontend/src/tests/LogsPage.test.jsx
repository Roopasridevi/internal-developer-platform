import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import LogsPage from '../pages/logs/LogsPage';
import { logsService } from '../services/logsService';

// Mock the logs service
vi.mock('../services/logsService', () => ({
  logsService: {
    getLogs: vi.fn(),
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

describe('LogsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Should render page heading
   * Scenario: Component is rendered
   * Expected: "Logs Dashboard" heading should be displayed
   */
  it('should render page heading', async () => {
    const mockLogs = {
      data: {
        logs: [],
      },
    };

    logsService.getLogs.mockResolvedValue(mockLogs);

    renderWithProviders(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Logs Dashboard' })).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render filter controls
   * Scenario: Component is rendered
   * Expected: Level filter dropdown and search input should be visible
   */
  it('should render filter controls', async () => {
    const mockLogs = {
      data: {
        logs: [],
      },
    };

    logsService.getLogs.mockResolvedValue(mockLogs);

    renderWithProviders(<LogsPage />);

    await waitFor(() => {
      const levelSelect = screen.getByRole('combobox');
      const searchInput = screen.getByPlaceholderText('Search logs...');
      
      expect(levelSelect).toBeInTheDocument();
      expect(searchInput).toBeInTheDocument();
    });
  });

  /**
   * Test: Should display loading state while fetching logs
   * Scenario: Component is mounted and data is being fetched
   * Expected: Loading indicator should be visible
   */
  it('should display loading state while fetching logs', () => {
    logsService.getLogs.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<LogsPage />);

    expect(screen.getByText('Loading logs...')).toBeInTheDocument();
  });

  /**
   * Test: Should render logs list successfully
   * Scenario: API returns a list of logs
   * Expected: All logs should be displayed with correct information
   */
  it('should render logs list successfully', async () => {
    const mockLogs = {
      data: {
        logs: [
          {
            id: 1,
            timestamp: '2024-01-01T10:00:00Z',
            level: 'info',
            message: 'Application started',
          },
          {
            id: 2,
            timestamp: '2024-01-01T10:05:00Z',
            level: 'error',
            message: 'Connection failed',
          },
        ],
      },
    };

    logsService.getLogs.mockResolvedValue(mockLogs);

    renderWithProviders(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByText('Application started')).toBeInTheDocument();
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
      expect(screen.getByText('info')).toBeInTheDocument();
      expect(screen.getByText('error')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should call getLogs API on component mount with default filters
   * Scenario: Component is mounted
   * Expected: logsService.getLogs should be called with default filter values
   */
  it('should call getLogs API on component mount with default filters', async () => {
    const mockLogs = {
      data: {
        logs: [],
      },
    };

    logsService.getLogs.mockResolvedValue(mockLogs);

    renderWithProviders(<LogsPage />);

    await waitFor(() => {
      expect(logsService.getLogs).toHaveBeenCalledWith({ level: '', search: '' });
      expect(logsService.getLogs).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test: Should update filters when level dropdown changes
   * Scenario: User selects a different log level from dropdown
   * Expected: API should be called with updated level filter
   */
  it('should update filters when level dropdown changes', async () => {
    const mockLogs = {
      data: {
        logs: [],
      },
    };

    logsService.getLogs.mockResolvedValue(mockLogs);

    renderWithProviders(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const levelSelect = screen.getByRole('combobox');
    fireEvent.change(levelSelect, { target: { value: 'error' } });

    await waitFor(() => {
      expect(logsService.getLogs).toHaveBeenCalledWith({ level: 'error', search: '' });
    });
  });

  /**
   * Test: Should update filters when search input changes
   * Scenario: User types in the search input
   * Expected: API should be called with updated search filter
   */
  it('should update filters when search input changes', async () => {
    const mockLogs = {
      data: {
        logs: [],
      },
    };

    logsService.getLogs.mockResolvedValue(mockLogs);

    renderWithProviders(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search logs...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.change(searchInput, { target: { value: 'error message' } });

    await waitFor(() => {
      expect(logsService.getLogs).toHaveBeenCalledWith({ level: '', search: 'error message' });
    });
  });

  /**
   * Test: Should render all level filter options
   * Scenario: Level dropdown is rendered
   * Expected: All level options should be available (All Levels, Info, Warning, Error)
   */
  it('should render all level filter options', async () => {
    const mockLogs = {
      data: {
        logs: [],
      },
    };

    logsService.getLogs.mockResolvedValue(mockLogs);

    renderWithProviders(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'All Levels' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Info' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Warning' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Error' })).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render log entries with correct CSS classes
   * Scenario: Logs with different levels are rendered
   * Expected: Each log entry should have appropriate level class
   */
  it('should render log entries with correct CSS classes', async () => {
    const mockLogs = {
      data: {
        logs: [
          { id: 1, timestamp: '2024-01-01T10:00:00Z', level: 'info', message: 'Info log' },
          { id: 2, timestamp: '2024-01-01T10:01:00Z', level: 'warn', message: 'Warning log' },
          { id: 3, timestamp: '2024-01-01T10:02:00Z', level: 'error', message: 'Error log' },
        ],
      },
    };

    logsService.getLogs.mockResolvedValue(mockLogs);

    const { container } = renderWithProviders(<LogsPage />);

    await waitFor(() => {
      const logEntries = container.querySelectorAll('.log-entry');
      expect(logEntries).toHaveLength(3);
      expect(logEntries[0]).toHaveClass('log-entry', 'info');
      expect(logEntries[1]).toHaveClass('log-entry', 'warn');
      expect(logEntries[2]).toHaveClass('log-entry', 'error');
    });
  });

  /**
   * Test: Should render log timestamps
   * Scenario: Logs include timestamp field
   * Expected: Each log should display its timestamp
   */
  it('should render log timestamps', async () => {
    const mockLogs = {
      data: {
        logs: [
          {
            id: 1,
            timestamp: '2024-01-01T10:00:00Z',
            level: 'info',
            message: 'Test log',
          },
        ],
      },
    };

    logsService.getLogs.mockResolvedValue(mockLogs);

    renderWithProviders(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByText('2024-01-01T10:00:00Z')).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render empty state when no logs exist
   * Scenario: API returns empty logs array
   * Expected: No log entries should be rendered
   */
  it('should render empty state when no logs exist', async () => {
    const mockLogs = {
      data: {
        logs: [],
      },
    };

    logsService.getLogs.mockResolvedValue(mockLogs);

    const { container } = renderWithProviders(<LogsPage />);

    await waitFor(() => {
      const logEntries = container.querySelectorAll('.log-entry');
      expect(logEntries).toHaveLength(0);
    });
  });

  /**
   * Test: Should handle API error gracefully
   * Scenario: API call fails with an error
   * Expected: Component should not crash
   */
  it('should handle API error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    logsService.getLogs.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<LogsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading logs...')).not.toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  /**
   * Test: Should handle undefined or null data gracefully
   * Scenario: API returns undefined or null data
   * Expected: Component should not crash
   */
  it('should handle undefined or null data gracefully', async () => {
    logsService.getLogs.mockResolvedValue({ data: null });

    renderWithProviders(<LogsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading logs...')).not.toBeInTheDocument();
    });
  });

  /**
   * Test: Should render logs-page container
   * Scenario: Component is rendered
   * Expected: Main container should have 'logs-page' class
   */
  it('should render logs-page container', async () => {
    const mockLogs = {
      data: {
        logs: [],
      },
    };

    logsService.getLogs.mockResolvedValue(mockLogs);

    const { container } = renderWithProviders(<LogsPage />);

    await waitFor(() => {
      const logsPage = container.querySelector('.logs-page');
      expect(logsPage).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render logs-filters container
   * Scenario: Component is rendered
   * Expected: Filters container should be present
   */
  it('should render logs-filters container', async () => {
    const mockLogs = {
      data: {
        logs: [],
      },
    };

    logsService.getLogs.mockResolvedValue(mockLogs);

    const { container } = renderWithProviders(<LogsPage />);

    await waitFor(() => {
      const logsFilters = container.querySelector('.logs-filters');
      expect(logsFilters).toBeInTheDocument();
    });
  });

  /**
   * Test: Should render logs-list container
   * Scenario: Component is rendered
   * Expected: Logs list container should be present
   */
  it('should render logs-list container', async () => {
    const mockLogs = {
      data: {
        logs: [],
      },
    };

    logsService.getLogs.mockResolvedValue(mockLogs);

    const { container } = renderWithProviders(<LogsPage />);

    await waitFor(() => {
      const logsList = container.querySelector('.logs-list');
      expect(logsList).toBeInTheDocument();
    });
  });

  /**
   * Test: Should apply both level and search filters simultaneously
   * Scenario: User selects a level and enters search text
   * Expected: API should be called with both filters
   */
  it('should apply both level and search filters simultaneously', async () => {
    const mockLogs = {
      data: {
        logs: [],
      },
    };

    logsService.getLogs.mockResolvedValue(mockLogs);

    renderWithProviders(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    // Change level filter
    const levelSelect = screen.getByRole('combobox');
    fireEvent.change(levelSelect, { target: { value: 'warn' } });

    await waitFor(() => {
      expect(logsService.getLogs).toHaveBeenCalledWith({ level: 'warn', search: '' });
    });

    // Change search filter
    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.change(searchInput, { target: { value: 'database' } });

    await waitFor(() => {
      expect(logsService.getLogs).toHaveBeenCalledWith({ level: 'warn', search: 'database' });
    });
  });

  /**
   * Test: Should render log level, timestamp, and message separately
   * Scenario: Logs are displayed
   * Expected: Each log component (timestamp, level, message) should be in separate spans
   */
  it('should render log level, timestamp, and message separately', async () => {
    const mockLogs = {
      data: {
        logs: [
          {
            id: 1,
            timestamp: '2024-01-01T12:00:00Z',
            level: 'info',
            message: 'Test message',
          },
        ],
      },
    };

    logsService.getLogs.mockResolvedValue(mockLogs);

    const { container } = renderWithProviders(<LogsPage />);

    await waitFor(() => {
      const timestamp = container.querySelector('.log-timestamp');
      const level = container.querySelector('.log-level');
      const message = container.querySelector('.log-message');
      
      expect(timestamp).toBeInTheDocument();
      expect(level).toBeInTheDocument();
      expect(message).toBeInTheDocument();
      
      expect(timestamp).toHaveTextContent('2024-01-01T12:00:00Z');
      expect(level).toHaveTextContent('info');
      expect(message).toHaveTextContent('Test message');
    });
  });

  /**
   * Test: Should render multiple logs in correct order
   * Scenario: API returns multiple logs
   * Expected: Logs should be rendered in the same order as received
   */
  it('should render multiple logs in correct order', async () => {
    const mockLogs = {
      data: {
        logs: [
          { id: 1, timestamp: '2024-01-01T10:00:00Z', level: 'info', message: 'First log' },
          { id: 2, timestamp: '2024-01-01T10:01:00Z', level: 'warn', message: 'Second log' },
          { id: 3, timestamp: '2024-01-01T10:02:00Z', level: 'error', message: 'Third log' },
        ],
      },
    };

    logsService.getLogs.mockResolvedValue(mockLogs);

    const { container } = renderWithProviders(<LogsPage />);

    await waitFor(() => {
      const logMessages = container.querySelectorAll('.log-message');
      expect(logMessages[0]).toHaveTextContent('First log');
      expect(logMessages[1]).toHaveTextContent('Second log');
      expect(logMessages[2]).toHaveTextContent('Third log');
    });
  });

  /**
   * Test: Should reset search filter when cleared
   * Scenario: User clears the search input
   * Expected: API should be called with empty search filter
   */
  it('should reset search filter when cleared', async () => {
    const mockLogs = {
      data: {
        logs: [],
      },
    };

    logsService.getLogs.mockResolvedValue(mockLogs);

    renderWithProviders(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search logs...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search logs...');
    
    // Enter search text
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    await waitFor(() => {
      expect(logsService.getLogs).toHaveBeenCalledWith({ level: '', search: 'test' });
    });

    // Clear search text
    fireEvent.change(searchInput, { target: { value: '' } });
    
    await waitFor(() => {
      expect(logsService.getLogs).toHaveBeenCalledWith({ level: '', search: '' });
    });
  });
});
