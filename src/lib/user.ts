import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export interface UserProfile {
    uid: string;
    displayName: string | null;
    bio: string | null;
    updatedAt: number;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            await updateDoc(docRef, {
                ...data,
                updatedAt: Date.now()
            });
        } else {
            // Create if it doesn't exist
            await setDoc(docRef, {
                uid,
                displayName: data.displayName || null,
                bio: data.bio || null,
                updatedAt: Date.now()
            });
        }
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
}
