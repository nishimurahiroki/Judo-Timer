// lib/programTimer/templates.ts
// Immutable template Program definitions and factory functions

import type { Program, EditorRow, RoleGroup } from "./types";
import { generateUUID } from "./expand";

export type TemplateId =
  | "template:tachiwaza"
  | "template:ne-waza"
  | "template:judo-training";

// ---------- Base Template Definitions (IMMUTABLE) ----------

type TemplateProgramDef = {
  id: TemplateId;
  title: string;
  rows: EditorRow[];
  roleGroups?: RoleGroup[];
};

const templateProgramsBase: Record<TemplateId, TemplateProgramDef> = {
  "template:tachiwaza": {
    id: "template:tachiwaza",
    title: "Tachi-waza",
    rows: [
      {
        id: "t1-row-1",
        name: "Uchikomi",
        durationSec: 5 * 60,
        setCount: 1,
        hasSides: true,
        personAlternationEnabled: true,
      },
      {
        id: "t1-row-2",
        name: "Interval",
        durationSec: 60,
        setCount: 1,
        hasSides: false,
      },
      {
        id: "t1-row-3",
        name: "Nagekomi",
        durationSec: 20,
        setCount: 3,
        hasSides: true,
      },
      {
        id: "t1-row-4",
        name: "Interval",
        durationSec: 60,
        setCount: 1,
        hasSides: false,
      },
      // Role group: Randori + Interval, repeated 5 sets, Person1/2 ON
      {
        id: "t1-row-5",
        name: "Randori",
        durationSec: 3 * 60,
        setCount: 1,
        hasSides: true,
        roleGroupId: "t1-rg-1",
        setsMode: "fixed",
        fixedSetsCount: 5,
        personAlternationEnabled: true,
      },
      {
        id: "t1-row-6",
        name: "Interval",
        durationSec: 20,
        setCount: 1,
        hasSides: false,
        roleGroupId: "t1-rg-1",
        setsMode: "fixed",
        fixedSetsCount: 5,
        personAlternationEnabled: true,
      },
    ],
    roleGroups: [
      {
        id: "t1-rg-1",
        color: "#00EEFF",
        timerIds: ["t1-row-5", "t1-row-6"],
        setsMode: "fixed",
        fixedSetsCount: 5,
        personAlternationEnabled: true,
      },
    ],
  },

  "template:ne-waza": {
    id: "template:ne-waza",
    title: "Ne-waza",
    rows: [
      {
        id: "t2-row-1",
        name: "Uchikomi",
        durationSec: 3 * 60,
        setCount: 1,
        hasSides: true,
        personAlternationEnabled: true,
      },
      // Role Group A (repeat 3 sets)
      {
        id: "t2-row-2",
        name: "Escape Osae-komi",
        durationSec: 20,
        setCount: 1,
        hasSides: false,
        roleGroupId: "t2-rg-1",
        setsMode: "fixed",
        fixedSetsCount: 3,
      },
      {
        id: "t2-row-3",
        name: "Change the Uke & Tori",
        durationSec: 10,
        setCount: 1,
        hasSides: false,
        roleGroupId: "t2-rg-1",
        setsMode: "fixed",
        fixedSetsCount: 3,
      },
      {
        id: "t2-row-4",
        name: "Escape Osae-komi",
        durationSec: 20,
        setCount: 1,
        hasSides: false,
        roleGroupId: "t2-rg-1",
        setsMode: "fixed",
        fixedSetsCount: 3,
      },
      {
        id: "t2-row-5",
        name: "Change the Partner",
        durationSec: 15,
        setCount: 1,
        hasSides: false,
        roleGroupId: "t2-rg-1",
        setsMode: "fixed",
        fixedSetsCount: 3,
      },
      // Ne-waza Randori: sets = 5
      {
        id: "t2-row-6",
        name: "Ne-waza Randori",
        durationSec: 2 * 60,
        setCount: 5,
        hasSides: false,
      },
    ],
    roleGroups: [
      {
        id: "t2-rg-1",
        color: "#00EEFF",
        timerIds: ["t2-row-2", "t2-row-3", "t2-row-4", "t2-row-5"],
        setsMode: "fixed",
        fixedSetsCount: 3,
        personAlternationEnabled: false,
      },
    ],
  },

  "template:judo-training": {
    id: "template:judo-training",
    title: "Judo Training",
    rows: [
      {
        id: "t3-row-1",
        name: "Leg Rotation Inside",
        durationSec: 40,
        setCount: 1,
        hasSides: false,
      },
      {
        id: "t3-row-2",
        name: "Leg Rotation Outside",
        durationSec: 40,
        setCount: 1,
        hasSides: false,
      },
      {
        id: "t3-row-3",
        name: "Quick Bridge",
        durationSec: 40,
        setCount: 1,
        hasSides: false,
      },
      {
        id: "t3-row-4",
        name: "Judo push up",
        durationSec: 40,
        setCount: 1,
        hasSides: false,
      },
    ],
  },
};

// ---------- Public API ----------

/** Immutable base template (DO NOT MUTATE) */
export function getTemplateProgramDef(templateId: TemplateId): TemplateProgramDef {
  const def = templateProgramsBase[templateId];
  if (!def) {
    throw new Error(`Unknown templateId: ${templateId}`);
  }
  return def;
}

/** Create a fresh Program instance from template (deep clone + new program id) */
export function createProgramFromTemplate(templateId: TemplateId): Program {
  const base = getTemplateProgramDef(templateId);

  const rows: EditorRow[] = base.rows.map((row) => ({
    ...row,
  }));

  const roleGroups: RoleGroup[] | undefined = base.roleGroups
    ? base.roleGroups.map((g) => ({
        ...g,
        timerIds: [...g.timerIds],
      }))
    : undefined;

  return {
    id: generateUUID(),
    title: base.title,
    rows,
    roleGroups,
    origin: {
      type: "template",
      templateId,
    },
  };
}


