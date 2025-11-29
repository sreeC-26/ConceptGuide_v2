import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LearningCard from '../../components/LearningCard';

describe('LearningCard', () => {
  const mockStep = {
    stepNumber: 1,
    conceptName: 'Understanding Functions',
    timeEstimate: 10,
    explanation: 'A function is like a machine that takes input and produces output.',
    whyThisStep: 'You need to understand functions to grasp calculus.',
    examples: [
      { title: 'Example 1', content: 'f(x) = x + 2' },
      { title: 'Example 2', content: 'g(x) = x * 3' },
    ],
    practiceProblem: {
      question: 'What is f(3) if f(x) = x + 5?',
      options: ['A) 6', 'B) 7', 'C) 8', 'D) 9'],
      correctAnswer: 'C) 8',
      explanation: 'f(3) = 3 + 5 = 8',
    },
    connectionToNext: 'Now we can learn about limits.',
  };

  const mockOnMarkComplete = vi.fn();
  const mockOnAnswerChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render step information', () => {
    render(
      <LearningCard
        step={mockStep}
        onMarkComplete={mockOnMarkComplete}
        isLastStep={false}
      />
    );

    expect(screen.getByText(/Step 1: Understanding Functions/)).toBeInTheDocument();
    expect(screen.getByText(/A function is like a machine/)).toBeInTheDocument();
  });

  it('should render why this step section', () => {
    render(
      <LearningCard
        step={mockStep}
        onMarkComplete={mockOnMarkComplete}
        isLastStep={false}
      />
    );

    expect(screen.getByText('Why This Step Matters')).toBeInTheDocument();
    expect(screen.getByText(/You need to understand functions/)).toBeInTheDocument();
  });

  it('should render examples', () => {
    render(
      <LearningCard
        step={mockStep}
        onMarkComplete={mockOnMarkComplete}
        isLastStep={false}
      />
    );

    expect(screen.getByText('Example 1')).toBeInTheDocument();
    expect(screen.getByText('f(x) = x + 2')).toBeInTheDocument();
    expect(screen.getByText('Example 2')).toBeInTheDocument();
  });

  it('should render practice problem', () => {
    render(
      <LearningCard
        step={mockStep}
        onMarkComplete={mockOnMarkComplete}
        isLastStep={false}
      />
    );

    expect(screen.getByText(/What is f\(3\)/)).toBeInTheDocument();
    expect(screen.getByText('A) 6')).toBeInTheDocument();
    expect(screen.getByText('B) 7')).toBeInTheDocument();
    expect(screen.getByText('C) 8')).toBeInTheDocument();
    expect(screen.getByText('D) 9')).toBeInTheDocument();
  });

  it('should disable mark complete button until solution is shown', () => {
    render(
      <LearningCard
        step={mockStep}
        onMarkComplete={mockOnMarkComplete}
        isLastStep={false}
      />
    );

    expect(screen.getByText('Please solve the practice problem first')).toBeInTheDocument();
    expect(screen.getByText('Please solve the practice problem first').closest('button')).toBeDisabled();
  });

  it('should allow answer selection', () => {
    render(
      <LearningCard
        step={mockStep}
        onMarkComplete={mockOnMarkComplete}
        isLastStep={false}
        onAnswerChange={mockOnAnswerChange}
      />
    );

    const optionB = screen.getByText('B) 7');
    fireEvent.click(optionB);

    expect(mockOnAnswerChange).toHaveBeenCalledWith('B) 7');
  });

  it('should show check answer button after selecting an answer', () => {
    render(
      <LearningCard
        step={mockStep}
        onMarkComplete={mockOnMarkComplete}
        isLastStep={false}
        sharedAnswer="B) 7"
      />
    );

    expect(screen.getByText('Check Answer')).toBeInTheDocument();
  });

  it('should show solution and correct answer when solution button clicked', () => {
    render(
      <LearningCard
        step={mockStep}
        onMarkComplete={mockOnMarkComplete}
        isLastStep={false}
      />
    );

    const showSolutionButton = screen.getByText('Show Solution');
    fireEvent.click(showSolutionButton);

    expect(screen.getByText(/Correct Answer:/)).toBeInTheDocument();
    expect(screen.getByText(/C\) 8/)).toBeInTheDocument();
    expect(screen.getByText(/f\(3\) = 3 \+ 5 = 8/)).toBeInTheDocument();
  });

  it('should enable mark complete button after showing solution', () => {
    render(
      <LearningCard
        step={mockStep}
        onMarkComplete={mockOnMarkComplete}
        isLastStep={false}
      />
    );

    const showSolutionButton = screen.getByText('Show Solution');
    fireEvent.click(showSolutionButton);

    const completeButton = screen.getByText('Mark Complete & Continue →');
    expect(completeButton).not.toBeDisabled();
  });

  it('should call onMarkComplete when button is clicked', () => {
    render(
      <LearningCard
        step={mockStep}
        onMarkComplete={mockOnMarkComplete}
        isLastStep={false}
      />
    );

    const showSolutionButton = screen.getByText('Show Solution');
    fireEvent.click(showSolutionButton);

    const completeButton = screen.getByText('Mark Complete & Continue →');
    fireEvent.click(completeButton);

    expect(mockOnMarkComplete).toHaveBeenCalledTimes(1);
  });

  it('should show different button text for last step', () => {
    render(
      <LearningCard
        step={mockStep}
        onMarkComplete={mockOnMarkComplete}
        isLastStep={true}
      />
    );

    const showSolutionButton = screen.getByText('Show Solution');
    fireEvent.click(showSolutionButton);

    expect(screen.getByText('Complete Learning Path ✓')).toBeInTheDocument();
  });

  it('should show connection to next when not last step', () => {
    render(
      <LearningCard
        step={mockStep}
        onMarkComplete={mockOnMarkComplete}
        isLastStep={false}
      />
    );

    expect(screen.getByText("What's Next?")).toBeInTheDocument();
    expect(screen.getByText('Now we can learn about limits.')).toBeInTheDocument();
  });

  it('should not show connection to next when last step', () => {
    render(
      <LearningCard
        step={mockStep}
        onMarkComplete={mockOnMarkComplete}
        isLastStep={true}
      />
    );

    expect(screen.queryByText("What's Next?")).not.toBeInTheDocument();
  });

  it('should handle step without practice problem', () => {
    const stepWithoutProblem = {
      ...mockStep,
      practiceProblem: null,
    };

    render(
      <LearningCard
        step={stepWithoutProblem}
        onMarkComplete={mockOnMarkComplete}
        isLastStep={false}
      />
    );

    // Should show the complete button directly
    expect(screen.getByText('Mark Complete & Continue →')).toBeInTheDocument();
    expect(screen.getByText('Mark Complete & Continue →').closest('button')).not.toBeDisabled();
  });

  it('should show time estimate badge', () => {
    render(
      <LearningCard
        step={mockStep}
        onMarkComplete={mockOnMarkComplete}
        isLastStep={false}
      />
    );

    expect(screen.getByText(/~10 min/)).toBeInTheDocument();
  });
});

