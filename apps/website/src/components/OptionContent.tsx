import { OptionImage } from './OptionImage';
import { LatexContent } from './LatexContent';

interface OptionContentProps {
  optionText: string | null | undefined;
  optionImageUrl: string | null | undefined;
  latexContent: string | null | undefined;
  className?: string;
}

export function OptionContent({
  optionText,
  optionImageUrl,
  latexContent,
  className = '',
}: OptionContentProps) {
  return (
    <div className={['min-w-0', className].join(' ').trim()}>
      {optionText && <span>{optionText}</span>}
      <OptionImage url={optionImageUrl} />
      <LatexContent content={latexContent} />
    </div>
  );
}
