import { useCallback, useEffect, useState } from 'react';
import { listPosts } from './api';
import type { Post } from './types';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { NewPost } from './components/NewPost';
import { PostsList } from './components/PostsList';
import { PostDetail } from './components/PostDetail';

export type ViewKey = 'dashboard' | 'new-post' | 'posts' | 'post-detail';

export default function App() {
  const [view, setView] = useState<ViewKey>('dashboard');
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
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
    if (selectedPostId === id) {
      setSelectedPostId(null);
      setView('posts');
    }
  };

  const handleOpenPost = (id: number) => {
    setSelectedPostId(id);
    setView('post-detail');
  };

  const handleNavigate = (next: ViewKey) => {
    if (next !== 'post-detail') setSelectedPostId(null);
    setView(next);
  };

  const selectedPost =
    selectedPostId !== null
      ? posts.find((p) => p.id === selectedPostId)
      : undefined;

  return (
    <div className="admin-layout">
      <Sidebar
        current={view === 'post-detail' ? 'posts' : view}
        onSelect={handleNavigate}
        postCount={posts.length}
      />
      <main className="admin-main">
        {view === 'dashboard' && (
          <Dashboard
            posts={posts}
            loading={loading}
            onNavigate={handleNavigate}
            onOpenPost={handleOpenPost}
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
            onOpenPost={handleOpenPost}
          />
        )}
        {view === 'post-detail' && selectedPostId !== null && (
          <PostDetail
            postId={selectedPostId}
            initialPost={selectedPost}
            onBack={() => handleNavigate('posts')}
            onDeleted={handleDeleted}
          />
        )}
      </main>
    </div>
  );
}
