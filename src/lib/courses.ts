import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    updateDoc,
    serverTimestamp,
    increment,
    writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { YouTubeCourseData } from './youtube';

export interface Course {
    id: string; // YouTube playlist ID or Video ID
    userId: string;
    title: string;
    sourceUrl: string;
    thumbnailUrl: string;
    totalDuration: number;
    completedDuration: number;
    description?: string;
    instructorName?: string;
    createdAt: any;
    updatedAt: any;
    tags?: string[];
}

export interface CourseVideo {
    id: string; // YouTube Video ID
    courseId: string;
    title: string;
    thumbnailUrl: string;
    duration: number;
    isCompleted: boolean;
    isFavorite?: boolean;
    order: number;
    startTime?: number; // start time in seconds for segments
    endTime?: number;   // end time in seconds for segments (optional)
}

export interface CustomCourseChapter {
    title: string;
    url: string;
    startTime?: number;
    endTime?: number;
    thumbnailUrl?: string;
    duration?: number;
    videoId?: string;
}

export interface FavoriteVideo {
    id: string; // Composite: userId_courseId_videoId[_startTime]
    userId: string;
    courseId: string;
    videoId: string;
    title: string;
    thumbnailUrl: string;
    duration: number;
    createdAt: any;
    startTime?: number;
}

export interface Note {
    id: string;
    userId: string;
    courseId: string;
    videoId: string;
    content: string;
    updatedAt: any;
}

export interface DailyActivity {
    id: string;
    userId: string;
    dateStr: string; // YYYY-MM-DD
    secondsStudied: number;
    updatedAt: any;
}

// Helper to get YouTube ID from URL
export function getYouTubeIdFromUrl(url: string): string | null {
    let parsedUrl = url;
    if (!parsedUrl.startsWith('http')) {
        parsedUrl = 'https://' + parsedUrl;
    }

    try {
        const urlObj = new URL(parsedUrl);
        const playlistId = urlObj.searchParams.get('list');
        if (playlistId) return playlistId;

        const videoIdMatch = parsedUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
        if (videoIdMatch && videoIdMatch[1]) return videoIdMatch[1];
    } catch (e) {
        return null;
    }
    return null;
}

// Get a single course by ID
export async function getCourse(courseId: string): Promise<Course | null> {
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (courseSnap.exists()) {
        return { id: courseSnap.id, ...courseSnap.data() } as Course;
    }
    return null;
}

// Full import flow
export async function importCourse(userId: string, url: string): Promise<string> {
    const ytId = getYouTubeIdFromUrl(url);
    if (!ytId) throw new Error("Invalid YouTube URL");

    // 1. Check if course already exists
    const courseId = `${userId}_${ytId}`;
    const existing = await getCourse(courseId);
    if (existing) return "EXISTS_" + existing.id;

    // 2. Fetch metadata from API
    const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to parse YouTube URL");
    }

    const ytData = await res.json();

    // 3. Create the course in Firestore
    const newId = await createCourseFromYouTube(userId, url, ytData);
    return "CREATED_" + newId;
}

