import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { Skeleton } from '../components/common/Skeleton';

describe('Common UI Primitives Suite', () => {
  it('should render Button with text and click handles', () => {
    render(<Button variant="primary">Create Sprint</Button>);
    const btn = screen.getByRole('button', { name: /create sprint/i });
    expect(btn).toBeDefined();
    expect(btn.textContent).toContain('Create Sprint');
  });

  it('should render EmptyState with title and description', () => {
    render(
      <EmptyState
        title="No tasks found"
        description="Get started by creating your first deliverable."
        actionText="Add Task"
      />
    );
    expect(screen.getByText('No tasks found')).toBeDefined();
    expect(screen.getByText('Get started by creating your first deliverable.')).toBeDefined();
    expect(screen.getByRole('button', { name: /add task/i })).toBeDefined();
  });

  it('should render Skeleton placeholder', () => {
    const { container } = render(<Skeleton width="120px" height="24px" />);
    const skeletonDiv = container.firstChild as HTMLElement;
    expect(skeletonDiv).toBeDefined();
    expect(skeletonDiv.style.width).toBe('120px');
    expect(skeletonDiv.style.height).toBe('24px');
  });
});
