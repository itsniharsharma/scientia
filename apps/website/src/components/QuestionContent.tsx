import { QuestionImage } from './QuestionImage';
import { LatexContent } from './LatexContent';

interface QuestionContentProps {
  questionText: string | null | undefined;
  questionImageUrl: string | null | undefined;
  latexContent: string | null | undefined;
  questionNumber?: number;
  className?: string;
}

export function QuestionContent({
  questionText,
  questionImageUrl,
  latexContent,
  questionNumber,
  className = '',
}: QuestionContentProps) {
  return (
    <div className={['space-y-3', className].join(' ').trim()}>
      {questionText && (
        <p className="text-base text-slate-800 leading-relaxed">{questionText}</p>
      )}
      <QuestionImage
        url={questionImageUrl}
        alt={questionNumber ? `Question ${questionNumber} image` : 'Question image'}
      />
      <LatexContent content={latexContent} />
    </div>
  );
}
