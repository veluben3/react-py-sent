import { useCallback, useEffect, useState } from 'react';
import { listPosts } from './api';
import type { Post } from './types';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { NewPost } from './components/NewPost';
import { PostsList } from './components/PostsList';

export type ViewKey = 'dashboard' | 'new-post' | 'posts';

export default function App() {
  const [view, setView] = useState<ViewKey>('dashboard');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPosts();
      setPosts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreated = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handleDeleted = (id: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="admin-layout">
      <Sidebar
        current={view}
        onSelect={setView}
        postCount={posts.length}
      />
      <main className="admin-main">
        {view === 'dashboard' && (
          <Dashboard
            posts={posts}
            loading={loading}
            onNavigate={setView}
          />
        )}
        {view === 'new-post' && <NewPost onCreated={handleCreated} />}
        {view === 'posts' && (
          <PostsList
            posts={posts}
            loading={loading}
            error={error}
            onRefresh={refresh}
            onDeleted={handleDeleted}
          />
        )}
      </main>
    </div>
  );
}
