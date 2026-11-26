import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFString, StandardFonts, rgb } from "pdf-lib";
import { instructorGallery, instituteLocation } from "./public-instructor.js";
import { resumeImage } from "./resume-image.js";

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 48;
const contentWidth = pageWidth - margin * 2;
const bottom = 63;
const brand = rgb(0.063, 0.102, 0.267);
const red = rgb(0.83, 0.09, 0.17);
const ink = rgb(0.113, 0.177, 0.286);
const muted = rgb(0.275, 0.357, 0.48);
const lightBlue = rgb(0.91, 0.96, 0.99);
const sky = rgb(0.57, 0.82, 0.99);
const blue = rgb(0.08, 0.32, 0.55);
const white = rgb(1, 1, 1);
const lineColor = rgb(0.85, 0.9, 0.94);
const bodySize = 11;
const bodyLine = 16;

const display = (value) =>
  (Array.isArray(value) ? value.join(", ") : String(value ?? ""))
    .normalize("NFC")
    .replace(/[^\S\n]+/g, " ")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")
    .trim();

function wrap(value, limit, measure) {
  const result = [];
  for (const paragraph of display(value).split("\n")) {
    let line = "";
    for (const word of paragraph.split(" ")) {
      const next = line ? line + " " + word : word;
      if (measure(next) <= limit) {
        line = next;
        continue;
      }
      if (line) result.push(line);
      line = "";
      for (const char of word) {
        if (line && measure(line + char) > limit) {
          result.push(line);
          line = "";
        }
        line += char;
      }
    }
    result.push(line);
  }
  return result;
}

function attachLink(pdf, page, url, x, y, width, height) {
  const annotation = pdf.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [x, y, x + width, y + height],
    Border: [0, 0, 0],
    A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
  });
  page.node.addAnnot(pdf.context.register(annotation));
}

function positionImage(page, image, x, y, width, height) {
  const fit = image.scaleToFit(width, height);
  page.drawImage(image, {
    x: x + (width - fit.width) / 2,
    y: y + (height - fit.height) / 2,
    ...fit,
  });
}

