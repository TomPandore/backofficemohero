import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import TopHeader from './components/Layout/TopHeader';
import ProgramsPage from './pages/ProgramsPage';
import CreateProgramPage from './pages/CreateProgramPage';
import EditProgramPage from './pages/EditProgramPage';
import ProgramExerciseAssignmentPage from './pages/ProgramExerciseAssignmentPage';
import ProgramCompletePage from './pages/ProgramCompletePage';
import StatsPage from './pages/StatsPage';
import ProgramDaysPage from './pages/ProgramDaysPage';
import ExerciseBankPage from './pages/ExerciseBankPage';
import ClansPage from './pages/ClansPage';
import BlogPage from './pages/blog';
import EditBlogPost from './pages/blog/EditBlogPost';
import { ProgramProvider } from './context/ProgramContext';
import { ExerciseProvider } from './context/ExerciseContext';
import DebugButton from './components/UI/DebugButton';

// Composant de redirection pour les anciennes routes
const RedirectToEditProgram: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (id) {
      navigate(`/edit-program/${id}?tab=exercises`, { replace: true });
    }
  }, [id, navigate]);
  
  return <div>Redirection...</div>;
};

function App() {
  return (
    <ExerciseProvider>
      <ProgramProvider>
        <Router>
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 overflow-auto flex flex-col bg-mohero-background">
              <TopHeader />
              <main className="p-6 flex-1">
                <Routes>
                  <Route path="/" element={<ProgramsPage />} />
                  <Route path="/programmes" element={<ProgramsPage />} />
                  <Route path="/programs/new" element={<CreateProgramPage />} />
                  <Route path="/edit-program/:id" element={<EditProgramPage />} />
                  {/* Redirection des anciennes routes */}
                  <Route path="/program/:id/days" element={<RedirectToEditProgram />} />
                  <Route path="/program/:id/exercises" element={<RedirectToEditProgram />} />
                  <Route path="/program/:id/complete" element={<RedirectToEditProgram />} />
                  <Route path="/stats" element={<StatsPage />} />
                  <Route path="/exercise-bank" element={<ExerciseBankPage />} />
                  <Route path="/clans" element={<ClansPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/new" element={<EditBlogPost />} />
                  <Route path="/blog/edit/:id" element={<EditBlogPost />} />
                </Routes>
              </main>
              <DebugButton />
            </div>
          </div>
        </Router>
      </ProgramProvider>
    </ExerciseProvider>
  );
}

export default App;