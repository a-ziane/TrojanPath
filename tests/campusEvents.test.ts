import { expect, it } from "vitest";
import {
  interestTerms,
  matchEvents,
  normalizeEvent,
} from "../shared/campus-events";
import { fallbackEvents } from "../shared/campus-event-snapshot";
import { demoProfile, emptyState, profileSchema } from "../shared/domain";
import { completedActivities } from "../src/portfolio";
it("matches the teammate calendar snapshot to economics/data interests without generic career-only matches", () => {
  const terms = interestTerms(
    ["Machine learning", "Data analysis"],
    demoProfile.major,
    demoProfile.goal,
  );
  const matched = matchEvents(fallbackEvents, terms);
  expect(matched.length).toBeGreaterThan(0);
  expect(matched.every((e) => e.score > 0)).toBe(true);
  expect(matchEvents(fallbackEvents, ["unrelatedphrase"])).toHaveLength(0);
});
it("normalizes the next event instance and displays plain text rather than source HTML", () => {
  const result = normalizeEvent(
    {
      id: 1,
      title: "USC data talk",
      description_text: "One  useful talk",
      localist_url: "https://calendar.usc.edu/event/data-talk",
      event_instances: [
        { event_instance: { start: "2026-11-01T12:00:00Z" } },
        { event_instance: { start: "2026-11-20T12:00:00Z" } },
      ],
    },
    new Date("2026-11-15T12:00:00Z"),
  );
  expect(result.startsOn).toBe("2026-11-20T12:00:00Z");
  expect(result.description).toBe("One useful talk");
});
it("creates Portfolio suggestions only for confirmed attendance, never an intention to go", () => {
  const event = {
    title: "USC data talk",
    url: "https://calendar.usc.edu/event/data-talk",
    startsOn: "2026-11-01T12:00:00Z",
    going: true,
    attended: false,
    note: "",
  };
  const profile = profileSchema.parse({
    ...demoProfile,
    campusEvents: { test: event },
  });
  const state = { ...emptyState(), profile };
  expect(completedActivities(state)).toHaveLength(0);
  profile.campusEvents!.test = {
    ...event,
    attended: true,
    note: "Learned about the limitations of a data model.",
  };
  expect(completedActivities(state)[0]).toMatchObject({
    id: "event:test",
    kind: "event",
    evidence: "Learned about the limitations of a data model.",
  });
});
