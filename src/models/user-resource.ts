import type { Attachment } from "./attachment";
import type { Tab } from "./tab";
import type { TabLocation } from "./tab-location";

export type UserResource = Readonly<{
  id: string
  kind: number
  name: string
  className?: string
  establishmentName: string
  /** Attachment of the photo. Pronote 2026 answers 404 for it : prefer `profilePictureBase64`. */
  profilePicture: Attachment | null
  /** The photo (JPEG or PNG) as base64, read from the files attached to the user parameters response. */
  profilePictureBase64: string | null
  isDirector: boolean
  isDelegate: boolean
  isMemberCA: boolean
  tabs: Map<TabLocation, Tab>
}>;
