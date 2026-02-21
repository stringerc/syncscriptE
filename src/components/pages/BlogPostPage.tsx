import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Clock, User, Share2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { FEATURED, POSTS, type BlogPost } from './BlogPage';

const ALL_POSTS = [FEATURED, ...POSTS];

function renderMarkdown(content: string) {
  const blocks: { type: 'heading' | 'paragraph' | 'list-item' | 'code' | 'hr'; text: string; level?: number }[] = [];
  const lines = content.split('\n');
  let inCode = false;
  let codeBuffer = '';

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code', text: codeBuffer.trim() });
        codeBuffer = '';
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuffer += line + '\n';
      continue;
    }
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === '---') {
      blocks.push({ type: 'hr', text: '' });
    } else if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'heading', text: trimmed.slice(4), level: 3 });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'heading', text: trimmed.slice(3), level: 2 });
    } else if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'heading', text: trimmed.slice(2), level: 1 });
    } else if (trimmed.startsWith('- **')) {
      blocks.push({ type: 'list-item', text: trimmed.slice(2) });
    } else if (trimmed.startsWith('- ')) {
      blocks.push({ type: 'list-item', text: trimmed.slice(2) });
    } else if (/^\d+\.\s/.test(trimmed)) {
      blocks.push({ type: 'list-item', text: trimmed });
    } else {
      blocks.push({ type: 'paragraph', text: trimmed });
    }
  }

  const formatInline = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={key++} className="text-white font-semibold">{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<em key={key++} className="text-white/80 italic">{match[3]}</em>);
      } else if (match[4]) {
        parts.push(<code key={key++} className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-cyan-300 font-mono">{match[4]}</code>);
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  };

  return blocks.map((block, i) => {
    switch (block.type) {
      case 'heading':
        if (block.level === 2) return <h2 key={i} className="mt-10 mb-4 text-xl font-bold text-white sm:text-2xl">{formatInline(block.text)}</h2>;
        if (block.level === 3) return <h3 key={i} className="mt-8 mb-3 text-lg font-semibold text-white">{formatInline(block.text)}</h3>;
        return <h2 key={i} className="mt-10 mb-4 text-2xl font-bold text-white">{formatInline(block.text)}</h2>;
      case 'paragraph':
        return <p key={i} className="mb-4 text-white/70 font-light leading-[1.8]">{formatInline(block.text)}</p>;
      case 'list-item':
        return <li key={i} className="mb-2 ml-5 text-white/70 font-light leading-[1.8] list-disc">{formatInline(block.text)}</li>;
      case 'code':
        return <pre key={i} className="my-6 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-5 text-sm text-white/80 font-mono leading-relaxed">{block.text}</pre>;
      case 'hr':
        return <hr key={i} className="my-8 border-white/10" />;
      default:
        return null;
    }
  });
}

export function BlogPostPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const post = ALL_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] text-white">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <button onClick={() => navigate('/blog')} className="mt-4 text-cyan-400 hover:text-cyan-300">
          Back to Blog
        </button>
      </div>
    );
  }

  const currentIndex = ALL_POSTS.findIndex((p) => p.slug === slug);
  const relatedPosts = ALL_POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] text-white"
      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 pb-20">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-12 flex items-center justify-between"
        >
          <button
            onClick={() => navigate('/blog')}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            All Posts
          </button>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </motion.div>

        {/* Article Header */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-300">
            {post.category}
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] leading-tight">{post.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {post.date}
            </span>
            <span>{post.readTime}</span>
          </div>
          <p className="mt-6 text-lg text-white/60 font-light leading-relaxed">{post.excerpt}</p>
        </motion.header>

        <div className="my-10 border-t border-white/10" />

        {/* Article Body */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="prose-custom"
        >
          {renderMarkdown(post.content)}
        </motion.div>

        {/* Post Navigation */}
        <div className="mt-16 flex items-center justify-between border-t border-white/10 pt-8">
          {currentIndex > 0 ? (
            <button
              onClick={() => navigate(`/blog/${ALL_POSTS[currentIndex - 1].slug}`)}
              className="group flex items-center gap-2 text-sm text-white/60 hover:text-white transition"
            >
              <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
              <span className="max-w-[200px] truncate">{ALL_POSTS[currentIndex - 1].title}</span>
            </button>
          ) : <div />}
          {currentIndex < ALL_POSTS.length - 1 ? (
            <button
              onClick={() => navigate(`/blog/${ALL_POSTS[currentIndex + 1].slug}`)}
              className="group flex items-center gap-2 text-sm text-white/60 hover:text-white transition"
            >
              <span className="max-w-[200px] truncate">{ALL_POSTS[currentIndex + 1].title}</span>
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
          ) : <div />}
        </div>

        {/* Related Posts */}
        <div className="mt-16">
          <h3 className="mb-6 text-lg font-semibold">More from the blog</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {relatedPosts.map((related) => (
              <motion.div
                key={related.slug}
                whileHover={{ y: -3 }}
                onClick={() => navigate(`/blog/${related.slug}`)}
                className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06] hover:border-white/20"
              >
                <span className="inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/70">
                  {related.category}
                </span>
                <h4 className="mt-2 text-sm font-medium leading-snug line-clamp-2">{related.title}</h4>
                <p className="mt-1.5 text-xs text-white/50">{related.readTime}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
