const names = ["Amir", "Aina", "Daniel", "Farah", "Hafiz", "Mei Ling"];
const sampleProfiles = {
  Amir: {
    bio: "Kenali asas pemanduan secara berperingkat, daripada kawalan kereta hingga keyakinan di jalan raya.",
    detailPhoto: "/media/amir-profile.webp",
    gallery: [
      { url: "/media/amir-lesson.webp", alt: "Cikgu Amir menyemak latihan bersama pelajar" },
      { url: "/media/amir-circuit.webp", alt: "Cikgu Amir di litar latihan bersama kereta sekolah memandu" },
    ],
  },
  Aina: {
    bio: "Pembelajaran yang tenang dan berperingkat membantu pelajar memahami asas pemanduan dengan lebih yakin.",
    gallery: [
      { url: "/media/aina-lesson.webp", alt: "Cikgu Aina menunjukkan kereta latihan kepada pelajar" },
      { url: "/media/aina-coaching.webp", alt: "Cikgu Aina menerangkan latihan menggunakan papan klip" },
    ],
  },
  Daniel: {
    gallery: [
      { url: "/media/profile-lesson.webp", alt: "Cikgu Daniel membimbing pelajar di tempat duduk pemandu" },
      { url: "/media/profile-car.webp", alt: "Kereta latihan di litar memandu" },
      { url: "/media/profile-coaching.webp", alt: "Cikgu Daniel menyemak latihan bersama pelajar" },
    ],
  },
};

export const demoInstructors = names.map((short) => {
  const slug = "cikgu-" + short.toLowerCase().replace(" ", "-");
  return {
    id: slug,
    slug,
    name: "Cikgu " + short,
    institute: "Institut Memandu Contoh",
    state: "Johor",
    district: "Johor Bahru",
    languages: "Melayu & Inggeris",
    spim: ["D", "DA"],
    experience: "5 tahun",
    other: "Bimbingan berperingkat",
    bio: "Bimbingan yang jelas untuk membina asas pemanduan dan keyakinan di jalan raya.",
    photo: "/media/" + short.toLowerCase().replace(" ", "-") + ".webp",
    gallery: [],
    demo: true,
    ...sampleProfiles[short],
  };
});
export const demoInstitutes = [
  {
    name: "Institut Memandu Contoh",
    slug: "institut-memandu-contoh",
    state: "Johor",
    district: "Johor Bahru",
    demo: true,
  },
];
