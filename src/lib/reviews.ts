import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, limit } from "firebase/firestore";
import { db } from "./firebase";

export interface Review {
    id?: string;
    userId: string;
    userName: string;
    userPhotoUrl?: string;
    rating: number;
    content: string;
    createdAt?: any;
}

export async function submitReview(reviewData: Omit<Review, "id" | "createdAt">): Promise<string> {
    const reviewsRef = collection(db, "reviews");
    const docRef = await addDoc(reviewsRef, {
        ...reviewData,
        createdAt: serverTimestamp()
    });
    return docRef.id;
}

export async function getRecentReviews(maxCount: number = 20): Promise<Review[]> {
    const q = query(
        collection(db, "reviews"),
        orderBy("createdAt", "desc"),
        limit(maxCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
}
