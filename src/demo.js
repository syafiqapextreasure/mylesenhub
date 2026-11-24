const names = ["Amir", "Aina", "Daniel", "Farah", "Hafiz", "Mei Ling"];
export const demoInstructors = names.map((short, i) => {
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
