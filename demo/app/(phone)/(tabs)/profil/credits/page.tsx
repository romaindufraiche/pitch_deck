"use client";

import { ExternalLink } from "lucide-react";
import { Screen } from "@/components/screen";
import credits from "@/data/credits.json";

type Credit = { file: string; author: string; source: string; url: string; license: string };

export default function Credits() {
  const list = credits as Credit[];
  const authors = new Set(list.map((c) => c.author)).size;
  return (
    <Screen back title="Crédits photos">
      <div className="px-5 pt-2">
        <p className="text-[13px] leading-relaxed text-mute">
          Les {list.length} photos et vidéos de cette démo proviennent de Pixabay ({authors} auteurs), sous la licence de contenu Pixabay : utilisation libre, y compris commerciale, sans attribution obligatoire. Nous créditons tout de même chaque auteur. Aucune image ne provient d&apos;une marque réelle ; les marques présentées sont fictives.
        </p>
        <ul className="mt-5 grid grid-cols-2 gap-3">
          {list.map((c) => (
            <li key={c.file + c.url}>
              <a href={c.url} target="_blank" rel="noreferrer" className="block">
                {c.file.endsWith(".mp4") ? <video src={c.file} muted className="aspect-[4/5] w-full rounded-2xl object-cover" /> : <img src={c.file} alt="" loading="lazy" className="aspect-[4/5] w-full rounded-2xl object-cover" />}
                <p className="mt-1.5 flex items-center gap-1 truncate text-[11.5px] font-medium">{c.author} <ExternalLink className="size-3 shrink-0 text-mute" /></p>
                <p className="text-[10.5px] text-mute">{c.source}</p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Screen>
  );
}
