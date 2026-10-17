import type { NewsCategory, NewsItem } from "~/models";
import { decodePronoteDate } from "./pronote-date";

export const decodeNewsItem = (item: any, categories: NewsCategory[]): NewsItem => {
  return {
    id: item.N,
    title: item.L,
    // PRONOTE 2026 renamed the category "nature".
    category: categories.find((category) => category.id === (item.categorie ?? item.nature).V.N)!,

    creationDate: decodePronoteDate(item.dateCreation.V),
    startDate: decodePronoteDate(item.dateDebut.V),
    endDate: decodePronoteDate(item.dateFin.V),

    author: item.auteur,
    public: item.public.V,

    read: item.lue
  };
};
