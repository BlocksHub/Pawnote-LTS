import { RequestFN } from "~/core/request-function";
import { decodeNews } from "~/decoders/news";
import { encodeDomain } from "~/encoders/domain";
import { type News, type SessionHandle, TabLocation } from "~/models";
import { apiProperties } from "./private/api-properties";

export const news = async (session: SessionHandle): Promise<News> => {
  const properties = apiProperties(session);

  const request = new RequestFN(session, "PageActualites", {
    [properties.signature]: { onglet: TabLocation.News },

    [properties.data]: {
      modesAffActus: {
        _T: 26,
        V: encodeDomain([0])
      }
    }
  });

  const response = await request.send();
  const data = response.data[properties.data];

  // Since PRONOTE 2026, the list no longer includes the questions of each item (text, attachments,
  // survey questions): they are fetched one item at a time, as the web page does when one is opened.
  for (const item of data.listeModesAff?.[0]?.listeActualites?.V ?? []) {
    if (!item.listeQuestions) {
      item.listeQuestions = await newsItemQuestions(session, item);
    }
  }

  return decodeNews(data, session);
};

/**
 * The questions (text, attachments, choices) of one item of the list,
 * requested the way PRONOTE's web page requests an item it opens.
 */
const newsItemQuestions = async (session: SessionHandle, item: any): Promise<any> => {
  const properties = apiProperties(session);

  const request = new RequestFN(session, "PageActualites", {
    [properties.signature]: { onglet: TabLocation.News },

    [properties.data]: {
      genreRequeteActualite: 1,
      modeAffActu: 0,
      actualite: encodeNewsItemForDetails(item)
    }
  });

  const response = await request.send();
  const questions = response.data[properties.data].detailsActualite.listeQuestions;

  for (const question of questions.V) {
    if (typeof question.texte?.V === "string") {
      question.texte.V = unescapeOnce(question.texte.V);
    }
  }

  return questions;
};

// References flattened to `{ N, G, L }` and dates without leading zeros ("1/11/2026 23:0:0"), as the
// web page sends them; the item sent back as listed is refused by the server.
const flattenReference = (reference: any): any => reference?.V
  ? { N: reference.V.N, ...(reference.V.G !== undefined ? { G: reference.V.G } : {}), L: reference.V.L }
  : reference;

const unpadDate = (date: any): any => {
  const match = /^(\d+)\/(\d+)\/(\d+) (\d+):(\d+):(\d+)/.exec(date?.V ?? "");
  return match
    ? { _T: 7, V: `${+match[1]}/${+match[2]}/${match[3]} ${+match[4]}:${+match[5]}:${+match[6]}` }
    : date;
};

const encodeNewsItemForDetails = (item: any): any => {
  const { N, L, ...rest } = item;

  return {
    N,
    L,
    Actif: true,
    ...rest,
    nature: flattenReference(item.nature),
    dateDebut: unpadDate(item.dateDebut),
    dateFin: unpadDate(item.dateFin),
    dateCreation: unpadDate(item.dateCreation),
    elmauteur: flattenReference(item.elmauteur),
    public: flattenReference(item.public),
    listeCategories: [],
    DateDebut: unpadDate(item.dateDebut),
    estSelectionne: true
  };
};

// With the mobile user agent, the text comes HTML-escaped once ("&lt;div …&gt;"): exactly one layer
// is removed, in one pass, so that an escaped "&amp;lt;" in the text stays "&lt;".
const ESCAPED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", "#39": "'" };
const unescapeOnce = (text: string): string => /^\s*&lt;/.test(text)
  ? text.replace(/&(amp|lt|gt|quot|apos|#39);/g, (_, entity: string) => ESCAPED[entity])
  : text;