// Save a new course from YouTube Data
export async function createCourseFromYouTube(
    userId: string,
    sourceUrl: string,
    ytData: YouTubeCourseData
): Promise<string> {
    // Use the YouTube ID directly or a composite to prevent duplicates
    const courseId = `${userId}_${ytData.id}`;

    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);

    // If it already exists, return it
    if (courseSnap.exists()) {
        return courseId;
    }

    // Use a batch to ensure everything saves together
    const batch = writeBatch(db);

    // 1. Save Course Metadata
    batch.set(courseRef, {
        id: courseId,
        originalId: ytData.id,
        userId,
        title: ytData.title,
        sourceUrl,
        thumbnailUrl: ytData.thumbnailUrl,
        totalDuration: ytData.totalDuration,
        completedDuration: 0,
        description: ytData.description || "",
        instructorName: ytData.channelTitle || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    // 2. Save Videos
    ytData.videos.forEach((video, index) => {
        // We use a composite ID for videos to ensure uniqueness within a course
        // Since one YouTube ID can have multiple segments, we include startTime in the doc ID
        const segmentSuffix = video.startTime ? `_s${video.startTime}` : '';
        const videoRef = doc(db, 'course_videos', `${courseId}_${video.id}${segmentSuffix}`);
        batch.set(videoRef, {
            id: video.id,
            courseId: courseId,
            title: video.title,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.duration,
            isCompleted: false,
            isFavorite: false,
            order: index,
            startTime: video.startTime || 0
        });
    });

    await batch.commit();
    return courseId;
}

// Create a custom course manually
export async function createCustomCourse(
    userId: string,
    title: string,
    description: string,
    chapters: CustomCourseChapter[],
    instructorName?: string
): Promise<string> {
    // Generate a unique ID for the custom course
    const courseId = `${userId}_custom_${Date.now()}`;
    const courseRef = doc(db, 'courses', courseId);

    const batch = writeBatch(db);

    // Use the first chapter's thumbnail as the course thumbnail if available
    const thumbnailUrl = chapters.find(c => c.thumbnailUrl)?.thumbnailUrl ||
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2073&auto=format&fit=crop";

    // Calculate total duration
    const totalDuration = chapters.reduce((acc, c) => acc + (c.duration || 0), 0);

    // 1. Save Course Metadata
    batch.set(courseRef, {
        id: courseId,
        userId,
        title,
        description,
        sourceUrl: "custom",
        thumbnailUrl,
        totalDuration,
        completedDuration: 0,
        instructorName: instructorName || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    // 2. Save Videos (Chapters)
    chapters.forEach((chapter, index) => {
        const videoId = chapter.videoId || `custom_${index}`;
        const segmentSuffix = chapter.startTime ? `_s${chapter.startTime}` : '';
        const videoRef = doc(db, 'course_videos', `${courseId}_${videoId}${segmentSuffix}`);

        batch.set(videoRef, {
            id: videoId,
            courseId: courseId,
            title: chapter.title,
            thumbnailUrl: chapter.thumbnailUrl || thumbnailUrl,
            duration: chapter.duration || 0,
            isCompleted: false,
            isFavorite: false,
            order: index,
            startTime: chapter.startTime || 0,
            endTime: chapter.endTime || 0
        });
    });

    await batch.commit();
    return courseId;
}

// Get all courses for a user
export async function getUserCourses(userId: string): Promise<Course[]> {
    const q = query(
        collection(db, 'courses'),
        where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const courses = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Course));

    // Sort in memory to avoid Firestore composite index requirement
    return courses.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis?.() || 0;
        const timeB = b.updatedAt?.toMillis?.() || 0;
        return timeB - timeA; // Descending
    });
}



// Get all videos for a course
export async function getCourseVideos(courseId: string): Promise<CourseVideo[]> {
    const q = query(
        collection(db, 'course_videos'),
        where('courseId', '==', courseId)
    );

    const snapshot = await getDocs(q);
    const videos = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id } as any));

    // Sort in memory to avoid Firestore composite index requirement
    return videos.sort((a, b) => a.order - b.order); // Ascending
}

// Update an existing custom course
export async function updateCustomCourse(
    courseId: string,
    title: string,
    description: string,
    chapters: CustomCourseChapter[],
    instructorName?: string
): Promise<void> {
    const courseRef = doc(db, 'courses', courseId);
    const batch = writeBatch(db);

    // 1. Calculate total duration and find primary thumbnail
    const totalDuration = chapters.reduce((acc, c) => acc + (c.duration || 0), 0);
    const thumbnailUrl = chapters.find(c => c.thumbnailUrl)?.thumbnailUrl ||
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2073&auto=format&fit=crop";

    // 2. Update Course Metadata
    batch.update(courseRef, {
        title,
        description,
        thumbnailUrl,
        totalDuration,
        instructorName: instructorName || "",
        updatedAt: serverTimestamp()
    });

    // 3. Clear old chapters (videos) and add new ones
    // First, we get all existing video docs for this course
    const q = query(
        collection(db, 'course_videos'),
        where('courseId', '==', courseId)
    );
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    // 4. Add new chapters
    chapters.forEach((chapter, index) => {
        const videoId = chapter.videoId || `custom_${index}`;
        const segmentSuffix = chapter.startTime ? `_s${chapter.startTime}` : '';
        const videoRef = doc(db, 'course_videos', `${courseId}_${videoId}${segmentSuffix}`);

        batch.set(videoRef, {
            id: videoId,
            courseId: courseId,
            title: chapter.title,
            thumbnailUrl: chapter.thumbnailUrl || thumbnailUrl,
            duration: chapter.duration || 0,
            isCompleted: false, // In a more complex app, we might want to preserve completion state
            isFavorite: false,
            order: index,
            startTime: chapter.startTime || 0,
            endTime: chapter.endTime || 0
        });
    });

    await batch.commit();
}

