"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlaySquare, Video, ArrowRight, Loader2, ListVideo, Star, Quote } from "lucide-react";
import { Footer } from "@/components/ui/Footer";

const REVIEWS = [
  {
    name: "Marcus T.",
    role: "Frontend Developer",
    content: "I used to have 15 YouTube tabs open trying to learn Next.js. Coursify turned a chaotic playlist into a proper course I actually finished.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
    rating: 5
  },
  {
    name: "Sarah J.",
    role: "Data Science Student",
    content: "The timestamped markdown notes are incredible. I can review a 2-hour lecture in 5 minutes by just looking at my synced captures.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    rating: 5
  },
  {
    name: "David K.",
    role: "Self-taught Engineer",
    content: "It feels like premium software. The dark mode, the typography, the hotkeys. It makes studying off YouTube feel professional.",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80",
    rating: 5
  }
];

export default function Home() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !user) return;

    setIsLoading(true);
    setError("");

    try {
      const { importCourse } = await import("@/lib/courses");
      const result = await importCourse(user.uid, url);

      if (result.startsWith("EXISTS_")) {
        setStatusMessage("Course already exists, redirecting you...");
        setIsSuccess(true);
        setTimeout(() => {
          router.push(`/course/${result.replace("EXISTS_", "")}`);
        }, 2000);
      } else {
        setStatusMessage("Course created, redirecting...");
        setIsSuccess(true);
        setTimeout(() => {
          router.push(`/course/${result.replace("CREATED_", "")}`);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your URL.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6">
      <section className="pt-[160px] pb-[120px] min-h-[90vh] grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="flex flex-col gap-6">
          <h1 className="text-5xl lg:text-[4.5rem] font-semibold tracking-tight leading-[1.05] bg-gradient-to-br from-black to-black/60 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
            Convert Watch Time Into Structured Knowledge.
          </h1>
          <p className="text-xl text-muted-foreground lg:text-[1.25rem] max-w-[500px]">
            Don't just watch YouTube. Master it. CoursifyYT extracts structure, generates notes, and tracks your progress across any playlist or video.
          </p>

          <div className="pt-4 max-w-xl">
            {!user ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={signInWithGoogle}
                  className="btn btn-primary"
                >
                  Start Learning Free
                </button>
                <a href="#problem" className="btn btn-secondary flex gap-2">
                  <PlaySquare className="w-4 h-4" /> Watch Demo
                </a>
              </div>
            ) : (
              <form onSubmit={handleCreateCourse} className="flex flex-col gap-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-500 rounded-2xl blur-xl opacity-20 group-focus-within:opacity-50 transition-opacity duration-500" />
                  <div className="relative flex items-center bg-card border border-border rounded-2xl overflow-hidden focus-within:border-primary/50 transition-colors shadow-sm">
                    <div className="pl-4 pr-2 text-muted-foreground">
                      <ListVideo className="w-5 h-5" />
                    </div>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste YouTube Playlist or Video URL..."
                      required
                      className="flex-1 bg-transparent border-none outline-none py-4 px-2 text-foreground placeholder:text-muted-foreground w-full"
                    />
                    <div className="pr-2">
                      <button
                        type="submit"
                        disabled={isLoading || isSuccess || !url}
                        className="bg-primary text-primary-foreground hover:opacity-90 p-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                      >
                        {isLoading || isSuccess ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <ArrowRight className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                {statusMessage && (
                  <div className="text-blue-500 text-sm bg-blue-500/10 border border-blue-500/20 py-2 px-4 rounded-lg animate-in fade-in slide-in-from-top-2 flex items-center gap-2 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> {statusMessage}
                  </div>
                )}
                {error && (
                  <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 py-2 px-4 rounded-lg animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

        <div className="relative perspective-[1000px] h-full flex items-center">
          <div className="glass-panel relative w-full aspect-[16/10] overflow-hidden flex flex-col justify-end p-8 transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-500 z-[1] border-white/10 shadow-2xl">
            <div
              className="absolute inset-0 bg-cover bg-center z-0"
              style={{ backgroundImage: 'url("/image.png")' }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-[1]"></div>

            <div className="relative z-[2] flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="text-[1.8rem] font-semibold tracking-tight text-white">Advanced React Patterns</div>
                <div className="flex items-center gap-1.5 text-xs text-white/50 bg-[var(--widget-source-bg)] px-2.5 py-1 rounded-full backdrop-blur-md">
                  <Video className="w-3.5 h-3.5" /> Playlist
                </div>
              </div>

              <div className="flex gap-10">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--meta-label-color)]">Duration</span>
                  <span className="text-[14px] font-medium text-[var(--meta-value-color)]">4h 12m</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--meta-label-color)]">Modules</span>
                  <span className="text-[14px] font-medium text-[var(--meta-value-color)]">24</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--meta-label-color)]">Instructor</span>
                  <span className="text-[14px] font-medium text-[var(--meta-value-color)]">Frontend Masters</span>
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button className="btn btn-primary px-8 py-2.5">Resume</button>
                <button className="btn btn-secondary px-6 py-2.5">Notes</button>
              </div>
            </div>
          </div>

          <div className="glass-panel absolute right-[-20px] top-[40px] px-5 py-4 flex items-center gap-4 rounded-full z-[10] transform translate-z-[30px] shadow-2xl">
            <div className="text-green-400 bg-green-400/10 p-1.5 rounded-full">
              <ListVideo className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-[var(--text-muted)]">Current Module</span>
              <span className="text-sm font-medium">Custom Hooks</span>
            </div>
          </div>

          <div className="glass-panel absolute bottom-[-30px] right-[40px] px-5 py-4 flex items-center gap-4 rounded-full z-[10] transform translate-z-[50px] shadow-2xl">
            <div className="w-8 h-8 rounded-full bg-[var(--icon-bg)] flex items-center justify-center text-[var(--icon-color)]">
              <PlaySquare className="w-3.5 h-3.5" />
            </div>
            <span className="text-[13px]">Auto-generating summary...</span>
          </div>
        </div>
      </section>

      <section id="problem" className="py-[120px]">
        <div className="text-center mb-[64px] max-w-[600px] mx-auto">
          <h2 className="text-4xl md:text-[3rem] font-semibold tracking-tight mb-4">Stop getting distracted. Start building skills.</h2>
          <p className="text-xl text-muted-foreground lg:text-[1.25rem]">YouTube is the world's greatest library, but it's designed for engagement, not education. We change the interface to change your outcomes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-[48px] flex flex-col gap-6 bg-[var(--comp-bad-bg)] border-[var(--comp-bad-border)]">
            <h3 className="text-2xl font-semibold">The YouTube Experience</h3>
            <ul className="flex flex-col gap-4 text-[var(--text-muted)]">
              <li className="flex items-center gap-3"><div className="text-red-400">×</div> Distracting sidebars and comments</li>
              <li className="flex items-center gap-3"><div className="text-red-400">×</div> No way to track real progress</li>
              <li className="flex items-center gap-3"><div className="text-red-400">×</div> Pausing to manually type notes</li>
              <li className="flex items-center gap-3"><div className="text-red-400">×</div> Losing your place in long playlists</li>
            </ul>
          </div>
          <div className="glass-panel p-[48px] flex flex-col gap-6">
            <h3 className="text-2xl font-semibold">The CoursifyYT Way</h3>
            <ul className="flex flex-col gap-4 text-foreground">
              <li className="flex items-center gap-3"><div className="text-green-400">✓</div> Immersive, distraction-free player</li>
              <li className="flex items-center gap-3"><div className="text-green-400">✓</div> Visual progress rings and stats</li>
              <li className="flex items-center gap-3"><div className="text-green-400">✓</div> AI-synced Markdown notes</li>
              <li className="flex items-center gap-3"><div className="text-green-400">✓</div> Structured curriculums from any link</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="features" className="py-[120px]">
        {/* Feature 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[80px] items-center mb-[120px]">
          <div className="flex flex-col gap-6">
            <div className="text-indigo-400 text-[10px] uppercase font-bold tracking-widest">Structure</div>
            <h2 className="text-4xl md:text-[3rem] font-semibold tracking-tight">Instant Curriculums</h2>
            <p className="text-lg text-[var(--text-muted)] leading-relaxed">Paste a URL. We analyze the video chapters or playlist structure and generate a beautiful, navigable course sidebar. Know exactly what's coming next.</p>
          </div>
          <div className="relative aspect-square flex items-center justify-center">
            <div className="glass-panel w-[80%] p-6 flex flex-col gap-4">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[var(--chapter-bg)] border border-[var(--chapter-border)]">
                <div className="text-green-400">✓</div>
                <div className="flex-1 text-sm font-medium">1. Introduction to State</div>
                <span className="text-xs text-[var(--text-muted)] tabular-nums">12:40</span>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[var(--chapter-active-bg)] border border-[var(--chapter-active-border)] shadow-md">
                <div className="text-primary-foreground">▶</div>
                <div className="flex-1 text-sm font-medium">2. The useEffect Hook</div>
                <span className="text-xs text-[var(--text-muted)] tabular-nums">18:15</span>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[var(--chapter-bg)] border border-[var(--chapter-border)] opacity-50">
                <div className="text-[var(--text-muted)]">○</div>
                <div className="flex-1 text-sm font-medium">3. Context API Basics</div>
                <span className="text-xs text-[var(--text-muted)] tabular-nums">22:00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[80px] items-center md:rtl">
          <div className="flex flex-col gap-6 md:ltr">
            <div className="text-purple-400 text-[10px] uppercase font-bold tracking-widest">Capture</div>
            <h2 className="text-4xl md:text-[3rem] font-semibold tracking-tight">Contextual Markdown Notes</h2>
            <p className="text-lg text-[var(--text-muted)] leading-relaxed">Write notes alongside the video. Press a hotkey to grab a timestamp and screenshot instantly. Or let our AI generate a summary chapter by chapter.</p>
          </div>
          <div className="relative aspect-square flex items-center justify-center md:ltr">
            <div className="glass-panel w-[90%] h-[80%] flex flex-col overflow-hidden">
              <div className="p-4 px-5 border-b border-[var(--glass-border)] flex gap-2 w-full">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--notes-dot-bg)]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--notes-dot-bg)]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--notes-dot-bg)]"></div>
              </div>
              <div className="p-6 flex-1 font-mono text-sm text-[var(--text-muted)] leading-relaxed">
                <span className="text-foreground"># useEffect Mastery</span><br /><br />
                <span className="text-foreground font-semibold">## Dependency Arrays</span><br />
                If left empty `[]`, it runs only on mount.<br /><br />
                <span className="text-indigo-400">[18:12]</span> 🖼️ <i>Captured slide: Cleanup functions</i><br /><br />
                Return a function to clean up subscriptions to prevent memory leaks in React.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-[120px]">
        <div className="text-center mb-[64px] max-w-[600px] mx-auto">
          <div className="text-primary text-[10px] uppercase font-bold tracking-widest mb-4">Success Stories</div>
          <h2 className="text-4xl md:text-[3rem] font-semibold tracking-tight">Loved by learners.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((review, idx) => (
            <div key={idx} className="glass-panel p-8 flex flex-col gap-6 justify-between group hover:border-primary/30 transition-all duration-500">
              <div className="space-y-4">
                <div className="flex gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <div className="relative">
                  <Quote className="w-8 h-8 text-primary/10 absolute -top-4 -left-4" />
                  <p className="text-[1.rem] leading-[1.6] text-foreground relative z-10">{review.content}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <img src={review.avatar} alt={review.name} className="w-10 h-10 rounded-full object-cover bg-muted ring-2 ring-primary/20" />
                <div>
                  <div className="font-bold text-sm">{review.name}</div>
                  <div className="text-xs text-muted-foreground">{review.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="py-[120px]">
        <div className="text-center mb-[64px] max-w-[600px] mx-auto">
          <h2 className="text-4xl md:text-[3rem] font-semibold tracking-tight">Invest in your intellect.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[800px] mx-auto">
          <div className="glass-panel p-12 flex flex-col gap-8">
            <div>
              <h3 className="text-2xl text-[var(--text-muted)] font-medium mb-2">Basic</h3>
              <div className="text-[3.5rem] font-bold tracking-tight flex items-baseline gap-1">
                $0 <span className="text-base font-normal text-[var(--text-muted)]">/ forever</span>
              </div>
            </div>
            <ul className="flex flex-col gap-4">
              <li className="flex items-center gap-3 text-[0.95rem]"><div className="text-green-400">✓</div> 4 YouTube imported courses</li>
              <li className="flex items-center gap-3 text-[0.95rem]"><div className="text-green-400">✓</div> 1 Custom mixed course</li>
              <li className="flex items-center gap-3 text-[0.95rem]"><div className="text-green-400">✓</div> Distraction-free player</li>
              <li className="flex items-center gap-3 text-[0.95rem]"><div className="text-green-400">✓</div> Manual Markdown notes</li>
            </ul>
            <button
              onClick={() => router.push(user ? '/dashboard' : '/#pricing')}
              className="btn btn-secondary mt-auto"
            >
              {user ? "Current Plan" : "Get Started"}
            </button>
          </div>
          <div className="glass-panel p-12 flex flex-col gap-8 bg-[var(--pro-card-bg)] border-t-[var(--pro-card-border)] shadow-[var(--pro-card-shadow)]">
            <div>
              <h3 className="text-2xl text-[var(--text-muted)] font-medium mb-2">Pro</h3>
              <div className="text-[3.5rem] font-bold tracking-tight flex items-baseline gap-1">
                $8 <span className="text-base font-normal text-[var(--text-muted)]">/ month</span>
              </div>
            </div>
            <ul className="flex flex-col gap-4">
              <li className="flex items-center gap-3 text-[0.95rem]"><div className="text-indigo-400">✓</div> Unlimited Courses</li>
              <li className="flex items-center gap-3 text-[0.95rem]"><div className="text-indigo-400">✓</div> Cloud sync across devices</li>
              <li className="flex items-center gap-3 text-[0.95rem]"><div className="text-indigo-400">✓</div> AI Auto-summaries</li>
              <li className="flex items-center gap-3 text-[0.95rem]"><div className="text-indigo-400">✓</div> Export notes to Notion/Obsidian</li>
            </ul>
            <button
              onClick={() => router.push('/#pricing')}
              className="btn btn-primary mt-auto"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </section>

      <section className="py-[160px] text-center">
        <div className="glass-panel p-10 md:p-20 flex flex-col items-center gap-8 bg-[var(--cta-bg)]">
          <h2 className="text-4xl md:text-[3rem] font-semibold tracking-tight">Ready to actually finish a course?</h2>
          <p className="text-[1.2rem] text-[var(--text-muted)] max-w-[400px] text-center">Join 10,000+ learners who have upgraded their YouTube study habits.</p>
          {!user ? (
            <button
              onClick={signInWithGoogle}
              className="btn btn-primary px-10 py-4 text-[1.1rem]"
            >
              Start Learning Free
            </button>
          ) : (
            <Link href="/dashboard" className="btn btn-primary px-10 py-4 text-[1.1rem]">
              Go to Dashboard
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
