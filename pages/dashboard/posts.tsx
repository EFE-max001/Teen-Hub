import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useSession } from 'next-auth/react'
import { GetServerSideProps } from 'next'
import { requireAuth } from '@/lib/middleware'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import GlowButton from '@/components/ui/GlowButton'
import { GlowTextarea, GlowInput } from '@/components/ui/GlowInput'

const ROLE_LABEL: Record<string, string> = {
  FOUNDER: '[Founder]', ADMIN: '[Admin]', COORDINATOR: '[Coord]',
  MODERATOR: '[Mod]', COORDINATOR_MEMBER: '[Coord]',
}

const ROLE_COLOR: Record<string, string> = {
  FOUNDER: 'text-amber-400', ADMIN: 'text-red-400',
  COORDINATOR: 'text-orange-400', MODERATOR: 'text-blue-400',
}

export default function PostsPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', visibility: 'MEMBERS_ONLY', isAnonymous: false })
  const [error, setError] = useState('')

  useEffect(() => { loadPosts() }, [])

  async function loadPosts() {
    setLoading(true)
    const data = await fetch('/api/posts').then(r => r.json()).catch(() => ({ posts: [] }))
    setPosts(data.posts || [])
    setLoading(false)
  }

  async function submitPost() {
    if (!form.content.trim()) return setError('Write something first')
    setError('')
    setPosting(true)
    const r = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await r.json()
    if (!r.ok) { setError(d.error || 'Failed to post'); setPosting(false); return }
    setForm({ title: '', content: '', visibility: 'MEMBERS_ONLY', isAnonymous: false })
    setShowForm(false)
    setPosting(false)
    await loadPosts()
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    setPosts(p => p.filter(x => x.id !== id))
  }

  const userRole = session?.user?.role || 'GUEST'
  const isStaff = ['ADMIN', 'COORDINATOR', 'MODERATOR', 'FOUNDER'].includes(userRole)

  return (
    <>
      <Head><title>Community — QuestHub Guild</title></Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-orbitron font-black text-xl text-white">GUILD BOARD</h1>
              <p className="font-rajdhani text-slate-500 text-sm mt-0.5">Announcements, updates, and community posts</p>
            </div>
            <GlowButton variant="primary" size="sm" onClick={() => setShowForm(s => !s)}>
              {showForm ? 'CANCEL' : '+ POST'}
            </GlowButton>
          </div>

          {showForm && (
            <div className="bg-[#0d0017] border border-purple-500/30 p-5 flex flex-col gap-4">
              <h2 className="font-orbitron font-bold text-sm text-white tracking-widest">NEW POST</h2>
              <GlowInput
                label="Title (optional)"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Post title..."
              />
              <GlowTextarea
                label="Content"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="What do you want to share with the guild?"
                rows={4}
              />
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="font-orbitron text-[9px] text-purple-400/60 tracking-widest uppercase block mb-1">Visibility</label>
                  <select
                    value={form.visibility}
                    onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}
                    className="bg-[#0a0010] border border-purple-500/30 text-slate-300 font-rajdhani text-sm px-3 py-1.5"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="MEMBERS_ONLY">Members Only</option>
                    <option value="ACCEPTED_ONLY">Accepted Members+</option>
                  </select>
                </div>
                {isStaff && (
                  <label className="flex items-center gap-2 cursor-pointer mt-4">
                    <input
                      type="checkbox"
                      checked={form.isAnonymous}
                      onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))}
                      className="w-4 h-4 accent-purple-500"
                    />
                    <span className="font-rajdhani text-sm text-slate-400">Post anonymously</span>
                  </label>
                )}
              </div>
              {error && <p className="font-rajdhani text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3">
                <GlowButton variant="primary" size="sm" loading={posting} onClick={submitPost}>
                  PUBLISH
                </GlowButton>
                <GlowButton variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  CANCEL
                </GlowButton>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-orbitron text-slate-600 text-sm">No posts yet</p>
              <p className="font-rajdhani text-slate-700 text-xs mt-1">Be the first to post something</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map(post => {
                const authorRole = post.author?.role
                const isOwner = post.author?.id === session?.user?.id
                const isAdminUser = ['ADMIN', 'FOUNDER'].includes(userRole)
                return (
                  <div
                    key={post.id}
                    className={`bg-[#0d0017] border p-5 flex flex-col gap-3 ${
                      post.isPinned ? 'border-amber-500/40' : 'border-purple-500/20'
                    }`}
                  >
                    {post.isPinned && (
                      <span className="font-orbitron text-[9px] text-amber-400 tracking-widest">📌 PINNED</span>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {authorRole && ROLE_LABEL[authorRole] && (
                            <span className={`font-orbitron text-[10px] tracking-widest ${ROLE_COLOR[authorRole] || 'text-slate-500'}`}>
                              {ROLE_LABEL[authorRole]}
                            </span>
                          )}
                          <span className="font-orbitron font-bold text-sm text-white">
                            {post.author?.nickname || 'Anonymous'}
                          </span>
                          {post.author?.activeTitle && (
                            <span className="font-rajdhani text-xs text-purple-400 italic">
                              "{post.author.activeTitle}"
                            </span>
                          )}
                        </div>
                        <span className="font-rajdhani text-[11px] text-slate-600">
                          {new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {(isOwner || isAdminUser) && (
                        <button
                          onClick={() => deletePost(post.id)}
                          className="text-slate-700 hover:text-red-400 transition-colors text-sm"
                          title="Delete post"
                        >✕</button>
                      )}
                    </div>
                    {post.title && (
                      <h3 className="font-orbitron font-bold text-base text-white">{post.title}</h3>
                    )}
                    <p className="font-rajdhani text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const redirect = await requireAuth(context, 'TRIAL_MEMBER')
  if (redirect) return redirect
  return { props: {} }
}