// Mark video as completed/uncompleted
export async function toggleVideoCompletion(
    userId: string,
    courseId: string,
    videoId: string,
    currentStatus: boolean,
    duration: number,
    startTime: number = 0
): Promise<void> {
    const segmentSuffix = startTime ? `_s${startTime}` : '';
    const videoRef = doc(db, 'course_videos', `${courseId}_${videoId}${segmentSuffix}`);
    const courseRef = doc(db, 'courses', courseId);

    const batch = writeBatch(db);

    // Update video status
    batch.update(videoRef, { isCompleted: !currentStatus });

    // Update total completed duration in course
    const durationChange = currentStatus ? -duration : duration;
    batch.update(courseRef, {
        completedDuration: increment(durationChange),
        updatedAt: serverTimestamp()
    });

    // Update Daily Activity
    // Note: Activity tracking is now handled by the heartbeat mechanism in CoursePlayer
    // to ensure time is recorded even if the video isn't marked as complete.

    await batch.commit();
}

// Save note for a video
export async function saveVideoNote(
    userId: string,
    courseId: string,
    videoId: string,
    content: string,
    startTime: number = 0
): Promise<void> {
    const segmentSuffix = startTime ? `_s${startTime}` : '';
    const noteId = `${userId}_${videoId}${segmentSuffix}`;
    const noteRef = doc(db, 'notes', noteId);

    await setDoc(noteRef, {
        id: noteId,
        userId,
        courseId,
        videoId,
        content,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

// Get note for a video
export async function getVideoNote(userId: string, videoId: string, startTime: number = 0): Promise<Note | null> {
    const segmentSuffix = startTime ? `_s${startTime}` : '';
    const noteId = `${userId}_${videoId}${segmentSuffix}`;
    const noteRef = doc(db, 'notes', noteId);
    const docSnap = await getDoc(noteRef);

    if (docSnap.exists()) {
        return { ...docSnap.data() } as Note;
    }
    return null;
}

// Delete a course and all its videos
export async function deleteCourse(courseId: string): Promise<void> {
    const batch = writeBatch(db);

    // 1. Delete the course document
    const courseRef = doc(db, 'courses', courseId);
    batch.delete(courseRef);

    // 2. Query and delete all videos for the course
    const q = query(
        collection(db, 'course_videos'),
        where('courseId', '==', courseId)
    );
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    // 3. (Optional) Notes are left orphaned, but we could delete them as well if needed.

    // 4. Delete favorites associated with this course
    const favQ = query(
        collection(db, 'favorites'),
        where('courseId', '==', courseId)
    );
    const favSnapshot = await getDocs(favQ);
    favSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
}

// Toggle Favorite Video
export async function toggleVideoFavorite(
    userId: string,
    courseId: string,
    video: CourseVideo,
    isCurrentlyFavorite: boolean
): Promise<void> {
    const segmentSuffix = video.startTime ? `_s${video.startTime}` : '';
    const favId = `${userId}_${courseId}_${video.id}${segmentSuffix}`;
    const favRef = doc(db, 'favorites', favId);

    const videoRef = doc(db, 'course_videos', `${courseId}_${video.id}${segmentSuffix}`);
    const batch = writeBatch(db);

    batch.update(videoRef, { isFavorite: !isCurrentlyFavorite });

    if (isCurrentlyFavorite) {
        batch.delete(favRef);
    } else {
        batch.set(favRef, {
            id: favId,
            userId,
            courseId,
            videoId: video.id,
            title: video.title,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.duration,
            startTime: video.startTime || 0,
            createdAt: serverTimestamp()
        });
    }

    await batch.commit();
}

// Get user's favorite videos
export async function getFavoriteVideos(userId: string): Promise<FavoriteVideo[]> {
    const q = query(
        collection(db, 'favorites'),
        where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const favs = snapshot.docs.map(doc => doc.data() as FavoriteVideo);

    // Sort in memory
    return favs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
    });
}

// Update course tags
export async function updateCourseTags(courseId: string, tags: string[]): Promise<void> {
    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, {
        tags,
        updatedAt: serverTimestamp()
    });
}

// Get user activity
export async function getUserActivity(userId: string): Promise<DailyActivity[]> {
    const q = query(
        collection(db, 'activity'),
        where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const activities = snapshot.docs.map(doc => doc.data() as DailyActivity);
    return activities.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
}

// Record study time (heartbeat)
export async function recordStudyTime(userId: string, seconds: number): Promise<void> {
    if (!userId || seconds <= 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const activityRef = doc(db, 'activity', `${userId}_${todayStr}`);

    await setDoc(activityRef, {
        id: `${userId}_${todayStr}`,
        userId,
        dateStr: todayStr,
        secondsStudied: increment(seconds),
        updatedAt: serverTimestamp()
    }, { merge: true });
}
