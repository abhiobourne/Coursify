"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlaySquare, Video, ArrowRight, Loader2, ListVideo } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !user) return;

    setIsLoading(true);
    setError("");

    try {
      const { importCourse } = await import("@/lib/courses");
      const courseId = await importCourse(user.uid, url);
      router.push(`/course/${courseId}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your URL.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[128px] -z-10 mix-blend-screen pointer-events-none" />

      <div className="max-w-4xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 mb-4">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          Turn passive watching into active learning
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-glow">
          Your Personal <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">
            YouTube University
          </span>
        </h1>

        <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Paste any YouTube video or playlist URL and instantly generate a structured, trackable course with built-in notes and progress saving.
        </p>

        <div className="pt-8 max-w-xl mx-auto">
          {!user ? (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={signInWithGoogle}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-900 font-bold text-lg hover:scale-105 transition-all duration-300 overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.3)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                Get Started for Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-sm text-zinc-500">No credit card required. Sign in with Google.</p>
            </div>
          ) : (
            <form onSubmit={handleCreateCourse} className="flex flex-col gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-500 rounded-2xl blur-xl opacity-20 group-focus-within:opacity-50 transition-opacity duration-500" />
                <div className="relative flex items-center bg-zinc-900/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl focus-within:border-primary/50 transition-colors">
                  <div className="pl-4 pr-2 text-zinc-500">
                    <ListVideo className="w-5 h-5" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste YouTube Playlist or Video URL..."
                    required
                    className="flex-1 bg-transparent border-none outline-none py-4 px-2 text-white placeholder:text-zinc-600 w-full"
                  />
                  <div className="pr-2">
                    <button
                      type="submit"
                      disabled={isLoading || !url}
                      className="bg-primary hover:bg-primary/90 text-white p-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <ArrowRight className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {error && (
                <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 py-2 px-4 rounded-lg animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6 pt-16 text-left">
          {[
            {
              icon: <ListVideo className="w-6 h-6 text-primary" />,
              title: "Playlists to Courses",
              desc: "Automatically extracts all videos, calculates duration, and builds a curriculum."
            },
            {
              icon: <Video className="w-6 h-6 text-indigo-400" />,
              title: "Smart Player",
              desc: "Distraction-free environment with theater mode and continuous playback."
            },
            {
              icon: <PlaySquare className="w-6 h-6 text-purple-400" />,
              title: "Markdown Notes",
              desc: "Take rich-text notes synced perfectly to each video in your course."
            }
          ].map((feature, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
