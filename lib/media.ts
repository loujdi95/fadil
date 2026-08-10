/* Médias locaux fournis par le coiffeur (dans /public/media).
   Pour en ajouter : dépose le fichier dans le dossier puis ajoute une ligne ici. */

export type Media =
  | { type: "photo"; src: string; caption?: string }
  | { type: "video"; src: string; caption?: string };

export const MEDIA: Media[] = [
  { type: "video", src: "/media/videos/video-1.mp4" },
  { type: "photo", src: "/media/photos/coupe-1.jpg" },
  { type: "photo", src: "/media/photos/coupe-2.jpg" },
  { type: "video", src: "/media/videos/video-2.mp4" },
  { type: "photo", src: "/media/photos/coupe-3.jpg" },
  { type: "photo", src: "/media/photos/coupe-4.jpg" },
  { type: "photo", src: "/media/photos/coupe-5.jpg" },
  { type: "video", src: "/media/videos/video-3.mp4" },
  { type: "photo", src: "/media/photos/coupe-6.jpg" },
  { type: "video", src: "/media/videos/video-4.mp4" },
  { type: "photo", src: "/media/photos/coupe-7.jpg" },
  { type: "photo", src: "/media/photos/coupe-8.jpg" },
  { type: "video", src: "/media/videos/video-5.mp4" },
  { type: "photo", src: "/media/photos/coupe-9.jpg" },
];
