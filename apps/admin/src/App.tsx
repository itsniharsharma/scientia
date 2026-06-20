import { useNavigationStore } from './store/navigation.store';
import { SubjectsPage } from './modules/subjects/SubjectsPage';
import { ChaptersPage } from './modules/chapters/ChaptersPage';
import { TopicsPage } from './modules/topics/TopicsPage';
import { QuestionsPage } from './modules/questions/QuestionsPage';

function Sidebar() {
  const { activeView, setActiveView } = useNavigationStore();

  return (
    <aside className="flex h-full w-52 flex-shrink-0 flex-col bg-gray-900">
      <div className="flex h-14 items-center px-5">
        <span className="text-base font-semibold text-white tracking-tight">
          Scientia
        </span>
      </div>
      <nav className="flex flex-col gap-1 px-3 pt-2">
        <button
          onClick={() => setActiveView('library')}
          className={[
            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            activeView === 'library'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white',
          ].join(' ')}
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7h18M3 12h18M3 17h18"
            />
          </svg>
          Library
        </button>
        <button
          onClick={() => setActiveView('qbank')}
          className={[
            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            activeView === 'qbank'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white',
          ].join(' ')}
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
          QBank
        </button>
      </nav>
    </aside>
  );
}

function ContentArea() {
  const {
    activeView,
    selectedSubjectId,
    selectedSubjectName,
    selectedChapterId,
    selectedChapterName,
    selectedTopicId,
    selectedTopicName,
  } = useNavigationStore();

  if (activeView === 'library') {
    if (
      selectedSubjectId &&
      selectedSubjectName &&
      selectedChapterId &&
      selectedChapterName &&
      selectedTopicId &&
      selectedTopicName
    ) {
      return (
        <QuestionsPage
          topicId={selectedTopicId}
          topicName={selectedTopicName}
          chapterName={selectedChapterName}
          subjectName={selectedSubjectName}
        />
      );
    }
    if (
      selectedSubjectId &&
      selectedSubjectName &&
      selectedChapterId &&
      selectedChapterName
    ) {
      return (
        <TopicsPage
          chapterId={selectedChapterId}
          chapterName={selectedChapterName}
          subjectName={selectedSubjectName}
        />
      );
    }
    if (selectedSubjectId && selectedSubjectName) {
      return (
        <ChaptersPage
          subjectId={selectedSubjectId}
          subjectName={selectedSubjectName}
        />
      );
    }
    return <SubjectsPage />;
  }

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-gray-400">QBank — coming soon</p>
    </div>
  );
}

export function App() {
  return (
    <div className="flex h-full bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <ContentArea />
      </main>
    </div>
  );
}
