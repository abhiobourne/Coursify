"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { User, Mail, Shield, CreditCard, ChevronRight, Zap, Bell, LogOut, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { updateProfile } from "firebase/auth";
import { getUserProfile, updateUserProfile } from "@/lib/user";
import { getUserCourses } from "@/lib/courses";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { user, logOut } = useAuth();
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [ytCourseCount, setYtCourseCount] = useState(0);
    const [customCourseCount, setCustomCourseCount] = useState(0);
    const [activeTab, setActiveTab] = useState<'profile' | 'subscription'>('profile');

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || "");
            getUserProfile(user.uid).then(profile => {
                if (profile?.bio) {
                    setBio(profile.bio);
                }
                setIsLoadingProfile(false);
            });
            getUserCourses(user.uid).then(courses => {
                const ytCourses = courses.filter(c => c.sourceUrl !== 'custom').length;
                const customCourses = courses.filter(c => c.sourceUrl === 'custom').length;
                setYtCourseCount(ytCourses);
                setCustomCourseCount(customCourses);
            });
        }
    }, [user]);

    if (!user) return null;

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);

        try {
            // Update auth profile
            if (displayName !== user.displayName) {
                await updateProfile(user, { displayName });
            }

            // Update firestore profile for extra fields like bio
            await updateUserProfile(user.uid, {
                displayName,
                bio
            });

            toast.success("Profile updated successfully", {
                style: { background: "#22c55e", color: "#fff", border: "none" }
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="container mx-auto px-6 pt-32 pb-20 max-w-4xl">
            <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4 mb-2">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all border border-white/5"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground">Account Settings</h1>
                        <p className="text-muted-foreground mt-1">Manage your profile, subscription, and preferences.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar Nav */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-2xl font-bold border transition-all",
                                activeTab === 'profile' ? "bg-primary/10 text-primary border-primary/20" : "hover:bg-card/50 text-muted-foreground border-transparent"
                            )}
                        >
                            <span className="flex items-center gap-3">
                                <User className="w-4 h-4" /> Profile Info
                            </span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setActiveTab('subscription')}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-2xl font-bold border transition-all",
                                activeTab === 'subscription' ? "bg-primary/10 text-primary border-primary/20" : "hover:bg-card/50 text-muted-foreground border-transparent"
                            )}
                        >
                            <span className="flex items-center gap-3">
                                <CreditCard className="w-4 h-4" /> Subscription
                            </span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <DropdownMenuSeparator className="my-2 bg-border" />
                        <button
                            onClick={logOut}
                            className="flex items-center justify-between p-4 rounded-2xl hover:bg-red-500/10 text-red-500 font-medium border border-transparent transition-all"
                        >
                            <span className="flex items-center gap-3">
                                <LogOut className="w-4 h-4" /> Sign Out
                            </span>
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        {/* Profile Section */}
                        {activeTab === 'profile' && (
                            <section className="glass-panel p-8 rounded-3xl border border-border/50 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full border-4 border-primary/20 overflow-hidden ring-4 ring-background">
                                            {user.photoURL ? (
                                                <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <User className="w-10 h-10" />
                                                </div>
                                            )}
                                        </div>
                                        <button className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white shadow-lg transform translate-x-1/4 translate-y-1/4 hover:scale-110 transition-transform">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{user.displayName}</h3>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider">
                                            {(ytCourseCount > 4 || customCourseCount > 1) ? "Pro Member" : "Free Tier Account"}
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="displayName">Display Name</Label>
                                            <Input
                                                id="displayName"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                placeholder="Your Name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input id="email" value={user.email || ""} disabled className="opacity-60" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bio">About You</Label>
                                        <textarea
                                            id="bio"
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            className="w-full h-24 bg-background border border-border rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            placeholder={isLoadingProfile ? "Loading..." : "Tell us about your learning goals..."}
                                            disabled={isLoadingProfile}
                                        />
                                    </div>
                                    <Button type="submit" disabled={isUpdating} className="rounded-xl px-8 h-12 shadow-lg shadow-primary/20">
                                        {isUpdating ? "Saving Changes..." : "Save Profile Details"}
                                    </Button>
                                </form>
                            </section>
                        )}

                        {/* Subscription Section */}
                        {activeTab === 'subscription' && (
                            <section className="glass-panel p-8 rounded-3xl border border-border/50 space-y-6 relative overflow-hidden group animate-in fade-in zoom-in-95 duration-300">
                                <div className="absolute top-0 right-0 p-8 transform translate-x-1/4 -translate-y-1/4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Zap className="w-48 h-48 text-primary fill-current" />
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        Current Plan
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${(ytCourseCount > 4 || customCourseCount > 1) ? "bg-amber-500/20 text-amber-500" : "bg-primary/10 text-primary"}`}>
                                            {(ytCourseCount > 4 || customCourseCount > 1) ? "Pro" : "Free"}
                                        </span>
                                    </h3>
                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                                <CheckCircle2 className="w-3 h-3" />
                                            </div>
                                            <span>{(ytCourseCount > 4 || customCourseCount > 1) ? "Unlimited Courses" : `${Math.max(0, 4 - ytCourseCount)} YT Course Slots Remaining`}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                                <CheckCircle2 className="w-3 h-3" />
                                            </div>
                                            <span>Standard Video Playback</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="w-5 h-5 rounded-full bg-zinc-500/10 flex items-center justify-center text-muted-foreground/40">
                                                <Zap className="w-3 h-3" />
                                            </div>
                                            <span className="text-muted-foreground">AI Summaries (Pro Feature)</span>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => router.push('/pricing')}
                                        variant="outline"
                                        className="w-full h-14 rounded-2xl border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-bold text-base group"
                                    >
                                        Upgrade to Pro Today
                                        <Zap className="w-4 h-4 ml-2 fill-current group-hover:animate-pulse" />
                                    </Button>
                                    <p className="text-[10px] text-center mt-4 text-muted-foreground uppercase tracking-widest font-medium">Unlock unlimited potential with Coursify Pro.</p>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper icons needed but not imported
import { Pencil } from "lucide-react";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
