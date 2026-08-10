"use client";

import { storage, isFirebaseReady } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addGalleryItem } from "./store";

/** Upload une image : Firebase Storage si dispo, sinon data URL (mode démo). */
export async function uploadGalleryImage(file: File, caption?: string): Promise<void> {
  if (isFirebaseReady && storage) {
    const path = `gallery/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const r = ref(storage, path);
    await uploadBytes(r, file);
    const url = await getDownloadURL(r);
    await addGalleryItem(url, caption);
    return;
  }
  // démo : convertit en data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  await addGalleryItem(dataUrl, caption);
}
