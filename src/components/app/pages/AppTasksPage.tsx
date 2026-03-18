import { Navigate, useLocation } from 'react-router-dom';

export function AppTasksPage() {
  const { search } = useLocation();
  const nextSearch = search && search.trim().length > 0 ? search : '?tab=tasks';
  return <Navigate to={`/tasks${nextSearch}`} replace />;
}
