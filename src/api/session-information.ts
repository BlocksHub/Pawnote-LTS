import { defaultFetcher, type Fetcher, type Request, setCookiesArrayToRequest, setHeaderToRequest } from "@literate.ink/utilities";
import { decodeSessionInformation } from "~/decoders/session-information";
import { encodeAccountKindToPath } from "~/encoders/account-kind";
import { BusyPageError, PageUnavailableError, SuspendedIPError, type AccountKind, type SessionInformation } from "~/models";
import { USER_AGENT } from "./private/user-agent";

const VERSION_FROM_HTML_REGEX = />PRONOTE (?<version>\d+\.\d+\.\d+)/;

/**
 * The error a page that isn't a session page stands for. The suspension and maintenance pages carry
 * no version number either, so this is checked before the version too.
 */
const pageError = (html: string): Error => {
  if (html.includes("Votre adresse IP est provisoirement suspendue")) {
    return new SuspendedIPError();
  }
  else if (html.includes("Le site est momentanément indisponible")) {
    return new BusyPageError();
  }

  return new PageUnavailableError();
};

export const sessionInformation = async (options: {
  base: string
  kind: AccountKind,
  params: Record<string, any>,
  cookies: string[]
}, fetcher: Fetcher = defaultFetcher) => {
  const url = new URL(options.base + "/" + encodeAccountKindToPath(options.kind));
  for (const [key, value] of Object.entries(options.params)) {
    url.searchParams.set(key, value);
  }

  const request: Request = { url, redirect: "manual" };
  setCookiesArrayToRequest(request, options.cookies);
  setHeaderToRequest(request, "User-Agent", USER_AGENT);

  const { content: html } = await fetcher(request);
  const version = html.match(VERSION_FROM_HTML_REGEX)?.groups?.version?.split(".").map(Number);
  if (!version) throw pageError(html);

  try {
    // Remove all spaces and line breaks.
    const body_cleaned = html.replace(/ /ug, "").replace(/\n/ug, "");

    // Find the relaxed JSON of the session, given as the only argument
    // of the `Start(...)` call inside the page's inline script.
    const from = "Start({";
    const start = body_cleaned.indexOf(from);
    if (start === -1) throw new Error("unable to locate the `Start({` marker in the page");

    // Walk the object to find its matching closing brace, since the
    // characters following the call vary between PRONOTE versions.
    const opening = start + from.length - 1;
    let depth = 0;
    let inString = false;
    let quote = "";
    let end = -1;

    for (let index = opening; index < body_cleaned.length; index++) {
      const character = body_cleaned[index];

      if (inString) {
        if (character === "\\") index++;
        else if (character === quote) inString = false;
        continue;
      }

      if (character === "\"" || character === "'") {
        inString = true;
        quote = character;
      }
      else if (character === "{") depth++;
      else if (character === "}") {
        depth--;

        if (depth === 0) {
          end = index + 1;
          break;
        }
      }
    }

    if (end === -1) throw new Error("unable to find the end of the session object in the page");
    const relaxed_data = body_cleaned.substring(opening, end);

    // Convert the relaxed JSON to something we can parse.
    const session_data_string = relaxed_data
      .replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/gu, "\"$2\": ")
      .replace(/'/gu, "\"");

    return {
      information: decodeSessionInformation(JSON.parse(session_data_string), options.base, version),
      version
    };
  }
  catch {
    throw pageError(html);
  }
};
