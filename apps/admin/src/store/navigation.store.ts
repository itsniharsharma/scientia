import { create } from 'zustand';

type ActiveView = 'library' | 'qbank';

interface NavigationState {
  activeView: ActiveView;
  selectedSubjectId: string | null;
  selectedSubjectName: string | null;
  selectedChapterId: string | null;
  selectedChapterName: string | null;
  selectedTopicId: string | null;
  selectedTopicName: string | null;
  selectedQuestionId: string | null;

  setActiveView: (view: ActiveView) => void;
  selectSubject: (id: string | null, name?: string | null) => void;
  selectChapter: (id: string | null, name?: string | null) => void;
  selectTopic: (id: string | null, name?: string | null) => void;
  selectQuestion: (id: string | null) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeView: 'library',
  selectedSubjectId: null,
  selectedSubjectName: null,
  selectedChapterId: null,
  selectedChapterName: null,
  selectedTopicId: null,
  selectedTopicName: null,
  selectedQuestionId: null,

  setActiveView: (activeView) =>
    set({
      activeView,
      selectedSubjectId: null,
      selectedSubjectName: null,
      selectedChapterId: null,
      selectedChapterName: null,
      selectedTopicId: null,
      selectedTopicName: null,
      selectedQuestionId: null,
    }),

  selectSubject: (id, name = null) =>
    set({
      selectedSubjectId: id,
      selectedSubjectName: name,
      selectedChapterId: null,
      selectedChapterName: null,
      selectedTopicId: null,
      selectedTopicName: null,
      selectedQuestionId: null,
    }),

  selectChapter: (id, name = null) =>
    set({
      selectedChapterId: id,
      selectedChapterName: name,
      selectedTopicId: null,
      selectedTopicName: null,
      selectedQuestionId: null,
    }),

  selectTopic: (id, name = null) =>
    set({
      selectedTopicId: id,
      selectedTopicName: name,
      selectedQuestionId: null,
    }),

  selectQuestion: (id) => set({ selectedQuestionId: id }),
}));
