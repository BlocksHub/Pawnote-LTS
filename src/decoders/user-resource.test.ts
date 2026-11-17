import { describe, expect, it } from "bun:test";
import type { SessionHandle } from "~/models";
import { decodeUserResource } from "./user-resource";

// Fake data only : two tiny "files" standing for base64 images.
const FILE_A = "/9j/4AAQSkZJRgABAQAA";
const FILE_B = "iVBORw0KGgoAAAANSUhEUg";

// Only the fields the decoder reads.
const session = {
  information: { url: "https://demo.index-education.net/pronote", id: 1, order: 0 },
  instance: { version: [2026, 2, 8], periods: [] }
} as unknown as SessionHandle;

const resource = (extra: Record<string, unknown>) => ({
  N: "student-1",
  G: 4,
  L: "Fake Student",
  Etablissement: { V: { L: "Fake School" } },
  ...extra
});

describe("decodeUserResource : profilePictureBase64", () => {
  it("reads the file the student points to by rank", () => {
    const decoded = decodeUserResource(resource({ avecPhoto: true, photoBase64: { _T: 25, V: 1 } }), session, [FILE_A, FILE_B]);
    expect(decoded.profilePictureBase64).toBe(FILE_B);
  });

  it("removes the line breaks Pronote puts in the base64", () => {
    const wrapped = `${FILE_A.slice(0, 8)}\r\n${FILE_A.slice(8)}`;
    const decoded = decodeUserResource(resource({ avecPhoto: true, photoBase64: { _T: 25, V: 0 } }), session, [wrapped]);
    expect(decoded.profilePictureBase64).toBe(FILE_A);
  });

  it("is null without a photo, without a rank, or with an unknown rank", () => {
    expect(decodeUserResource(resource({ avecPhoto: false }), session, [FILE_A]).profilePictureBase64).toBeNull();
    expect(decodeUserResource(resource({ avecPhoto: true }), session, [FILE_A]).profilePictureBase64).toBeNull();
    expect(decodeUserResource(resource({ avecPhoto: true, photoBase64: { _T: 25, V: 5 } }), session, [FILE_A]).profilePictureBase64).toBeNull();
    expect(decodeUserResource(resource({ avecPhoto: true, photoBase64: { _T: 25, V: 0 } }), session).profilePictureBase64).toBeNull();
  });

  it("keeps profilePicture as before", () => {
    const decoded = decodeUserResource(resource({ avecPhoto: true, photoBase64: { _T: 25, V: 0 } }), session, [FILE_A]);
    expect(decoded.profilePicture).not.toBeNull();
    expect(decodeUserResource(resource({ avecPhoto: false }), session, [FILE_A]).profilePicture).toBeNull();
  });
});
