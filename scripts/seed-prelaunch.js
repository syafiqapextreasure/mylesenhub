import { neon } from "@neondatabase/serverless";

// Run explicitly on the selected prelaunch or acceptance branch. This seed is
// independent of deployment. --update-map-links only replaces the original seeded searches.
if (!process.env.NEON_BRANCH || process.argv[2] !== process.env.NEON_BRANCH) {
  throw new Error(
    "Pass the exact configured NEON_BRANCH as the first argument.",
  );
}
const sql = neon(process.env.DATABASE_URL);
const melakaSource = "https://www.jpj.gov.my/senarai-institut-memandu-melaka/";
const institutes = [
  {
    id: "berjaya-taman-perling",
    placeId: "ChIJZyc7mx9z2jERMStJ75ystp4",
    name: "Pusat Latihan Memandu Berjaya Berhad",
    address:
      "Lot 3355, Jalan Persisiran Perling 1, Taman Perling, 81200 Johor Bahru, Johor",
    state: "Johor",
    district: "Johor Bahru",
    postcode: "81200",
    source: "https://berjayabhd.my/hubungi-kami/",
  },
  {
    id: "merlimau-serkam",
    placeId: "ChIJQ7jYQADr0TEReq9YSeQ_De0",
    name: "1 Merlimau Safety Driving Centre Sdn. Bhd.",
    address:
      "Lot 3, 9 & 10, Halal Hub Serkam, Kawasan Perindustrian Serkam, 77300 Merlimau, Melaka",
    state: "Melaka",
    district: "Jasin",
    postcode: "77300",
    source: melakaSource,
  },
  {
    id: "malacca-safety-bukit-katil",
    placeId: "ChIJWf4sEQjv0TERDPd0zrsryhE",
    name: "Malacca Safety Driving Centre Sdn. Bhd.",
    address: "9378, Jalan Bukit Katil, 75450 Melaka",
    state: "Melaka",
    district: "Melaka Tengah",
    postcode: "75450",
    source: melakaSource,
  },
];
const instructors = [
  [
    "Cikgu Ridzuan",
    0,
    "amir",
    ["D", "DA"],
    "Melayu",
    6,
    "Kawalan klac dan parkir sisi",
    "Latihan bermula dengan kawalan pedal sebelum beralih kepada parkir dan laluan bandar.",
  ],
  [
    "Cikgu Hana",
    0,
    "aina",
    ["DA"],
    "Inggeris",
    4,
    "Latihan kereta automatik",
    "Setiap sesi memberi ruang untuk mengulang kemahiran baharu mengikut rentak pelajar.",
  ],
  [
    "Cikgu Jian Wei",
    0,
    "daniel",
    ["B2", "D"],
    "Cina",
    8,
    "Persediaan litar dan pemerhatian",
    "Pelajar berlatih membaca keadaan trafik dan menyusun langkah sebelum memasuki simpang.",
  ],
  [
    "Cikgu Alya",
    1,
    "farah",
    ["D", "DA"],
    "Melayu",
    5,
    "Bimbingan pelajar kali pertama",
    "Penerangan ringkas diikuti latihan praktikal supaya pelajar memahami tujuan setiap pergerakan.",
  ],
  [
    "Cikgu Hakim",
    1,
    "hafiz",
    ["B", "B2"],
    "Melayu",
    7,
    "Imbangan dan kawalan motosikal",
    "Sesi litar memberi tumpuan kepada imbangan, brek dan kawalan kelajuan rendah.",
  ],
  [
    "Cikgu Jia Min",
    2,
    "mei-ling",
    ["DA", "QTI"],
    "Cina",
    9,
    "Semakan persediaan ujian",
    "Latihan berperingkat membantu pelajar menyemak rutin sebelum memandu dan mengesan ruang selamat.",
  ],
  [
    "Cikgu Kavitha",
    2,
    "kavitha",
    ["D", "DA"],
    "India",
    5,
    "Teknik parkir dan pemanduan bandar",
    "Pelajar berlatih memilih lorong, menjaga jarak dan meletakkan kereta di petak yang sempit.",
  ],
];
const listings = institutes.map(({ id, placeId, ...school }) => ({
  id,
  kind: "institut",
  payload: {
    ...school,
    maps:
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(school.name) + "&query_place_id=" + placeId,
    bio: "Alamat institusi untuk rujukan direktori prapelancaran.",
  },
}));
if (process.argv.includes("--update-map-links")) {
  const updates = listings.map(({ id, payload }) => {
    const original = "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(payload.name + ", " + payload.address);
    return sql`UPDATE mylesenhub.listings
      SET payload=jsonb_set(payload, '{maps}', to_jsonb(${payload.maps}::text)), updated_at=now()
      WHERE id=${id} AND kind='institut' AND user_id=${"prelaunch-directory-" + id}
        AND payload->>'maps'=${original} RETURNING id`;
  });
  const updated = await sql.transaction(updates);
  console.log("Updated institute map links:", updated.flat().map(row => row.id));
  process.exit(0);
}
for (const [
  name,
  schoolIndex,
  photo,
  spim,
  languages,
  experience,
  other,
  intro,
] of instructors) {
  const school = institutes[schoolIndex];
  listings.push({
    id: name.toLowerCase().replaceAll(" ", "-"),
    kind: "instructor",
    payload: {
      name,
      displayName: name,
      instituteId: school.id,
      institute: school.name,
      state: school.state,
      district: school.district,
      spim,
      languages,
      experience: String(experience),
      other,
      photo: "/media/" + photo + ".webp",
      gallery: ["/media/profile-car.webp"],
      galleryCaptions: {
        "/media/profile-car.webp": "Ilustrasi kereta latihan",
      },
      bio:
        intro +
        " Profil simulasi prapelancaran. Identiti, kelayakan dan hubungan dengan institut direka untuk semakan laman.",
      stakeholderPreview: true,
    },
  });
}
const writes = [];
for (const { id, kind, payload } of listings) {
  const owner = "prelaunch-directory-" + id;
  writes.push(sql`INSERT INTO mylesenhub.accounts (id, name, email, role)
    VALUES (${owner}, ${payload.name}, ${owner + "@example.invalid"}, ${kind}) ON CONFLICT (id) DO NOTHING`);
  writes.push(sql`INSERT INTO mylesenhub.listings (id, user_id, kind, payload)
    VALUES (${id}, ${owner}, ${kind}, ${JSON.stringify(payload)}::jsonb) ON CONFLICT (id) DO NOTHING`);
}
await sql.transaction(writes);
const rows =
  await sql`SELECT kind, payload->>'state' AS state, count(*)::int AS total
  FROM mylesenhub.listings WHERE user_id = ANY(${listings.map(({ id }) => "prelaunch-directory-" + id)})
  GROUP BY kind, payload->>'state' ORDER BY kind, state`;
if (rows.reduce((total, row) => total + row.total, 0) !== listings.length)
  throw new Error(
    "An existing listing uses a reserved seed ID. Review the directory before proceeding.",
  );
console.log(process.env.NEON_BRANCH, rows);