export async function instructorResume(person, institutes, origin, env) {
  const school = instituteLocation(person, institutes);
  const gallery = instructorGallery(person);
  const pdf = await PDFDocument.create();
  pdf.setTitle("Résumé Instructor · " + display(person.name));
  pdf.setAuthor("MyLesenHub");
  pdf.setCreator("MyLesenHub");
  pdf.setSubject("Profil instructor memandu");
  pdf.setLanguage("ms-MY");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const western = new Set(regular.getCharacterSet());
  const unicodeValues = [
    person.name,
    person.bio,
    person.state,
    person.district,
    person.languages,
    person.spim,
    person.experience,
    person.other,
    school.name,
    school.address,
    ...gallery.map(({ caption, alt }) => caption || alt),
  ].map(display);
  const needsUnicode = unicodeValues.some((value) =>
    Array.from(value).some(
      (char) => char !== "\n" && !western.has(char.codePointAt(0)),
    ),
  );
  let unicode, unicodeCharacters;
  if (needsUnicode && env.ASSETS) {
    const response = await env.ASSETS.fetch(origin + "/font/noto-sans-sc.ttf");
    if (response.ok) {
      pdf.registerFontkit(fontkit);
      // Keep the original glyph mapping so PDF viewers paint every CJK character.
      unicode = await pdf.embedFont(await response.arrayBuffer());
      unicodeCharacters = new Set(unicode.getCharacterSet());
    }
  }
  function textOptions(value, weight) {
    const font =
      unicode &&
      Array.from(value).some((char) => !western.has(char.codePointAt(0)))
        ? unicode
        : weight === "bold"
          ? bold
          : regular;
    const characters = font === unicode ? unicodeCharacters : western;
    const text = Array.from(value, (char) =>
      characters.has(char.codePointAt(0)) ? char : "?",
    ).join("");
    return { font, text };
  }
  const width = (value, size, weight) => {
    const { text, font } = textOptions(value, weight);
    return font.widthOfTextAtSize(text, size);
  };
  let page, cursor;
  function draw(value, x, y, size = bodySize, color = ink, weight = "") {
    if (!value) return;
    const { text, font } = textOptions(value, weight);
    page.drawText(text, { x, y, size, font, color });
  }
  const profileUrl =
    origin +
    "/instructor/" +
    encodeURIComponent(person.slug) +
    (person.demo ? "?contoh=1" : "");
  const logo = await resumeImage(
    pdf,
    "/media/brand.webp",
    origin,
    env,
    person.demo,
  );
  function newPage(first = false) {
    page = pdf.addPage([pageWidth, pageHeight]);
    cursor = pageHeight - 108;
    page.drawRectangle({
      x: 0,
      y: pageHeight - 6,
      width: pageWidth,
      height: 6,
      color: brand,
    });
    page.drawRectangle({
      x: pageWidth - 92,
      y: pageHeight - 6,
      width: 92,
      height: 6,
      color: red,
    });
    if (logo) positionImage(page, logo, margin, pageHeight - 48, 92, 26);
    else draw("MyLesenHub", margin, pageHeight - 40, 15, brand, "bold");
    const current = first
      ? "DIREKTORI INSTRUCTOR MEMANDU"
      : "RÉSUMÉ INSTRUCTOR  /  SAMBUNGAN";
    draw(
      current,
      pageWidth - margin - width(current, 8, "bold"),
      pageHeight - 38,
      8,
      muted,
      "bold",
    );

    page.drawLine({
      start: { x: margin, y: 46 },
      end: { x: pageWidth - margin, y: 46 },
      thickness: 0.7,
      color: lineColor,
    });
    draw("Lihat profil di MyLesenHub", margin, 29, 9, blue, "bold");
    attachLink(pdf, page, profileUrl, margin, 26, 115, 13);
    const index = "HALAMAN " + pdf.getPageCount();
    draw(
      index,
      pageWidth - margin - width(index, 8, "bold"),
      29,
      8,
      muted,
      "bold",
    );
  }
  function ensure(height) {
    if (cursor - height < bottom) newPage();
  }
  function section(title) {
    ensure(62);
    page.drawRectangle({
      x: margin,
      y: cursor - 26,
      width: contentWidth,
      height: 26,
      color: lightBlue,
    });
    page.drawRectangle({
      x: margin,
      y: cursor - 26,
      width: 3,
      height: 26,
      color: blue,
    });
    draw(title, margin + 12, cursor - 17, 11, brand, "bold");
    cursor -= 42;
  }
  function paragraph(value, options = {}) {
    const {
      x = margin,
      maxWidth = contentWidth,
      size = bodySize,
      line = bodyLine,
      color = ink,
    } = options;
    for (const text of wrap(value, maxWidth, (part) => width(part, size))) {
      ensure(line);
      draw(text, x, cursor, size, color);
      cursor -= line;
    }
  }
  function field(label, value) {
    const text = display(value);
    if (!text) return;
    const offset = 131;
    const lines = wrap(text, contentWidth - offset, (part) =>
      width(part, bodySize),
    );
    ensure(30);
    draw(label, margin, cursor, 9, muted, "bold");
    for (const part of lines) {
      ensure(bodyLine);
      draw(part, margin + offset, cursor);
      cursor -= bodyLine;
    }
    cursor -= 8;
  }
  function link(label, url) {
    ensure(24);
    draw(label, margin, cursor, 10, blue, "bold");
    attachLink(
      pdf,
      page,
      url,
      margin,
      cursor - 4,
      width(label, 10, "bold") + 5,
      15,
    );
    cursor -= 24;
  }

  newPage(true);
  const photo = await resumeImage(
    pdf,
    person.detailPhoto || person.photo,
    origin,
    env,
    person.demo,
  );
  const left = margin + 19;
  const heroWidth = contentWidth - (photo ? 147 : 38);
  const heroName = person.name || "Instructor memandu";
  const nameSize = display(heroName).length > 65 ? 17 : 26;
  const nameStep = nameSize + 5;
  const nameLines = wrap(heroName, heroWidth, (part) =>
    width(part, nameSize, "bold"),
  );
  const location = [person.district, person.state]
    .map(display)
    .filter(Boolean)
    .join(", ");
  const subLines = wrap(location || "Instructor memandu", heroWidth, (part) =>
    width(part, 10),
  );
  const heroHeight = Math.max(
    124,
    59 + nameLines.length * nameStep + subLines.length * 14,
  );
  const heroTop = pageHeight - 59;
  const heroBottom = heroTop - heroHeight;
  page.drawRectangle({
    x: margin,
    y: heroBottom,
    width: contentWidth,
    height: heroHeight,
    color: brand,
  });
  page.drawRectangle({
    x: margin,
    y: heroBottom,
    width: contentWidth,
    height: 3,
    color: sky,
  });
  draw(
    person.demo ? "RÉSUMÉ INSTRUCTOR  /  PROFIL CONTOH" : "RÉSUMÉ INSTRUCTOR",
    left,
    heroTop - 22,
    9,
    sky,
    "bold",
  );
  cursor = heroTop - 53;
  for (const part of nameLines) {
    draw(part, left, cursor, nameSize, white, "bold");
    cursor -= nameStep;
  }
  cursor += 3;
  for (const part of subLines) {
    draw(part, left, cursor, 10, white);
    cursor -= 14;
  }
  if (photo) {
    const photoLeft = pageWidth - margin - 112;
    const photoBottom = heroBottom + (heroHeight - 96) / 2;
    page.drawRectangle({
      x: photoLeft,
      y: photoBottom,
      width: 94,
      height: 96,
      color: lightBlue,
    });
    positionImage(page, photo, photoLeft + 3, photoBottom + 3, 88, 90);
  }
  cursor = heroBottom - 24;

  if (display(person.bio)) {
    section("Pengenalan");
    paragraph(person.bio);
    cursor -= 8;
  }
  section("Maklumat pengajaran");
  field("Kelas SPIM", person.spim);
  field("Bahasa", person.languages);
  const experience = display(person.experience);
  field(
    "Pengalaman",
    /^\d+(?:\.\d+)?$/.test(experience) ? experience + " tahun" : experience,
  );
  field("Maklumat tambahan", person.other);

  section("Institut memandu");
  field("Institut", school.name);
  field(
    "Alamat",
    school.address ||
      (person.demo
        ? "Alamat sebenar tidak tersedia untuk profil contoh."
        : "Alamat institut belum tersedia."),
  );
  if (school.maps) link(school.mapsLabel, school.maps);

  if (!person.demo && person.phone) {
    section("Maklumat hubungan");
    field("Telefon", person.phone);
    const phone = String(person.phone).replace(/\D/g, "").replace(/^0/, "60");
    if (/^\d{7,15}$/.test(phone))
      link("Hubungi melalui WhatsApp", "https://wa.me/" + phone);
  }

  let hasGallery = false;
  const galleryTitle = person.demo
    ? "Galeri pembelajaran (gambar contoh)"
    : "Galeri pembelajaran";
  const captionSize = 10;
  const captionLine = 14;
  const photoHeight = 126;
  const gutter = 14;
  const columnWidth = (contentWidth - gutter) / 2;
  const captionLines = (text, limit) =>
    text ? wrap(text, limit, (part) => width(part, captionSize)) : [];
  function openGalleryRow(height) {
    const pageNumber = pdf.getPageCount();
    ensure(height + (hasGallery ? 0 : 42));
    if (!hasGallery || pdf.getPageCount() !== pageNumber) {
      section(hasGallery ? "Galeri pembelajaran (sambungan)" : galleryTitle);
      hasGallery = true;
    }
  }
  function galleryPhoto(image, x, top, frameWidth) {
    page.drawRectangle({
      x,
      y: top - photoHeight,
      width: frameWidth,
      height: photoHeight,
      color: lightBlue,
    });
    positionImage(
      page,
      image,
      x + 3,
      top - photoHeight + 3,
      frameWidth - 6,
      photoHeight - 6,
    );
  }
  const photos = [];
  for (const entry of gallery.slice(0, 12)) {
    const image = await resumeImage(pdf, entry.url, origin, env, person.demo);
    const caption = display(entry.caption || entry.alt);
    if (image || caption) photos.push({ image, caption });
  }
  for (let index = 0; index < photos.length;) {
    const first = photos[index];
    const second = photos[index + 1];
    const paired =
      first.image &&
      second?.image &&
      [first, second].every(
        ({ caption }) => captionLines(caption, columnWidth).length <= 4,
      );
    if (paired) {
      const captions = [first, second].map(({ caption }) =>
        captionLines(caption, columnWidth),
      );
      const height =
        photoHeight +
        26 +
        Math.max(...captions.map((parts) => parts.length)) * captionLine;
      openGalleryRow(height);
      for (const [column, entry] of [first, second].entries()) {
        const x = margin + column * (columnWidth + gutter);
        galleryPhoto(entry.image, x, cursor, columnWidth);
        for (const [row, text] of captions[column].entries())
          draw(
            text,
            x,
            cursor - photoHeight - 16 - row * captionLine,
            captionSize,
            muted,
          );
      }
      cursor -= height;
      index += 2;
    } else {
      const lines = captionLines(first.caption, contentWidth);
      const captionHeight = Math.min(lines.length, 2) * captionLine;
      const imageHeight = first.image ? photoHeight + 16 : 0;
      const rowGap = index + 1 < photos.length ? 12 : 0;
      openGalleryRow(imageHeight + captionHeight + rowGap);
      if (first.image) {
        galleryPhoto(first.image, margin, cursor, contentWidth);
        cursor -= photoHeight + 16;
      }
      if (first.caption)
        paragraph(first.caption, {
          color: muted,
          size: captionSize,
          line: captionLine,
        });
      cursor -= rowGap;
      index += 1;
    }
  }
  return pdf.save();
}
