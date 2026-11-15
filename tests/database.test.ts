import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, it, expect } from "vitest";
import { demoProfile } from "../shared/domain";
import { makePlan } from "../shared/planner";
import { emptyState, weekKey } from "../shared/domain";
let db: PGlite;
const a = "11111111-1111-4111-8111-111111111111",
  b = "22222222-2222-4222-8222-222222222222";
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid,name text,bucket_id text);alter table storage.objects enable row level security;create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;`,
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20261115014928_trojanpath_initial.sql",
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20261115092620_ai_starter_upgrade.sql",
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20261115180604_reversible_completion_xp.sql",
      "utf8",
    ),
  );
  await db.exec(readFileSync("supabase/seed.sql", "utf8"));
  await db.query("insert into auth.users(id) values($1),($2)", [a, b]);
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [a]);
});
afterAll(async () => await db?.close());
it("isolates private records and awards project and quest XP idempotently", async () => {
  await db.query("insert into public.profiles(user_id,data) values($1,$2)", [
    a,
    JSON.stringify(demoProfile),
  ]);
  const project = {
    id: crypto.randomUUID(),
    title: "Test project",
    description: "A verified test project",
    date: "2026-11-14",
    url: "",
    completed: true,
  };
  await db.query(
    "insert into public.projects(id,user_id,data) values($1,$2,$3)",
    [project.id, a, JSON.stringify(project)],
  );
  await db.query("update public.projects set data=$1 where id=$2", [
    JSON.stringify({ ...project, title: "Edited project" }),
    project.id,
  ]);
  expect(
    (
      await db.query<{ n: number }>(
        "select count(*)::int as n from public.xp_events",
      )
    ).rows[0].n,
  ).toBe(1);
  const state = { ...emptyState(), profile: demoProfile };
  const plan = makePlan(demoProfile, state, weekKey(new Date()), "fallback");
  await db.query("select public.save_plan($1)", [JSON.stringify(plan)]);
  await db.query("select public.save_plan($1)", [JSON.stringify(plan)]);
  expect(
    (
      await db.query<{ n: number }>(
        "select count(*)::int as n from public.weekly_plans",
      )
    ).rows[0].n,
  ).toBe(1);
  await db.query("update public.tasks set status='completed' where id=$1", [
    plan.tasks[0].id,
  ]);
  await db.query("update public.tasks set status='completed' where id=$1", [
    plan.tasks[0].id,
  ]);
  expect(
    (
      await db.query<{ n: number }>(
        "select count(*)::int as n from public.xp_events",
      )
    ).rows[0].n,
  ).toBe(2);
  await expect(
    db.query(
      "insert into public.xp_events(user_id,event_key,amount) values($1,$2,900)",
      [a, "fake"],
    ),
  ).rejects.toThrow();
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [b]);
  expect((await db.query("select * from public.profiles")).rows).toHaveLength(
    0,
  );
  expect((await db.query("select * from public.projects")).rows).toHaveLength(
    0,
  );
  expect((await db.query("select * from public.tasks")).rows).toHaveLength(0);
  expect((await db.query("select * from public.xp_events")).rows).toHaveLength(
    0,
  );
  await expect(
    db.query("insert into public.projects(id,user_id,data) values($1,$2,$3)", [
      crypto.randomUUID(),
      a,
      JSON.stringify(project),
    ]),
  ).rejects.toThrow();
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [a]);
  await expect(
    db.query("update public.projects set user_id=$1", [b]),
  ).rejects.toThrow();
});
it("enforces atomic current-week check-ins and durable rate limits", async () => {
  const week = weekKey(new Date());
  const data = { workload: "too busy", completed: [], enjoyed: "building" };
  await db.query(
    "insert into public.check_ins(user_id,week,data) values($1,$2,$3)",
    [a, week, JSON.stringify(data)],
  );
  await db.query(
    "insert into public.check_ins(user_id,week,data) values($1,$2,$3) on conflict(user_id,week) do update set data=excluded.data",
    [a, week, JSON.stringify(data)],
  );
  expect((await db.query("select * from public.check_ins")).rows).toHaveLength(
    1,
  );
  for (let i = 0; i < 10; i++)
    expect(
      (
        await db.query<{ ok: boolean }>(
          "select public.reserve_planning_request() as ok",
        )
      ).rows[0].ok,
    ).toBe(true);
  expect(
    (
      await db.query<{ ok: boolean }>(
        "select public.reserve_planning_request() as ok",
      )
    ).rows[0].ok,
  ).toBe(false);
  await expect(
    db.query(
      "insert into public.check_ins(user_id,week,data) values($1,$2::date+7,$3)",
      [a, week, JSON.stringify(data)],
    ),
  ).rejects.toThrow();
});

it("upgrades only untouched starter plans atomically and preserves completed work", async () => {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [b]);
  await db.query("insert into public.profiles(user_id,data) values($1,$2)", [
    b,
    JSON.stringify(demoProfile),
  ]);
  const state = { ...emptyState(), profile: demoProfile };
  const starter = makePlan(demoProfile, state, weekKey(new Date()), "fallback");
  await db.query("select public.save_plan($1)", [JSON.stringify(starter)]);
  const ai = {
    ...makePlan(demoProfile, state, starter.week, "fallback"),
    source: "gemini",
  };
  const invalid = {
    ...ai,
    tasks: ai.tasks.map((t) => ({ ...t, minutes: 240 })),
  };
  await expect(
    db.query("select public.upgrade_starter_plan($1)", [
      JSON.stringify(invalid),
    ]),
  ).rejects.toThrow();
  expect(
    (await db.query("select source from public.weekly_plans")).rows,
  ).toEqual([{ source: "fallback" }]);
  await db.query("select public.upgrade_starter_plan($1)", [
    JSON.stringify(ai),
  ]);
  expect(
    (await db.query("select source from public.weekly_plans")).rows,
  ).toEqual([{ source: "gemini" }]);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [a]);
  await expect(
    db.query("select public.upgrade_starter_plan($1)", [JSON.stringify(ai)]),
  ).rejects.toThrow("plan has activity");
  expect(
    (await db.query("select id from public.tasks where status='completed'"))
      .rows,
  ).toHaveLength(1);
});

it("deducts completion XP atomically and restores only one award when rechecked", async () => {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [a]);
  const task = (
    await db.query<{ id: string; xp: number }>(
      "select id,xp from public.tasks where status='completed' limit 1",
    )
  ).rows[0];
  const initial = (
    await db.query<{ n: number }>(
      "select sum(amount)::int as n from public.xp_events",
    )
  ).rows[0].n;
  await db.query("update public.tasks set status='suggested' where id=$1", [
    task.id,
  ]);
  expect(
    (
      await db.query<{ n: number }>(
        "select sum(amount)::int as n from public.xp_events",
      )
    ).rows[0].n,
  ).toBe(initial - task.xp);
  await db.query("update public.tasks set status='completed' where id=$1", [
    task.id,
  ]);
  await db.query("update public.tasks set status='completed' where id=$1", [
    task.id,
  ]);
  expect(
    (
      await db.query<{ n: number }>(
        "select sum(amount)::int as n from public.xp_events",
      )
    ).rows[0].n,
  ).toBe(initial);
  const project = (
    await db.query<{ id: string; data: Record<string, unknown> }>(
      "select id,data from public.projects limit 1",
    )
  ).rows[0];
  await db.query("update public.projects set data=$1 where id=$2", [
    JSON.stringify({ ...project.data, completed: false }),
    project.id,
  ]);
  expect(
    (
      await db.query<{ n: number }>(
        "select sum(amount)::int as n from public.xp_events",
      )
    ).rows[0].n,
  ).toBe(initial - 100);
  await db.query("update public.projects set data=$1 where id=$2", [
    JSON.stringify({ ...project.data, completed: true }),
    project.id,
  ]);
  expect(
    (
      await db.query<{ n: number }>(
        "select sum(amount)::int as n from public.xp_events",
      )
    ).rows[0].n,
  ).toBe(initial);
});
