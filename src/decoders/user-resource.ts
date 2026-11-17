import type { Attachment, SessionHandle, Tab, TabLocation, UserResource } from "~/models";
import { decodeAttachment } from "./attachment";
import { decodeTab } from "./tab";

/** Type of the reference to a file attached to the response (`photoBase64: { _T: 25, V: rank }`). */
const ATTACHED_FILE_TYPE = 25;

/**
 * The photo of the student : the base64 file of the response that the student points to by rank.
 * `files` are the files attached to the user parameters response (`dataNonSec.fichiers`).
 */
const decodeProfilePictureBase64 = (resource: any, files: Array<unknown> | undefined): string | null => {
  if (!resource.avecPhoto || resource.photoBase64?._T !== ATTACHED_FILE_TYPE) return null;

  const file = files?.[resource.photoBase64.V];
  // Pronote wraps the base64 in lines.
  return typeof file === "string" && file !== "" ? file.replace(/[\r\n]/g, "") : null;
};

export const decodeUserResource = (resource: any, session: SessionHandle, files?: Array<unknown>): UserResource => {
  let profilePicture: Attachment | null = null;

  if (resource.avecPhoto) {
    profilePicture = decodeAttachment({
      G: 1,
      N: resource.N,
      L: "photo.jpg"
    }, session);
  }

  const tabs: Map<TabLocation, Tab> = new Map();

  for (const tab of resource.listeOngletsPourPeriodes?.V ?? []) {
    tabs.set(tab.G, decodeTab(tab, session.instance.periods));
  }

  return {
    id: resource.N,
    kind: resource.G,
    name: resource.L,
    establishmentName: resource.Etablissement.V.L,
    className: resource.classeDEleve?.L,
    profilePicture,
    profilePictureBase64: decodeProfilePictureBase64(resource, files),
    tabs,
    isDirector: resource.estDirecteur ?? false,
    isDelegate: resource.estDelegue ?? false,
    isMemberCA: resource.estMembreCA ?? false
  };
};
